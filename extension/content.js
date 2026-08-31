// ProIndustri AE Scraper — content.js
// Jalan di aliexpress.com: scrape single product + collect listing URLs + inject floating panel
(async function(){
  const RATE = 18000, MARKUP = 2;

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // Auto-replace branding: AliExpress / Ali Express / aliexpress.com -> ProIndustri / ProIndustri.com
  // Dipakai di SEMUA teks hasil scrape (judul, deskripsi, specs, kategori, nama varian).
  // Untuk HTML hanya teks yang diganti — atribut (href/src alicdn, dsb) TIDAK disentuh.
  function replaceBrand(s){
    if(!s) return s;
    s = String(s);
    if(/<[a-z][\s\S]*>/i.test(s)){
      return s.split(/(<[^>]+>)/g).map(function(seg){
        if(seg.charAt(0)==='<' ) return seg; // tag — skip, biar URL/gambar utuh
        return seg.replace(/aliexpress\.com/gi,'proindustri.com').replace(/\bali[\s]*express\b/gi,'ProIndustri');
      }).join('');
    }
    return s.replace(/aliexpress\.com/gi,'proindustri.com').replace(/\bali[\s]*express\b/gi,'ProIndustri');
  }

  async function extractProduct(){
    const url = location.href.split('?')[0].split('#')[0];
    const html = document.documentElement.outerHTML;
    const getMeta = (re) => { const m = html.match(re); return m ? m[1] : ''; };
    const tryJson = (s) => { try{ return JSON.parse(s); } catch{ return null; } };

    let title = getMeta(/<meta property="og:title" content="([^"]+)"/) || document.title || '';
    title = title.replace(/\s*-\s*AliExpress.*$/i,'').trim().slice(0,200);

    // Images
    const images = [];
    const ogImg = getMeta(/<meta property="og:image" content="([^"]+)"/);
    if(ogImg) images.push(ogImg);
    const cdnRe = /https:\/\/ae\d*\.alicdn\.com\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)/gi;
    let m;
    while((m=cdnRe.exec(html))!==null){
      const u = m[0].replace(/_\d+x\d+\.(jpg|png|webp)/,'.$1').replace(/\.jpg_\w+/,'.jpg');
      if(!images.includes(u)) images.push(u);
      if(images.length>=12) break;
    }
    // Featured: first high-res
    const featured = images[0] || '';

    // Price hints
    const priceHints = [];
    const usdRe = /US\s*\$\s*([\d,]+\.?\d*)/gi;
    while((m=usdRe.exec(html))!==null) priceHints.push(parseFloat(m[1].replace(/,/g,'')));
    const jpRe = /"(?:salePrice|minPrice|actSkuPrice|skuPrice|price)"\s*:\s*"?([\d.]+)"?/gi;
    while((m=jpRe.exec(html))!==null){ const v=parseFloat(m[1]); if(v>0.5&&v<10000) priceHints.push(v); }
    // pdp_npi fallback
    try{
      const u = new URL(location.href);
      const npi = u.searchParams.get('pdp_npi') ? decodeURIComponent(u.searchParams.get('pdp_npi')) : '';
      const mm = npi.match(/IDR!([\d.]+)!([\d.]+)/);
      if(mm){ const saleIDR=parseFloat(mm[2]); if(saleIDR>1000) priceHints.push(saleIDR/18000); }
    }catch{}
    let priceUSD = 0;
    if(priceHints.length){ priceHints.sort((a,b)=>a-b); priceUSD = priceHints[Math.floor(priceHints.length/2)]; if(priceUSD>50 && Math.min(...priceHints)<20) priceUSD = Math.min(...priceHints.filter(v=>v>1)); }
    if(!priceUSD) priceUSD = 10;

    // Variants: skuProperty + skuPrice
    let variantsRaw = [], skuPriceMap = {};
    const skuPropRaw = getMeta(/"skuProperty"\s*:\s*(\[[\s\S]*?\])\s*,\s*"skuPrice"/) || html.match(/"skuProperty"\s*:\s*(\[[\s\S]*?\])/)?.[1] || '';
    if(skuPropRaw){ const a=tryJson(skuPropRaw); if(Array.isArray(a)) variantsRaw=a; }
    const skuPriceRaw = html.match(/"skuPrice"\s*:\s*(\{[\s\S]*?\})\s*,\s*"skuProperty"/)?.[1] || html.match(/"skuPrice"\s*:\s*(\{[\s\S]*?\})/)?.[1] || '';
    if(skuPriceRaw){ const o=tryJson(skuPriceRaw); if(o&&typeof o==='object') skuPriceMap=o; }

    let previewVariants = [];
    if(variantsRaw.length && Object.keys(skuPriceMap).length){
      for(const k in skuPriceMap){
        const sp = skuPriceMap[k];
        const p = parseFloat(String(sp?.salePrice||sp?.price||priceUSD).replace(/[^0-9.]/g,''))||priceUSD;
        previewVariants.push({ name: k.slice(0,60)||'Varian', priceUSD:p });
      }
    } else if(variantsRaw.length){
      variantsRaw.forEach(prop=>{
        const pn = prop?.propertyName||prop?.name||'';
        (prop?.values||prop?.skuPropertyValues||[]).forEach(v=>{
          const vn = v?.propertyValueName||v?.name||v?.value||'';
          if(vn) previewVariants.push({ name:(pn?pn+' ':'')+vn, priceUSD });
        });
      });
    }
    if(!previewVariants.length) previewVariants=[{name:'Standard', priceUSD}];

    const toIDR = (usd)=>Math.round(usd*RATE*MARKUP);
    const nice = (n)=>Math.round(n/1000)*1000||n;
    previewVariants = previewVariants.slice(0,12).map(v=>({ name:String(v.name).slice(0,60), priceUSD:v.priceUSD, priceIDR:nice(toIDR(v.priceUSD)), stock:50, min_qty:1 }));

    // Description: tiru WooCommerce ALD — ambil detailDesc/descriptionUrl terpisah, bukan meta
    // ALD: detailDesc = URL ke aeproductsourcesite, lalu fetch URL itu untuk HTML deskripsi lengkap
    let desc = '';
    let descImages = [];
    let descHtml = '';
    let specsHtmlMtop = '';
    let descriptionUrl = '';
    // 1) Cari descriptionUrl — tiru 100% ALD (woo-alidropship/includes/data.php line 447)
    // ALD: preg_match('/"descriptionModule":(.*?),"features":\{\},"feedbackModule"/', $html) -> json -> descriptionUrl
    try{
      // a) ALD primary: "descriptionModule":{...,"descriptionUrl":"https://aeproductsourcesite..."} , "features":{}
      if(!descriptionUrl){
        const mDescMod = html.match(/"descriptionModule"\s*:\s*(\{[\s\S]*?\})\s*,\s*"features"/);
        if(mDescMod && mDescMod[1]){
          try{
            const j = JSON.parse(mDescMod[1]);
            if(j && j.descriptionUrl) descriptionUrl = j.descriptionUrl;
          }catch{
            const mUrl = mDescMod[1].match(/"descriptionUrl"\s*:\s*"([^"]+)"/);
            if(mUrl && mUrl[1]) descriptionUrl = mUrl[1].replace(/\\\//g,'/').replace(/\\u002F/g,'/');
          }
        }
      }
      // b) window.runParams.detailDesc = "https://aeproductsourcesite.alicdn.com/..."
      if(!descriptionUrl){
        const mDetailDesc = html.match(/window\.runParams\.detailDesc\s*=\s*"([^"]+)"/);
        if(mDetailDesc && mDetailDesc[1]) descriptionUrl = mDetailDesc[1];
      }
      // c) descriptionUrl / productDescUrl / detailDesc
      if(!descriptionUrl){
        const m1 = html.match(/"descriptionUrl"\s*:\s*"([^"]+)"/) || html.match(/"productDescUrl"\s*:\s*"([^"]+)"/) || html.match(/"detailDesc"\s*:\s*"([^"]+)"/);
        if(m1 && m1[1]) descriptionUrl = m1[1].replace(/\\\//g,'/').replace(/\\u002F/g,'/');
      }
      // d) description_XXX.detailDesc di data terstruktur (PT data)
      if(!descriptionUrl){
        const mPT = html.match(/"detailDesc"\s*:\s*"((?:https?:)?\/\/[^"]+)"/);
        if(mPT && mPT[1]) descriptionUrl = mPT[1].replace(/\\\//g,'/');
      }
      // e) aeproductsourcesite langsung
      if(!descriptionUrl){
        const mAE = html.match(/https?:\/\/(?:aeproductsourcesite|ae01)\.alicdn\.com\/[^"'\s<>]+\.html/);
        if(mAE) descriptionUrl = mAE[0];
      }
      // f) scan bebas: cari domain aeproductsourcesite di SELURUH HTML — paling andal & kebal terhadap escaping \/ maupun unicode
      if(!descriptionUrl){
        const DOM = 'aeproductsourcesite.alicdn.com';
        const mi = html.indexOf(DOM);
        if(mi > -1){
          // mundur untuk ambil protokol (https:// atau https:\/\/ atau //)
          let s = Math.max(0, mi-12);
          const seg = html.slice(s, mi);
          const pm = seg.match(/(?:https?:)?\\?\/\\?\/$/);
          const start = pm ? mi - pm[0].length : mi;
          // maju ambil path sampai tanda kutip/spasi/angle
          let end = mi + DOM.length;
          while(end < html.length && !/["'\s<>]/.test(html[end])) end++;
          descriptionUrl = html.slice(start, end);
        }
      }
      // g) descriptionModule bisa berisi escaped unicode \u002F — cari blok descriptionModule secara longgar
      if(!descriptionUrl){
        const mDM = html.match(/"descriptionModule"\s*:\s*\{([\s\S]{0,3000}?)\}/);
        if(mDM && mDM[1]){
          const mU = mDM[1].match(/"descriptionUrl"\s*:\s*"([^"]+)"/);
          if(mU && mU[1]) descriptionUrl = mU[1];
        }
      }
      if(descriptionUrl){
        if(descriptionUrl.startsWith('//')) descriptionUrl = 'https:' + descriptionUrl;
        descriptionUrl = descriptionUrl.replace(/\\\//g,'/').replace(/\\u002F/g,'/').replace(/\\u0026/g,'&').trim();
      }
    }catch{}
    // 1.5) CSR FALLBACK (tiru ALD): kalau descriptionUrl masih kosong di HTML statis (produk CSR seperti
    // Bench Drill — runParams kosong, data dimuat via MTOP API), panggil API MTOP yang SAMA dengan halaman:
    // mtop.aliexpress.pdp.pc.query via window.lib.mtop (sudah ada token/sign milik halaman, paling andal).
    if(!descriptionUrl){
      const pid = (location.pathname.match(/\/item\/(\d+)/)||[])[1] || '';
      if(pid){
        try{
          const s = document.createElement('script');
          s.textContent = `(function(){
            var pid = ${JSON.stringify(pid)};
            var ext = '{}';
            try{ ext = JSON.stringify((window._d_c_ && window._d_c_.DCData && window._d_c_.DCData.extParams) || {}); }catch(e){}
            var BS = String.fromCharCode(92);
            var Q = String.fromCharCode(34);
            var SL = String.fromCharCode(47);
            var cleanUrl = function(u){
              try{ return String(u||'').split(BS+SL).join(SL).split(BS+'u002F').join(SL).split(BS+'u0026').join('&'); }catch(e){ return u; }
            };
            var norm = function(u){
              try{ return String(u||'').replace(/(\\.(?:jpg|jpeg|png|webp))_\\d+x\\d+[^/]*$/i,'$1'); }catch(e){ return u; }
            };
            var pushImg = function(arr, u){
              u = cleanUrl(u);
              if(u.indexOf('alicdn.com')>-1){ u = norm(u); if(arr.indexOf(u)===-1) arr.push(u); }
            };
            var collectImgs = function(html, arr){
              if(!html) return arr;
              try{
                var doc = new DOMParser().parseFromString(html,'text/html');
                doc.querySelectorAll('img').forEach(function(img){
                  var u = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original') || '';
                  if(u) pushImg(arr, u);
                });
              }catch(e){}
              var re = /https?:\\/\\/ae\\d*\\.alicdn\\.com\\/[^"'\\s<>]+\\.(?:jpg|jpeg|png|webp)/gi;
              var m; while((m=re.exec(html))!==null) pushImg(arr, m[0]);
              return arr;
            };
            var un = function(t){
              try{
                var m = t.match(/document\\.write\\(\\s*(["'])([\\s\\S]*?)\\1\\s*\\)/);
                if(m && m[2]) t = m[2].replace(/\\\\"/g,Q).replace(/\\\\n/g,String.fromCharCode(10)).replace(/\\\\\\//g,SL);
              }catch(e){}
              return t;
            };
            var done = function(data){
              var el = document.documentElement;
              el.setAttribute('data-pi-desc-url', (data.url||'').slice(0,2000));
              el.setAttribute('data-pi-desc-html', (data.html||'').slice(0,120000));
              el.setAttribute('data-pi-desc-images', JSON.stringify(data.images||[]));
              el.setAttribute('data-pi-specs', (data.specs||'').slice(0,20000));
              el.setAttribute('data-pi-variants', JSON.stringify(data.variants||[]));
              el.setAttribute('data-pi-done', '1');
              try{ el.setAttribute('data-pi-debug', JSON.stringify(data.debug||{})); }catch(e){}
            };
            // Ambil daftar SKU/varian dari skuModule MTOP (produk CSR: variants tidak ada di HTML statis,
            // tapi ada di response mtop.aliexpress.pdp.pc.query -> skuModule.skuPriceList + skuPropList)
            var parseVariants = function(d){
              var out = [];
              try{
                var sm = (d && d.skuModule) || {};
                var priceList = sm.skuPriceList || [];
                // map skuId -> price (untuk kombinasi prop yang harga beda)
                var priceById = {};
                var firstPrice = 0;
                priceList.forEach(function(sp){
                  var p = parseFloat(String(sp.salePrice || sp.price || '').replace(/[^0-9.]/g,''));
                  if(!(p>0)) p = 0;
                  if(sp.skuId) priceById[sp.skuId] = p;
                  if(!firstPrice && p>0) firstPrice = p;
                });
                // skuPropList: prop -> [values] untuk menyusun nama varian rapi
                var propNames = {};
                var propList = sm.skuPropList || [];
                propList.forEach(function(prop){
                  var pn = prop.propName || prop.name || '';
                  (prop.values || []).forEach(function(v){
                    var vid = String(v.valueId || '');
                    var vn = v.name || v.valueName || '';
                    if(vid && vn) propNames[vid] = pn ? (pn+' '+vn) : vn;
                  });
                });
                priceList.forEach(function(sp){
                  var vals = sp.skuVal || {};
                  var parts = [];
                  Object.keys(vals).forEach(function(k){ var n = String(vals[k]||''); if(n && parts.indexOf(n)===-1) parts.push(n); });
                  // prefer nama rapi dari propNames (skip id-numeric)
                  var name = parts.filter(function(p){ return !/^\d+$/.test(p); }).join(' / ') || parts.join(' / ') || 'Standard';
                  var p = priceById[sp.skuId] || firstPrice;
                  if(name && (out.length<30)) out.push({ name: name.slice(0,60), priceUSD: p });
                });
              }catch(e){}
              return out;
            };
            var fetchDesc = function(url, cb){
              if(!url){ cb({html:'', images:[]}); return; }
              try{
                fetch(cleanUrl(url), {headers:{'Accept':'text/html,*/*'}}).then(function(r){ return r.text(); }).then(function(t){
                  if(!t || t.length<10){ cb({html:'', images:[]}); return; }
                  t = un(t);
                  var clean = t.replace(/<script[\\s\\S]*?<\\/script>/gi,'').replace(/<style[\\s\\S]*?<\\/style>/gi,'').trim().slice(0,120000);
                  try{
                    var doc = new DOMParser().parseFromString(clean,'text/html');
                    if(doc.body && doc.body.innerHTML) clean = doc.body.innerHTML;
                  }catch(e){}
                  var imgs = [];
                  collectImgs(clean, imgs);
                  cb({html:clean, images:imgs.slice(0,40)});
                }).catch(function(){ cb({html:'', images:[]}); });
              }catch(e){ cb({html:'', images:[]}); }
            };
            var attempt = function(){
              try{
                if(!window.lib || !window.lib.mtop) return setTimeout(attempt, 300);
                window.lib.mtop.request({
                  api:'mtop.aliexpress.pdp.pc.query',
                  v:'1.0', type:'GET', dataType:'originaljsonp',
                  data:{ productId: pid, _lang:'en_US', _currency:'USD', country:'US',
                         province:'', city:'', channel:'', pdp_ext_f:'', pdpNPI:'',
                         sourceType:'', clientType:'pc', ext: ext }
                }, function(res){
                  try{
                    var d = (res && res.data && res.data.result) || {};
                    var dm = d.descriptionModule || {};
                    var dbg = {
                      mtop: !!(window.lib && window.lib.mtop),
                      hasRes: !!res, keys: Object.keys(d||{}).slice(0,10),
                      dmKeys: Object.keys(dm).slice(0,10),
                      hasDescUrl: !!dm.descriptionUrl,
                      descTextLen: (dm.description||'').length
                    };
                    var url = cleanUrl(dm.descriptionUrl || '');
                    var descText = dm.description || '';
                    var imgs = [];
                    collectImgs(descText, imgs);
                    var specs = '';
                    try{
                      var sm = d.specsModule || {};
                      var props = sm.props || (sm.groups && sm.groups[0] && sm.groups[0].properties) || [];
                      var items = props.slice(0,20).map(function(sp){
                        var k = sp.attrName || sp.name || '', v = sp.attrValue || sp.value || '';
                        if(!k || !v) return '';
                        return '<li class="product-prop"><span class="property-title">'+k+':&nbsp;</span><span class="property-desc">'+v+'</span></li>';
                      }).filter(Boolean).join('');
                      if(items) specs = '<div class="product-specs-list-container"><ul class="product-specs-list">'+items+'</ul></div>';
                    }catch(e){}
                    var variants = parseVariants(d);
                    dbg.variantCount = variants.length;
                    if(url){
                      fetchDesc(url, function(fd){
                        var html = (fd.html && (fd.html.indexOf('<img')>-1 || fd.html.length>300)) ? fd.html : descText;
                        var images = fd.images.length ? fd.images : imgs;
                        done({url:url, html:html, images:images, specs:specs, variants:variants, debug:dbg});
                      });
                    } else {
                      done({url:'', html:descText||'', images:imgs, specs:specs, variants:variants, debug:dbg});
                    }
                  }catch(e){ done({url:'', html:'', images:[], specs:''}); }
                }, function(){});
              }catch(e){}
            };
            attempt();
          })();`;
          (document.head||document.documentElement).appendChild(s);
          setTimeout(()=>{ try{ s.remove(); }catch{} }, 60000);
          // polling hasil MTOP sampai ~8 detik (data-pi-done menandakan selesai)
          const t0 = Date.now();
          while(Date.now()-t0 < 8000){
            if(document.documentElement.getAttribute('data-pi-done')){
              const u = document.documentElement.getAttribute('data-pi-desc-url') || '';
              if(u){
                descriptionUrl = u.replace(/\\\//g,'/').replace(/\\u002F/g,'/').replace(/\\u0026/g,'&').trim();
              }
              break;
            }
            await new Promise(r=>setTimeout(r,200));
          }
          const rawDesc = document.documentElement.getAttribute('data-pi-desc-html') || '';
          if(rawDesc && !descHtml) descHtml = rawDesc;
          const rawSpecs = document.documentElement.getAttribute('data-pi-specs') || '';
          if(rawSpecs) specsHtmlMtop = rawSpecs;
          // image deskripsi dari MTOP/page-context fetch descriptionUrl (produk CSR: deskripsi = deretan image)
          try{
            const rawImgs = document.documentElement.getAttribute('data-pi-desc-images') || '';
            if(rawImgs){
              const arr = JSON.parse(rawImgs);
              for(const u of arr){
                // URL sudah di-normalize di injected script (pushImg→norm); pakai apa adanya
                if(!descImages.includes(u)) descImages.push(u);
              }
            }
          }catch(e){}
          // debug: info MTOP response (untuk diagnosa kalau descriptionUrl/descImages kosong)
          try{
            const dbg = document.documentElement.getAttribute('data-pi-debug');
            if(dbg) console.log('PI: MTOP debug', JSON.parse(dbg));
          }catch(e){}
          // variants dari skuModule MTOP — pakai kalau HTML statis tidak punya SKU (produk CSR)
          try{
            const rv = document.documentElement.getAttribute('data-pi-variants') || '';
            if(rv){
              const arr = JSON.parse(rv);
              if(Array.isArray(arr) && arr.length){
                const isFallback = previewVariants.length===1 && previewVariants[0].name==='Standard';
                if(isFallback || arr.length > previewVariants.length){
                  previewVariants = arr.slice(0,12).map(v=>({
                    name: String(v.name||'Varian').slice(0,60),
                    priceUSD: v.priceUSD || priceUSD,
                    priceIDR: nice(toIDR(v.priceUSD || priceUSD)),
                    stock: 50, min_qty: 1
                  }));
                  console.log('PI: variants dari MTOP skuModule ->', previewVariants.length);
                }
              }
            }
          }catch(e){}
        }catch(e){ console.warn('PI: MTOP fallback gagal', e); }
      }
    }
    // 2) ALD PRIORITY: selalu fetch descriptionUrl DULUAN (tiru get_product_description_from_url ALD)
    // Respon descriptionUrl = HTML deskripsi produk ASLI dari aeproductsourcesite — TANPA heading
    // "Description", TANPA tombol "Report"/"Share"/chrome UI lainnya. Murni konten seller.
    if(descriptionUrl){
      try{
        const r = await fetch(descriptionUrl, { headers: { 'Accept': 'text/html,*/*' } });
        if(r.ok){
          let text = await r.text();
          if(text && text.length>200){
            // descriptionUrl kadang berupa .js berisi document.write("...") — ekstrak HTML-nya
            const dw = text.match(/document\.write\(\s*(["'])([\s\S]*?)\1\s*\)/);
            if(dw && dw[2]) text = dw[2].replace(/\\"/g,'"').replace(/\\n/g,'\n').replace(/\\\//g,'/');
            let clean = text.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').trim().slice(0,60000);
            clean = clean.replace(/<div[^>]*brandPlus[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi,'').trim();
            try{
              const doc = new DOMParser().parseFromString(clean,'text/html');
              if(doc.body && doc.body.innerHTML) clean = doc.body.innerHTML;
            }catch{}
            const valid = (clean.includes('<img') || clean.length>500) && !clean.includes('brandPlus');
            if(valid){
              descHtml = clean;
              const t = (new DOMParser().parseFromString(clean,'text/html').body?.innerText || clean.replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim().slice(0,800);
              if(t.length>20) desc = t;
              const re2 = /https:\/\/ae\d*\.alicdn\.com\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)/gi;
              let m2;
              while((m2=re2.exec(clean))!==null){
                const u = m2[0].replace(/_\d+x\d+\.(jpg|png|webp)/,'.$1').replace(/\.jpg_\w+/,'.jpg');
                if(!descImages.includes(u)) descImages.push(u);
              }
            }
          }
        }
      }catch(e){ console.warn('PI: fetch descriptionUrl (ALD priority) gagal', e); }
    }
    // 2b) FALLBACK DOM — hanya jalan kalau fetch descriptionUrl gagal/tidak ada URL.
    // PENTING: AE punya div "description--brandPlus..." (BrandPlus badge) — BUKAN deskripsi produk. Harus di-skip.
    // Deskripsi asli ada di: #nav-description, iframe aeproductsourcesite, atau descriptionUrl terpisah.
    // NOTE: DOM #nav-description membawa chrome UI (heading "Description", tombol "Report") — di-strip di bawah.
    if(!descHtml){
    try{
      const isBrandPlus = (el)=> el.className && String(el.className).includes('brandPlus');
      const candidates = [
        document.querySelector('#nav-description'),
        document.querySelector('[id*="nav-description"]'),
        document.querySelector('[id*="product-description"]'),
        document.querySelector('[data-spm="description"]'),
        document.querySelector('[class*="detail-desc"]'),
        document.querySelector('[class*="productDesc"]'),
        document.querySelector('#product-description'),
      ].filter(Boolean).filter(el=> !isBrandPlus(el));
      // Jangan pakai [class*="description--"] generik — itu BrandPlus. Cari yang spesifik detailDesc/productDesc saja.
      const iframes = Array.from(document.querySelectorAll('iframe')).filter(f=> (f.src||'').includes('alicdn.com') || (f.src||'').includes('aeproduct'));
      for(const fr of iframes){
        try{
          const doc = fr.contentDocument || fr.contentWindow?.document;
          if(doc){
            const imgs = Array.from(doc.querySelectorAll('img')).map(img=>img.src||img.dataset.src||'').filter(u=>u.includes('alicdn.com'));
            imgs.forEach(u=>{
              const clean = u.replace(/_\d+x\d+\.(jpg|png|webp)/,'.$1').replace(/\.jpg_\w+/,'.jpg');
              if(!descImages.includes(clean)) descImages.push(clean);
            });
            if(doc.body && doc.body.innerHTML && doc.body.innerHTML.includes('<img')){
              let raw = doc.body.innerHTML.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'');
              if(raw.length > descHtml.length) descHtml = raw;
              const t = doc.body.innerText || '';
              if(t.trim().length>20 && !desc) desc = t.trim().slice(0,800);
            }
          }
        }catch{}
      }
      for(const el of candidates){
        if(!el) continue;
        if(isBrandPlus(el)) continue;
        const imgs = Array.from(el.querySelectorAll('img')).map(img=>img.src||img.dataset.src||img.getAttribute('data-src')||'').filter(u=>u.includes('alicdn.com'));
        imgs.forEach(u=>{
          const clean = u.replace(/_\d+x\d+\.(jpg|png|webp)/,'.$1').replace(/\.jpg_\w+/,'.jpg');
          if(!descImages.includes(clean)) descImages.push(clean);
        });
        let rawHtml = el.innerHTML || '';
        rawHtml = rawHtml.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'');
        if(rawHtml.includes('<img') && rawHtml.length > descHtml.length){
          descHtml = rawHtml;
          const t = el.innerText || el.textContent || '';
          if(t.trim().length>20 && !desc) desc = t.trim().slice(0,800);
        }
      }
      if(!descHtml){
        const navEl = document.querySelector('#nav-description') || document.querySelector('[id*="description"]');
        if(navEl){
          const allImgs = Array.from(navEl.querySelectorAll('img'));
          allImgs.forEach(img=>{
            const u = img.src || img.dataset.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
            if(u.includes('alicdn.com')){
              const clean = u.replace(/_\d+x\d+\.(jpg|png|webp)/,'.$1').replace(/\.jpg_\w+/,'.jpg');
              if(!descImages.includes(clean)) descImages.push(clean);
            }
          });
          if(allImgs.length){
            let rawHtml = navEl.innerHTML.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'');
            if(rawHtml.length>100) descHtml = rawHtml;
          }
        }
      }
    }catch{}
    } // /if(!descHtml) — DOM fallback hanya kalau fetch descriptionUrl gagal/tidak ada
    // 2c) Safety net: kalau masih placeholder, fetch descriptionUrl sekali lagi (guard kedua, tiru ALD)
    const isPlaceholder = (h)=> !h || h.length < 100 || h.includes('brandPlus') || (h.includes('Buy ') && h.includes('at Aliexpress for')) || h.startsWith('<p>') && !h.includes('<img');
    if(descriptionUrl && isPlaceholder(descHtml)){
      try{
        const r = await fetch(descriptionUrl, { headers: { 'Accept': 'text/html,*/*' } });
        if(r.ok){
          let text = await r.text();
          if(text && text.length>200){
            // descriptionUrl kadang berupa .js berisi document.write("...") — ekstrak HTML-nya
            const dw = text.match(/document\.write\(\s*(["'])([\s\S]*?)\1\s*\)/);
            if(dw && dw[2]) text = dw[2].replace(/\\"/g,'"').replace(/\\n/g,'\n').replace(/\\\//g,'/');
            let clean = text.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').trim().slice(0,60000);
            clean = clean.replace(/<div[^>]*brandPlus[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi,'').trim();
            // Ambil hanya <body> kalau respon berupa full HTML
            try{
              const doc = new DOMParser().parseFromString(clean,'text/html');
              if(doc.body && doc.body.innerHTML){ clean = doc.body.innerHTML; }
            }catch{}
            if((clean.includes('<img') || clean.length>500) && !clean.includes('brandPlus')){
              descHtml = clean;
              const t = (new DOMParser().parseFromString(clean,'text/html').body?.innerText || clean.replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim().slice(0,800);
              if(t.length>20) desc = t;
              const re2 = /https:\/\/ae\d*\.alicdn\.com\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)/gi;
              let m2;
              while((m2=re2.exec(clean))!==null){
                const u = m2[0].replace(/_\d+x\d+\.(jpg|png|webp)/,'.$1').replace(/\.jpg_\w+/,'.jpg');
                if(!descImages.includes(u)) descImages.push(u);
              }
            }
          }
        }
      }catch(e){ console.warn('PI: fetch descriptionUrl gagal', e); }
    }
    // 3) Simpan descriptionUrl untuk di-fetch di popup (seperti ALD: get_product_description_from_url)
    // Jika DOM belum ada descHtml, popup akan fetch descriptionUrl via background
    let _descriptionUrl = descriptionUrl;
    // 4) Fallback: meta + alicdn images dari HTML
    if(!descHtml){
      desc = desc || getMeta(/<meta name="description" content="([^"]+)"/) || getMeta(/<meta property="og:description" content="([^"]+)"/) || title || '';
      desc = desc.slice(0,800);
      const scope = html.slice(0,120000);
      const dRe = /https:\/\/ae\d*\.alicdn\.com\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)/gi;
      let idx=0;
      while((m=dRe.exec(scope))!==null){
        const u=m[0].replace(/_\d+x\d+\.(jpg|png|webp)/,'.$1').replace(/\.jpg_\w+/,'.jpg');
        if(idx++<12) continue;
        if(!descImages.includes(u)) descImages.push(u);
        if(descImages.length>=20) break;
      }
      if(desc) descHtml = '<p>'+esc(desc)+'</p>';
      if(descImages.length) descHtml += '\n' + descImages.map(u=>`<img src="${u}" alt="" loading="lazy" style="max-width:100%;height:auto;display:block;margin:12px 0;border-radius:8px">`).join('\n');
      if(!desc) desc = title;
    } else {
      if(!desc) desc = title || descHtml.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,800) || title;
      // Guard: jika descHtml cuma BrandPlus / meta placeholder, jangan pakai
      if((descHtml.includes('brandPlus') || (descHtml.includes('Buy ') && descHtml.includes('at Aliexpress for'))) && descHtml.length<2000){
        // BrandPlus atau meta pendek — bukan deskripsi produk asli. Kosongkan biar trigger fetch descriptionUrl
        descHtml = '';
        if(descImages.length) descHtml = descImages.map(u=>`<img src="${u}" alt="" loading="lazy" style="max-width:100%;height:auto;display:block;margin:12px 0;border-radius:8px">`).join('\n');
        else descHtml = '<p>'+esc(desc)+'</p>';
      } else if(descHtml.includes('brandPlus') && descHtml.length>=500){
        // Ada BrandPlus campur deskripsi — buang BrandPlus section saja
        descHtml = descHtml.replace(/<div[^>]*brandPlus[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi,'').trim();
        if(!descHtml || descHtml.length<100) descHtml = descImages.map(u=>`<img src="${u}" alt="" loading="lazy" style="max-width:100%;height:auto;display:block;margin:12px 0;border-radius:8px">`).join('\n');
      }
    }

    // Specs: tiru ALD specsModule -> short_description (product-specs-list)
    let specsHtml = '';
    try{
      const mSpecs = html.match(/"specsModule"\s*:\s*(\{[\s\S]*?\})\s*,\s*"(?:store|price|shipping|action|description)Module"/);
      if(mSpecs && mSpecs[1]){
        const j = JSON.parse(mSpecs[1]);
        const props = j?.props || j?.properties || j?.specs || [];
        const list = Array.isArray(props) ? props : (Array.isArray(j?.groups?.[0]?.properties) ? j.groups[0].properties : []);
        if(list.length){
          const items = list.slice(0,20).map(s=>{
            const k = esc(s.attrName||s.name||s.title||'');
            const v = esc(s.attrValue||s.value||'');
            if(!k||!v) return '';
            return `<li class="product-prop"><span class="property-title">`+k+`:&nbsp;</span><span class="property-desc">`+v+`</span></li>`;
          }).filter(Boolean).join('');
          if(items) specsHtml = `<div class="product-specs-list-container"><ul class="product-specs-list">`+items+`</ul></div>`;
        }
      }
      if(!specsHtml){
        // Fallback: DOM table specs
        const specEls = Array.from(document.querySelectorAll('[class*="spec"],[class*="property"]')).slice(0,20);
        if(specEls.length){
          const items = specEls.map(el=>{
            const k = (el.querySelector('[class*="title"],[class*="name"]')?.innerText||'').trim();
            const v = (el.querySelector('[class*="desc"],[class*="value"]')?.innerText||'').trim();
            if(!k||!v) return '';
            return `<li class="product-prop"><span class="property-title">`+esc(k)+`:&nbsp;</span><span class="property-desc">`+esc(v)+`</span></li>`;
          }).filter(Boolean).join('');
          if(items) specsHtml = `<div class="product-specs-list-container"><ul class="product-specs-list">`+items+`</ul></div>`;
        }
      }
    }catch{}
    if(!specsHtml && specsHtmlMtop) specsHtml = specsHtmlMtop; // CSR: specs dari MTOP API (tiru ALD specsModule)
    if(specsHtml){
      if(descHtml && descHtml.length > 50 && !descHtml.includes('brandPlus') && !(descHtml.includes('Buy ') && descHtml.includes('at Aliexpress for'))){
        descHtml = descHtml + '\n' + specsHtml;  // desc asli dulu, specs di bawah
      } else {
        descHtml = specsHtml;  // fallback jika tidak ada desc asli
      }
    }

    // Category guess from breadcrumb / title
    let category = 'Mesin & Tools';
    const catText = (document.querySelector('[class*="breadcrumb"]')?.innerText || '').toLowerCase();
    if(catText.includes('electronic')||catText.includes('tool')) category='Elektronik & Power Tools';
    else if(catText.includes('safety')||catText.includes('helmet')||catText.includes('glove')) category='Safety & Perlengkapan';

    return { title: replaceBrand(title), desc: replaceBrand(desc), descHtml: replaceBrand(descHtml), descImages, images, featured, variants: previewVariants.map(v=>({...v, name: replaceBrand(v.name)})), priceUSD, aeUrl: location.href, category: replaceBrand(category), descriptionUrl: _descriptionUrl, specsHtml: replaceBrand(specsHtml) };
  }

  function collectListingUrls(){
    const urls = new Set();
    document.querySelectorAll('a[href*="aliexpress.com/item/"]').forEach(a=>{
      try{
        const u = new URL(a.href, location.href);
        if(u.hostname.includes('aliexpress.com') && u.pathname.includes('/item/')){
          u.search=''; u.hash='';
          urls.add(u.toString());
        }
      }catch{}
    });
    return Array.from(urls);
  }

  // Message handler for popup/background
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
    if(msg.type==='PI_SCRAPE_SINGLE'){
      extractProduct().then(data=>sendResponse({ ok:true, data })).catch(e=>sendResponse({ ok:false, error:e.message }));
      return true;
    }
    if(msg.type==='PI_COLLECT_LISTING'){
      try{ sendResponse({ ok:true, urls: collectListingUrls() }); }catch(e){ sendResponse({ ok:false, error:e.message }); }
      return true;
    }
  });

  // Floating panel on listing/search pages
  function isListing(){
    return /aliexpress\.com\/(w\/wholesale|ss\/|category|store)/.test(location.href) || document.querySelectorAll('a[href*="/item/"]').length >= 6;
  }

  function injectPanel(){
    if(document.getElementById('pi-ae-panel')) return;
    if(!isListing()) return;
    const div = document.createElement('div');
    div.id='pi-ae-panel';
    div.style.cssText='position:fixed;bottom:16px;right:16px;z-index:999999;background:#fff;border:1px solid #e5ddd2;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,.2);padding:12px 14px;font-family:sans-serif;min-width:280px;max-width:360px';
    div.innerHTML=`
      <div style="font-weight:800;font-size:13px;margin-bottom:8px">ProIndustri AE Scraper</div>
      <div id="pi-ae-count" style="font-size:12px;color:#6b6152;margin-bottom:8px">Mendeteksi produk...</div>
      <div style="display:flex;gap:8px">
        <button id="pi-ae-collect" style="flex:1;background:#ff6a00;color:#fff;border:none;border-radius:8px;padding:8px 12px;font-weight:800;cursor:pointer;font-size:12px">Kumpulkan URL</button>
        <button id="pi-ae-open" style="background:#fff;border:1px solid #e5ddd2;border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer;font-size:12px">Buka Popup</button>
      </div>
      <div id="pi-ae-list" style="max-height:200px;overflow:auto;margin-top:8px;display:none;font-size:11px"></div>
    `;
    document.body.appendChild(div);
    const updateCount = ()=>{
      const n = collectListingUrls().length;
      const el=document.getElementById('pi-ae-count');
      if(el) el.textContent = n ? `${n} produk terdeteksi di halaman ini` : 'Scroll halaman untuk load produk...';
    };
    updateCount();
    setInterval(updateCount, 2000);
    document.getElementById('pi-ae-collect').onclick=()=>{
      const urls=collectListingUrls();
      const listEl=document.getElementById('pi-ae-list');
      if(!urls.length){ alert('Tidak ada produk terdeteksi. Scroll dulu.'); return; }
      listEl.style.display='block';
      listEl.innerHTML = `<div style="margin-bottom:6px"><label style="font-weight:700"><input type="checkbox" id="pi-ae-all" checked> Pilih semua (${urls.length})</label></div>` + urls.map((u,i)=>`<label style="display:flex;gap:6px;align-items:center;padding:3px 0;border-bottom:1px solid #f0ebe2"><input type="checkbox" class="pi-ae-chk" data-url="${esc(u)}" checked><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${esc(u.slice(0,70))}</span></label>`).join('') + `<button id="pi-ae-send" style="margin-top:8px;width:100%;background:#ff6a00;color:#fff;border:none;border-radius:8px;padding:8px;font-weight:800;cursor:pointer">Kirim ${urls.length} ke Popup</button>`;
      document.getElementById('pi-ae-all').onchange=(e)=>{
        listEl.querySelectorAll('.pi-ae-chk').forEach(c=>c.checked=e.target.checked);
      };
      document.getElementById('pi-ae-send').onclick=()=>{
        const sel = Array.from(listEl.querySelectorAll('.pi-ae-chk:checked')).map(c=>c.dataset.url);
        if(!sel.length){ alert('Pilih minimal 1'); return; }
        chrome.storage.local.set({ pi_bulk_urls: sel }, ()=>{
          alert(sel.length+' URL disimpan. Buka popup extension untuk scrape bulk.');
        });
      };
    };
    document.getElementById('pi-ae-open').onclick=()=>{
      alert('Buka popup extension di toolbar (ikon ProIndustri) untuk scrape.');
    };
  }

  // Inject single-product button
  function injectSingleBtn(){
    if(document.getElementById('pi-ae-single-btn')) return;
    if(!/aliexpress\.com\/item\//.test(location.href)) return;
    const btn = document.createElement('button');
    btn.id='pi-ae-single-btn';
    btn.textContent='Scrape → ProIndustri';
    btn.style.cssText='position:fixed;bottom:16px;right:16px;z-index:999999;background:#ff6a00;color:#fff;border:none;border-radius:999px;padding:12px 20px;font-weight:900;box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer;font-size:13px';
    btn.onclick=()=>{
      btn.textContent='Menyimpan...';
      extractProduct().then(data=>{
        chrome.storage.local.get(['pi_single_queue'], (r)=>{
          const q = r.pi_single_queue||[];
          q.push(data);
          chrome.storage.local.set({ pi_single_queue:q }, ()=>{
            btn.textContent='Tersimpan ✓ Buka popup';
            setTimeout(()=>btn.textContent='Scrape → ProIndustri',2000);
          });
        });
      }).catch(e=>{ btn.textContent='Gagal: '+e.message; setTimeout(()=>btn.textContent='Scrape → ProIndustri',3000); });
    };
    document.body.appendChild(btn);
  }

  setTimeout(()=>{ injectPanel(); injectSingleBtn(); }, 1500);
  let lastUrl=location.href;
  setInterval(()=>{
    if(location.href!==lastUrl){ lastUrl=location.href; setTimeout(()=>{ injectPanel(); injectSingleBtn(); }, 1000); }
  }, 1000);
})();
