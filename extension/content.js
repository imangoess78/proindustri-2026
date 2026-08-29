// ProIndustri AE Scraper — content.js
// Jalan di aliexpress.com: scrape single product + collect listing URLs + inject floating panel
(function(){
  const RATE = 18000, MARKUP = 2;

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function extractProduct(){
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
    const cdnRe = /https:\/\/ae\d*\.alicdn\.com\/[^"'\\s<>]+\.(?:jpg|jpeg|png|webp)/gi;
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
        const mAE = html.match(/https?:\/\/(?:aeproductsourcesite|ae01)\.alicdn\.com\/[^"'\\\s<>]+\.html/);
        if(mAE) descriptionUrl = mAE[0];
      }
      if(descriptionUrl){
        if(descriptionUrl.startsWith('//')) descriptionUrl = 'https:' + descriptionUrl;
        descriptionUrl = descriptionUrl.replace(/\\\//g,'/').replace(/\\u002F/g,'/').trim();
      }
    }catch{}
    // 2) Coba DOM #nav-description / iframe (paling lengkap di browser)
    // PENTING: AE punya div "description--brandPlus..." (BrandPlus badge) — BUKAN deskripsi produk. Harus di-skip.
    // Deskripsi asli ada di: #nav-description, iframe aeproductsourcesite, atau descriptionUrl terpisah.
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
    // 3) Simpan descriptionUrl untuk di-fetch di popup (seperti ALD: get_product_description_from_url)
    // Jika DOM belum ada descHtml, popup akan fetch descriptionUrl via background
    let _descriptionUrl = descriptionUrl;
    // 4) Fallback: meta + alicdn images dari HTML
    if(!descHtml){
      desc = desc || getMeta(/<meta name="description" content="([^"]+)"/) || getMeta(/<meta property="og:description" content="([^"]+)"/) || title || '';
      desc = desc.slice(0,800);
      const scope = html.slice(0,120000);
      const dRe = /https:\/\/ae\d*\.alicdn\.com\/[^"'\\s<>]+\.(?:jpg|jpeg|png|webp)/gi;
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
    if(specsHtml) descHtml = specsHtml + (descHtml||'');

    // Category guess from breadcrumb / title
    let category = 'Mesin & Tools';
    const catText = (document.querySelector('[class*="breadcrumb"]')?.innerText || '').toLowerCase();
    if(catText.includes('electronic')||catText.includes('tool')) category='Elektronik & Power Tools';
    else if(catText.includes('safety')||catText.includes('helmet')||catText.includes('glove')) category='Safety & Perlengkapan';

    return { title, desc, descHtml, descImages, images, featured, variants: previewVariants, priceUSD, aeUrl: location.href, category, descriptionUrl: _descriptionUrl };
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
      try{ sendResponse({ ok:true, data: extractProduct() }); }catch(e){ sendResponse({ ok:false, error:e.message }); }
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
      const data = extractProduct();
      chrome.storage.local.get(['pi_single_queue'], (r)=>{
        const q = r.pi_single_queue||[];
        q.push(data);
        chrome.storage.local.set({ pi_single_queue:q }, ()=>{
          btn.textContent='Tersimpan ✓ Buka popup';
          setTimeout(()=>btn.textContent='Scrape → ProIndustri',2000);
        });
      });
    };
    document.body.appendChild(btn);
  }

  setTimeout(()=>{ injectPanel(); injectSingleBtn(); }, 1500);
  let lastUrl=location.href;
  setInterval(()=>{
    if(location.href!==lastUrl){ lastUrl=location.href; setTimeout(()=>{ injectPanel(); injectSingleBtn(); }, 1000); }
  }, 1000);
})();
