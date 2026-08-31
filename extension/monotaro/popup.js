// ProIndustri Monotaro Scraper — popup logic
const BASE = 'https://proindustri.com';
const $ = (s) => document.querySelector(s);
let TOKEN = '';
let lastData = null;

function status(msg, cls) {
  const el = $('#status');
  el.textContent = msg;
  el.className = cls || '';
}

async function getToken() {
  // Coba ambil dari chrome.storage dulu
  const stored = await chrome.storage.local.get('pi_token');
  if (stored.pi_token) { TOKEN = stored.pi_token; return TOKEN; }
  // Fallback: minta user buka admin & login, token disimpan di localStorage
  // (extension tidak bisa baca localStorage lintas origin — pakai scripting API)
  return '';
}

$('#token-btn').addEventListener('click', async () => {
  status('Membuka admin & mengambil token...');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !tab.url.includes('proindustri.com')) {
      await chrome.tabs.create({ url: BASE + '/admin.html' });
      status('Buka tab admin, login, lalu kembali & klik Ambil Token lagi.', 'err');
      return;
    }
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => localStorage.getItem('mp_admin_token') || ''
    });
    TOKEN = (results && results[0] && results[0].result) || '';
    if (TOKEN) {
      await chrome.storage.local.set({ pi_token: TOKEN });
      status('✅ Token tersimpan. Klik Scrape Halaman Ini.', 'ok');
    } else {
      status('Token kosong — pastikan sudah login di admin proindustri.com', 'err');
    }
  } catch (e) {
    status('Gagal ambil token: ' + e.message, 'err');
  }
});

$('#scrape-btn').addEventListener('click', async () => {
  status('Scraping halaman...');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || !tab.url.includes('monotaro.id')) {
    status('Buka dulu halaman produk monotaro.id di tab aktif.', 'err');
    return;
  }
  let res;
  try {
    res = await chrome.tabs.sendMessage(tab.id, { type: 'PI_SCRAPE' });
  } catch (e) {
    status('Extension belum di-inject — reload halaman monotaro lalu coba lagi. (' + e.message + ')', 'err');
    return;
  }
  if (!res || !res.ok) { status('Gagal scrape: ' + (res && res.error), 'err'); return; }
  const d = res.data;
  lastData = d;
  renderPreview(d);
  status('✅ Scrape OK. Klik "Post ke ProIndustri" untuk publish.', 'ok');
});

function renderPreview(d) {
  const el = $('#result');
  const img = (d.images && d.images[0]) ? `<img class="img" src="${d.images[0]}">` : '';
  const price = d.priceIDR ? 'Rp ' + Number(d.priceIDR).toLocaleString('id-ID') : '—';
  el.innerHTML = `
    <div class="card">
      ${img}
      <div class="row" style="margin-top:6px"><span class="lbl">Judul</span><span class="val">${esc(d.title).slice(0, 80)}</span></div>
      <div class="row"><span class="lbl">Harga</span><span class="val">${price}</span></div>
      <div class="row"><span class="lbl">Gambar</span><span class="val">${(d.images||[]).length}</span></div>
      <div class="row"><span class="lbl">Kategori</span><span class="val">${esc(d.category)}</span></div>
      <button class="btn" id="post-btn">⬆️ Post ke ProIndustri</button>
    </div>`;
  $('#post-btn').addEventListener('click', postProduct);
}

function esc(s) { return String(s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

async function postProduct() {
  if (!lastData) return;
  if (!TOKEN) { status('Ambil token dulu (tombol Ambil Token Otomatis).', 'err'); return; }
  status('Upload gambar & publish...');
  const btn = $('#post-btn');
  btn.disabled = true;
  try {
    // 1) Upload gambar pertama ke R2 (optimasi via canvas tidak wajib di popup)
    let img = '';
    const imgUrls = (lastData.images || []).slice(0, 4);
    for (const u of imgUrls) {
      try {
        const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!r.ok) continue;
        const blob = await r.blob();
        if (blob.size < 1000) continue;
        const fd = new FormData();
        fd.append('file', blob, 'product.jpg');
        const up = await fetch(BASE + '/api/upload/product', {
          method: 'POST', headers: { 'Authorization': 'Bearer ' + TOKEN }, body: fd
        });
        const upj = await up.json().catch(() => ({}));
        if (upj.img) { img = upj.img; break; }
      } catch {}
    }
    if (!img && imgUrls.length) img = imgUrls[0];
    if (!img) img = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=700&auto=format&fit=crop&q=70';

    // 2) Create product via ae-import (endpoint sama, reuse)
    const payload = {
      title: lastData.title,
      desc: lastData.desc || '',
      category: lastData.category || 'Mesin & Tools',
      weight: lastData.weight || 200,
      variants: (lastData.variants && lastData.variants.length) ? lastData.variants : [{ name: 'Standard', priceIDR: lastData.priceIDR || 1000, stock: 50, min_qty: 1 }],
      images: [img],
      ae_url: lastData.url,
      aeUrl: lastData.url
    };
    const res = await fetch(BASE + '/api/admin/ae-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN },
      body: JSON.stringify(payload)
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || 'HTTP ' + res.status);
    status('✅ Produk terbit: ' + j.slug + ' — ' + BASE + '/p/' + j.slug, 'ok');
    lastData = null;
    document.querySelector('#result').innerHTML = '';
  } catch (e) {
    status('❌ ' + e.message, 'err');
  } finally {
    if (btn) btn.disabled = false;
  }
}
