// popup.js — scrape, preview, WebP optimize, bulk, post to ProIndustri
const $ = (s)=>document.querySelector(s);
const RATE_DEFAULT = 18000, MARKUP_DEFAULT = 2;

// Auto-replace branding: AliExpress / Ali Express / aliexpress.com -> ProIndustri / ProIndustri.com
function replaceBrand(s){
  if(!s) return s;
  s = String(s);
  if(/<[a-z][\s\S]*>/i.test(s)){
    return s.split(/(<[^>]+>)/g).map(function(seg){
      if(seg.charAt(0)==='<') return seg; // tag — skip, biar URL/gambar utuh
      return seg.replace(/aliexpress\.com/gi,'proindustri.com').replace(/\bali[\s]*express\b/gi,'ProIndustri');
    }).join('');
  }
  return s.replace(/aliexpress\.com/gi,'proindustri.com').replace(/\bali[\s]*express\b/gi,'ProIndustri');
}

function getCfg(cb){
  chrome.storage.local.get({ pi_cfg: { base:'https://proindustri.com', token:'', rate:18000, markup:2 } }, r=>cb(r.pi_cfg));
}
function saveCfg(cfg){ chrome.storage.local.set({ pi_cfg: cfg }); }

async function fetchWithTimeout(url, opts={}, ms=15000){
  const c = new AbortController();
  const t = setTimeout(()=>c.abort(), ms);
  try{ return await fetch(url, { ...opts, signal:c.signal }); } finally{ clearTimeout(t); }
}

// Tabs
document.querySelectorAll('.tab').forEach(t=>{
  t.onclick=()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.pane').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById('pane-'+t.dataset.tab).classList.add('active');
  };
});

// Admin link — auto-ambil token dari tab admin yang terbuka
document.getElementById('linkAdmin')?.addEventListener('click', async (e)=>{
  e.preventDefault();
  const cfg = await new Promise(r=>getCfg(r));
  const base = (cfg.base||'https://proindustri.com').replace(/\/$/,'');
  // Coba baca token dari tab admin yang sudah login
  try{
    const tabs = await chrome.tabs.query({ url: base + '/admin*' });
    if(tabs.length){
      for(const t of tabs){
        try{
          const res = await chrome.scripting.executeScript({ target:{tabId:t.id}, func:()=>localStorage.getItem('mp_admin_token')||'' });
          const tok = res?.[0]?.result || '';
          if(tok){
            const c = { ...cfg, token: tok };
            saveCfg(c);
            document.getElementById('cfgToken').value = tok;
            document.getElementById('cfgMsg').textContent = 'Token auto-terisi ✓';
            setTimeout(()=>document.getElementById('cfgMsg').textContent='',2000);
            chrome.tabs.update(t.id, { active:true });
            window.close();
            return;
          }
        }catch{}
      }
    }
  }catch{}
  // Fallback: buka admin
  chrome.tabs.create({ url: base + '/admin' });
});

// Settings
getCfg(cfg=>{
  $('#cfgBase').value=cfg.base||'https://proindustri.com';
  $('#cfgToken').value=cfg.token||'';
  $('#cfgRate').value=cfg.rate||18000;
  $('#cfgMarkup').value=cfg.markup||2;
});
async function autoFillToken(){
  const cfg = await new Promise(r=>getCfg(r));
  const base = (cfg.base||'https://proindustri.com').replace(/\/$/,'');
  try{
    const tabs = await chrome.tabs.query({ url: base + '/admin*' });
    if(!tabs.length){ $('#cfgMsg').textContent='Buka proindustri.com/admin & login dulu'; return false; }
    for(const t of tabs){
      try{
        const res = await chrome.scripting.executeScript({ target:{tabId:t.id}, func:()=>localStorage.getItem('mp_admin_token')||'' });
        const tok = res?.[0]?.result || '';
        if(tok){
          const c = { ...cfg, base, token: tok };
          saveCfg(c);
          $('#cfgToken').value = tok;
          $('#cfgMsg').textContent='Token auto-terisi ✓';
          setTimeout(()=>$('#cfgMsg').textContent='',2000);
          return true;
        }
      }catch{}
    }
    $('#cfgMsg').textContent='Login admin dulu di tab proindustri.com/admin';
    return false;
  }catch(e){ $('#cfgMsg').textContent='Error: '+e.message; return false; }
}
document.getElementById('btnAutoToken')?.addEventListener('click', autoFillToken);
$('#btnSaveCfg').onclick=()=>{
  const cfg={ base:$('#cfgBase').value.trim().replace(/\/$/,''), token:$('#cfgToken').value.trim(), rate:parseInt($('#cfgRate').value)||18000, markup:parseFloat($('#cfgMarkup').value)||2 };
  saveCfg(cfg);
  $('#cfgMsg').textContent='Tersimpan ✓';
  setTimeout(()=>$('#cfgMsg').textContent='',1500);
};

// Helpers
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fmt(n){ return 'Rp'+Math.round(n).toLocaleString('id-ID'); }

let singleData = null;
let bulkData = [];

function renderSingle(d){
  singleData = d;
  const cfgRate = parseInt($('#cfgRate').value)||18000;
  const cfgMarkup = parseFloat($('#cfgMarkup').value)||2;
  // recalc price if cfg changed
  const toIDR = (usd)=>Math.round(usd*cfgRate*cfgMarkup);
  const nice=(n)=>Math.round(n/1000)*1000||n;
  const variants = d.variants||[];
  $('#singlePreview').innerHTML = `
    <div class="card">
      <div style="display:flex;gap:8px">
        <img class="thumb" src="${esc(d.featured||d.images?.[0]||'')}" onerror="this.style.display='none'">
        <div style="flex:1;min-width:0">
          <div style="font-weight:800;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(d.title)}</div>
          <div class="small">${esc(d.category||'')} · ${variants.length} varian · ${esc((d.aeUrl||'').slice(0,50))}</div>
          <div class="small">${variants.map(v=>esc(v.name)+' '+fmt(nice(toIDR(v.priceUSD||10)))).join(' | ').slice(0,120)}</div>
        </div>
      </div>
      <div class="small" style="margin-top:6px;max-height:60px;overflow:auto">${esc((d.desc||'').slice(0,200))}</div>
      ${d.descImages?.length?`<div class="small">${d.descImages.length} gambar deskripsi (embed)</div>`:''}
      <div style="display:flex;gap:6px;margin-top:8px">
        <button class="btn" id="btnPostSingle">Post ke ProIndustri</button>
        <button class="btn btn-outline" id="btnCopyJson">Copy JSON</button>
      </div>
      <div id="singlePostLog" class="small" style="margin-top:6px"></div>
    </div>
  `;
  $('#btnPostSingle').onclick=()=>postSingle();
  $('#btnCopyJson').onclick=()=>{
    navigator.clipboard.writeText(JSON.stringify(d,null,2));
    $('#singlePostLog').textContent='JSON copied';
  };
}

async function scrapeCurrentTab(){
  const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
  if(!tab?.id) throw new Error('No active tab');
  // Coba trigger load #nav-description dulu (scroll ke anchor) — seperti ALD extension
  try{
    await chrome.scripting.executeScript({ target:{tabId:tab.id}, func:()=>{
      const el = document.querySelector('#nav-description') || document.querySelector('[id*="description"]');
      if(el) el.scrollIntoView({ behavior:'instant', block:'start' });
      const tabBtn = document.querySelector('[data-spm*="description"]') || document.querySelector('a[href="#nav-description"]');
      if(tabBtn) try{ tabBtn.click(); }catch{}
    }});
    await new Promise(r=>setTimeout(r, 1200));
  }catch{}
  const res = await chrome.tabs.sendMessage(tab.id, { type:'PI_SCRAPE_SINGLE' });
  if(!res?.ok) throw new Error(res?.error||'Gagal scrape — buka halaman produk AE dulu');
  let data = res.data;
  // ALD: SELALU fetch descriptionUrl jika ada → dapat HTML deskripsi produk asli
  if(data.descriptionUrl){
    try{
      const r = await fetch(data.descriptionUrl, { headers: { 'Accept': 'text/html,*/*' } });
      if(r.ok){
        const body = await r.text();
        if(body && body.length>200){
          // descriptionUrl kadang berupa .js berisi document.write("...") — ekstrak HTML-nya
          const dw = body.match(/document\.write\(\s*(["'])([\s\S]*?)\1\s*\)/);
          let raw = dw && dw[2] ? dw[2].replace(/\\"/g,'"').replace(/\\n/g,'\n').replace(/\\\//g,'/') : body;
          let clean = raw.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').trim().slice(0,60000);
          clean = clean.replace(/<div[^>]*brandPlus[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi,'').trim();
          try{
            const doc = new DOMParser().parseFromString(clean,'text/html');
            if(doc.body && doc.body.innerHTML) clean = doc.body.innerHTML;
          }catch{}
          const isValid = (clean.includes('<img') || clean.length>500) && !clean.includes('brandPlus');
          if(isValid){
            // Deskripsi ASLI dari AE sebagai konten utama, specs di bawah
            data.descHtml = clean;
            if(data.specsHtml && data.specsHtml.length>20){
              data.descHtml += '\n' + data.specsHtml;
            }
            // Ambil text untuk field desc
            try{
              const txt = new DOMParser().parseFromString(clean,'text/html').body?.innerText || '';
              if(txt.trim().length>20) data.desc = txt.trim().slice(0,800);
            }catch{}
            // Extract images
            const re = /https:\/\/ae\d*\.alicdn\.com\/[^"'\\\s<>]+\.(?:jpg|jpeg|png|webp)/gi;
            let m;
            while((m=re.exec(clean))!==null){
              const u = m[0].replace(/_\d+x\d+\.(jpg|png|webp)/,'.$1').replace(/\.jpg_\w+/,'.jpg').split('?')[0];
              if(!data.descImages.includes(u)) data.descImages.push(u);
            }
          }
        }
      }
    }catch(e){ console.warn('fetch descriptionUrl fail',e); }
  }
  // Safety: pastikan hasil fetch descriptionUrl (yang overwrite descHtml/desc) juga bersih dari branding AE
  data.descHtml = replaceBrand(data.descHtml);
  data.desc = replaceBrand(data.desc);
  data.title = replaceBrand(data.title);
  data.category = replaceBrand(data.category);
  data.specsHtml = replaceBrand(data.specsHtml);
  return data;
}

$('#btnScrapeSingle').onclick=async()=>{
  $('#singleLog').textContent='Scraping...';
  try{
    const d = await scrapeCurrentTab();
    renderSingle(d);
    $('#singleLog').textContent='Berhasil';
  }catch(e){ $('#singleLog').textContent='Error: '+e.message; }
};

$('#btnPasteScrape').onclick=async()=>{
  const url = $('#singleUrl').value.trim();
  if(!url) return alert('Isi URL AE');
  $('#singleLog').textContent='Fetch via Worker...';
  try{
    const cfg = await new Promise(r=>getCfg(r));
    const res = await fetchWithTimeout(cfg.base+'/api/admin/ae-scrape', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+(cfg.token||'')}, body:JSON.stringify({ url }) });
    const j = await res.json();
    if(!res.ok) throw new Error(j.error||'Gagal');
    // normalize to popup format
    const d = { title:j.title, desc:j.desc, descHtml:j.descHtml, descImages:j.descImages, images:j.images, featured:j.images?.[0]||'', variants:j.variants, priceUSD:j.priceUSD, aeUrl:j.aeUrl||url, category:'Mesin & Tools' };
    renderSingle(d);
    $('#singleLog').textContent='Berhasil (via Worker)';
  }catch(e){ $('#singleLog').textContent='Error: '+e.message; }
};

// WebP optimize featured image (max 1200, q80)
async function optimizeFeatured(url){
  try{
    const blob = await fetch(url).then(r=>r.blob());
    const bmp = await createImageBitmap(blob);
    const max = 1200;
    let w=bmp.width, h=bmp.height;
    if(Math.max(w,h)>max){
      if(w>h){ h=Math.round(h*max/w); w=max; } else { w=Math.round(w*max/h); h=max; }
    }
    const canvas = new OffscreenCanvas(w,h);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bmp,0,0,w,h);
    const outBlob = await canvas.convertToBlob({ type:'image/webp', quality:0.8 });
    return outBlob;
  }catch(e){
    // fallback: fetch as-is
    const b = await fetch(url).then(r=>r.blob());
    return b;
  }
}

async function postSingle(){
  if(!singleData) return;
  const cfg = await new Promise(r=>getCfg(r));
  if(!cfg.token){ alert('Isi Admin Token di Settings dulu (login admin → copy token)'); return; }
  const logEl = $('#singlePostLog');
  logEl.textContent='Optimizing featured image...';
  let featuredBlob = null;
  if(singleData.featured){
    try{ featuredBlob = await optimizeFeatured(singleData.featured); }catch(e){ console.warn(e); }
  }
  // Upload featured to R2 via /api/upload if available, else send URL and let worker fetch
  // We will send via ae-import with images: [featured] — worker will fetch. But we try direct upload for WebP.
  let uploadedImg = '';
  if(featuredBlob){
    try{
      const fd = new FormData();
      fd.append('file', featuredBlob, 'featured.webp');
      const up = await fetchWithTimeout(cfg.base+'/api/upload', { method:'POST', headers:{ 'Authorization':'Bearer '+cfg.token }, body: fd });
      if(up.ok){
        const uj = await up.json();
        uploadedImg = uj.url || uj.img || '';
      }
    }catch(e){ console.warn('upload fail',e); }
  }
  logEl.textContent='Posting...';
  const payload = {
    title: singleData.title,
    descHtml: singleData.descHtml || singleData.desc || '',
    desc: singleData.desc || '',
    category: singleData.category || 'Mesin & Tools',
    variants: singleData.variants,
    images: uploadedImg ? [] : (singleData.images||[]).slice(0,1),
    img: uploadedImg || '',
    ae_url: singleData.aeUrl || singleData.aeUrl || '',
    aeUrl: singleData.aeUrl || ''
  };
  try{
    const res = await fetchWithTimeout(cfg.base+'/api/admin/ae-import', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.token}, body:JSON.stringify(payload) });
    const j = await res.json();
    if(!res.ok) throw new Error(j.error||'Gagal import');
    logEl.textContent='Berhasil! ID: '+j.id+' slug: '+j.slug;
    logEl.style.color='#16a34a';
  }catch(e){
    logEl.textContent='Error: '+e.message;
    logEl.style.color='#dc2626';
  }
}

// Bulk
$('#btnLoadBulk').onclick=()=>{
  chrome.storage.local.get({ pi_bulk_urls:[] }, r=>{
    const urls = r.pi_bulk_urls||[];
    if(!urls.length) return alert('Tidak ada URL di storage. Kumpulkan dari listing AE dulu.');
    $('#bulkUrls').value = urls.join('\n');
  });
};
$('#btnClearBulk').onclick=()=>{
  $('#bulkUrls').value=''; bulkData=[]; $('#bulkPreview').innerHTML=''; $('#bulkLog').textContent=''; $('#bulkProg').style.width='0%';
  chrome.storage.local.remove(['pi_bulk_urls','pi_bulk_data']);
};

$('#btnScrapeBulk').onclick=async()=>{
  const raw = $('#bulkUrls').value.trim().split('\n').map(s=>s.trim()).filter(Boolean);
  if(!raw.length) return alert('Isi URL dulu');
  const cfg = await new Promise(r=>getCfg(r));
  bulkData=[];
  $('#bulkPreview').innerHTML='';
  $('#bulkLog').textContent=`Scraping ${raw.length} produk... (delay 1.5s)`;
  $('#bulkProg').style.width='0%';
  for(let i=0;i<raw.length;i++){
    const url = raw[i];
    $('#bulkLog').textContent=`Scraping ${i+1}/${raw.length}: ${url.slice(0,50)}...`;
    $('#bulkProg').style.width = Math.round((i/raw.length)*100)+'%';
    try{
      const res = await fetchWithTimeout(cfg.base+'/api/admin/ae-scrape', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+(cfg.token||'')}, body:JSON.stringify({ url }) });
      const j = await res.json();
      if(!res.ok) throw new Error(j.error||'Gagal');
      bulkData.push({ title:j.title, desc:j.desc, descHtml:j.descHtml, descImages:j.descImages, images:j.images, featured:j.images?.[0]||'', variants:j.variants, aeUrl:j.aeUrl||url, category:'Mesin & Tools', _ok:true });
    }catch(e){
      bulkData.push({ title:'GAGAL: '+url.slice(0,60), error:e.message, aeUrl:url, _ok:false });
    }
    if(i<raw.length-1) await new Promise(r=>setTimeout(r,1500));
  }
  $('#bulkProg').style.width='100%';
  $('#bulkLog').textContent=`Selesai: ${bulkData.filter(x=>x._ok).length}/${raw.length} berhasil`;
  chrome.storage.local.set({ pi_bulk_data: bulkData });
  renderBulk();
  $('#btnPostBulk').disabled = bulkData.filter(x=>x._ok).length===0;
};

function renderBulk(){
  $('#bulkPreview').innerHTML = bulkData.map((d,i)=>`
    <div class="card" style="${d._ok?'':'border-color:#fecaca;background:#fef2f2'}">
      <div style="display:flex;gap:6px">
        ${d.featured?`<img class="thumb" src="${esc(d.featured)}" onerror="this.style.display='none'">`:''}
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:11px">${esc(d.title||'—')}</div>
          <div class="small">${d._ok?`${d.variants?.length||0} varian · ${d.variants?.map(v=>fmt(v.priceIDR)).join(', ').slice(0,60)}`:`<span style="color:#dc2626">${esc(d.error||'Gagal')}</span>`} </div>
          <div class="small">${esc((d.aeUrl||'').slice(0,60))}</div>
        </div>
        <label style="font-size:10px"><input type="checkbox" class="bulk-chk" data-i="${i}" ${d._ok?'checked':''}> post</label>
      </div>
    </div>
  `).join('');
}

$('#btnPostBulk').onclick=async()=>{
  const cfg = await new Promise(r=>getCfg(r));
  if(!cfg.token) return alert('Isi Admin Token dulu');
  const checks = Array.from(document.querySelectorAll('.bulk-chk:checked')).map(c=>parseInt(c.dataset.i));
  if(!checks.length) return alert('Pilih minimal 1');
  $('#postProg').textContent=`Posting 0/${checks.length}...`;
  let ok=0, fail=0;
  for(let idx=0; idx<checks.length; idx++){
    const i = checks[idx];
    const d = bulkData[i];
    $('#postProg').textContent=`Posting ${idx+1}/${checks.length}: ${d.title.slice(0,30)}...`;
    try{
      const payload = { title:d.title, descHtml:d.descHtml||d.desc||'', category:d.category||'Mesin & Tools', variants:d.variants, images:(d.images||[]).slice(0,1), ae_url:d.aeUrl||'', aeUrl:d.aeUrl||'' };
      const res = await fetchWithTimeout(cfg.base+'/api/admin/ae-import', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.token}, body:JSON.stringify(payload) }, 20000);
      const j = await res.json();
      if(!res.ok) throw new Error(j.error||'Gagal');
      ok++;
    }catch(e){ fail++; console.warn(e); }
    await new Promise(r=>setTimeout(r,800));
  }
  $('#postProg').textContent=`Selesai: ${ok} berhasil, ${fail} gagal`;
};

// Load saved bulk on open
chrome.storage.local.get({ pi_bulk_data:[] }, r=>{
  if(r.pi_bulk_data?.length){ bulkData=r.pi_bulk_data; renderBulk(); $('#btnPostBulk').disabled=bulkData.filter(x=>x._ok).length===0; }
});
// Load single queue from content
chrome.storage.local.get({ pi_single_queue:[] }, r=>{
  if(r.pi_single_queue?.length){
    const last = r.pi_single_queue[r.pi_single_queue.length-1];
    if(last) renderSingle(last);
  }
});
