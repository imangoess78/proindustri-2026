// ProIndustri Monotaro Scraper — content script
// Berjalan di halaman produk monotaro.id, ekstrak data produk dari DOM.

function extractProduct() {
  const doc = document;
  const $ = (sel) => doc.querySelector(sel);
  const $$ = (sel) => Array.from(doc.querySelectorAll(sel));
  const m1 = (re) => { const m = doc.documentElement.outerHTML.match(re); return m ? m[1].trim() : ''; };

  // 1) Title
  let title = $('meta[property="og:title"]')?.content
    || $('h1')?.textContent?.trim()
    || doc.title || '';
  title = title.replace(/\s*\|\s*MonotaRO.*$/i, '').replace(/\s*-\s*MonotaRO.*$/i, '').trim().slice(0, 200);

  // 2) Price (IDR) — coba beberapa selector umum
  let price = 0;
  const priceSel = [
    '[itemprop="price"]',
    '.price',
    '.product-price',
    '[data-price]',
    '.price-box .price',
    '#price',
    '.price--large',
    '.price__value'
  ];
  for (const sel of priceSel) {
    const el = $(sel);
    if (!el) continue;
    const t = (el.getAttribute('content') || el.getAttribute('data-price') || el.textContent || '').trim();
    const m = t.match(/[\d.,]+/);
    if (m) {
      price = Math.round(parseFloat(m[0].replace(/\./g, '').replace(',', '.')));
      if (price > 0) break;
    }
  }
  if (!price) {
    const rp = doc.body.innerText.match(/Rp\s*([\d.,]+)/i);
    if (rp) price = Math.round(parseFloat(rp[1].replace(/\./g, '').replace(',', '.')));
  }

  // 3) Images — og:image, JSON-LD, img src
  const images = [];
  const ogImg = $('meta[property="og:image"]')?.content;
  if (ogImg) images.push(ogImg);
  const jsonLd = $$('script[type="application/ld+json"]').map(s => { try { return JSON.parse(s.textContent); } catch { return null; } }).filter(Boolean);
  for (const j of jsonLd) {
    const imgs = (j.image || []).map(i => typeof i === 'string' ? i : i.url).filter(Boolean);
    imgs.forEach(u => { if (!images.includes(u)) images.push(u); });
  }
  $$('img').forEach(img => {
    const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-original') || '';
    if (/https?:\/\//.test(src) && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(src) && src.includes('monotaro')) {
      if (!images.includes(src)) images.push(src);
    }
  });
  const cleanImgs = [...new Set(images)].slice(0, 8);

  // 4) Description
  let desc = $('meta[name="description"]')?.content
    || $('meta[property="og:description"]')?.content || '';
  desc = desc.trim().slice(0, 2000);

  // 5) Category guess dari breadcrumb
  let category = '';
  const bc = $$('.breadcrumb li, .breadcrumbs li, nav[aria-label="breadcrumb"] li').map(li => li.textContent.trim()).filter(Boolean);
  if (bc.length) category = bc[bc.length - 2] || bc[bc.length - 1] || '';
  category = (category || 'Mesin & Tools').replace(/^(Beranda|Home|Top)\s*[\/>]/i, '').trim().slice(0, 60);

  return {
    title,
    desc,
    images: cleanImgs,
    priceIDR: price,
    variants: price > 0 ? [{ name: 'Standard', priceIDR: price, stock: 50, min_qty: 1 }] : [],
    category: category || 'Mesin & Tools',
    weight: 200,
    url: location.href
  };
}

// Kirim ke background untuk POST ke ProIndustri
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'PI_SCRAPE') {
    try {
      const data = extractProduct();
      sendResponse({ ok: true, data });
    } catch (e) {
      sendResponse({ ok: false, error: e.message });
    }
  }
  return true;
});
