// ProIndustri — SSR Pages (layout hitam-orange)
import { htmlEscape } from './html-helper.js';

const SITE_NAME = 'ProIndustri';
const SITE_DESC = 'Jual mesin, tools, elektronik & perlengkapan industri — langsung dari China, harga pabrik.';

const topbar = (wa) => `
<div class="topbar">
  <div class="topbar-links"><span>🚚 Pengiriman Nasional — Seluruh Indonesia</span></div>
  <div class="topbar-right">
    <a href="/produk">Katalog</a>
    <a href="/admin">Admin</a>
    <a href="https://wa.me/${htmlEscape(wa)}" class="wa-link" target="_blank" rel="noopener">📱 ${htmlEscape(wa)}</a>
  </div>
</div>`;

const navbar = () => `
<header class="navbar">
  <div class="navbar-inner">
    <a href="/" class="brand">
      <div class="brand-logo">⚙️</div>
      <div><div class="brand-name">ProIndustri</div><div class="brand-sub">Impor China · Harga Pabrik</div></div>
    </a>
    <div class="search-wrap">
      <span class="search-icon">🔍</span>
      <input type="search" class="search-input" id="navSearch" placeholder="Cari mesin, tools, elektronik..." onkeydown="if(event.key==='Enter'&&this.value.trim()){location.href='/produk?q='+encodeURIComponent(this.value.trim());}">
    </div>
    <nav class="nav-links">
      <a href="/" class="nav-link">Beranda</a>
      <a href="/produk" class="nav-link">Produk</a>
    </nav>
    <div class="nav-right">
      <a href="/cart" class="cart-btn">🛒<span class="cart-label">Keranjang</span><span class="cart-count" id="cartCount">0</span></a>
    </div>
  </div>
</header>`;

const footer = (wa) => `
<footer class="footer">
  <div class="footer-orange"></div>
  <div class="footer-main">
    <div class="footer-grid">
      <div>
        <div class="f-logo">⚙️</div>
        <div class="f-name">ProIndustri</div>
        <p class="f-desc">Supplier produk industri impor China — mesin, tools, elektronik & perlengkapan industri dengan harga pabrik.</p>
      </div>
      <div>
        <div class="f-col-title">Navigasi</div>
        <ul class="f-links">
          <li><a href="/">Beranda</a></li>
          <li><a href="/produk">Katalog Produk</a></li>
          <li><a href="/cart">Keranjang</a></li>
        </ul>
      </div>
      <div>
        <div class="f-col-title">Kategori</div>
        <ul class="f-links" id="footerCats">
          <li><a href="/produk">Semua Produk</a></li>
        </ul>
      </div>
      <div>
        <div class="f-col-title">Hubungi Kami</div>
        <div class="f-contact">
          <div class="f-contact-item">📱 <a href="https://wa.me/${htmlEscape(wa)}" target="_blank" rel="noopener">${htmlEscape(wa)}</a></div>
          <div class="f-contact-item">🕐 Senin–Sabtu, 08.00–17.00 WIB</div>
          <div class="f-contact-item">🚚 Pengiriman ke seluruh Indonesia</div>
        </div>
      </div>
    </div>
    <hr class="f-divider">
    <div class="f-bottom">
      <span>© 2026 ProIndustri. Hak cipta dilindungi.</span>
      <span>Produk impor China · Harga Pabrik · Order via WhatsApp</span>
    </div>
  </div>
</footer>`;

const layout = (title, content, headExtra = '', wa = '6281234567890') => `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${htmlEscape(title)} | ${SITE_NAME}</title>
<meta name="description" content="${htmlEscape(SITE_DESC)}">
<meta name="theme-color" content="#0B0B0B">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23F97316'/><text x='50' y='68' font-size='52' text-anchor='middle'>⚙️</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
${headExtra}
</head>
<body>
${topbar(wa)}
${navbar()}
<main class="wrap">${content}</main>
${footer(wa)}
<script src="/assets/site.js"></script>
</body>
</html>`;

export async function renderProduct(env, slug) {
  const db = env.DB;
  const row = await db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = ? AND p.is_active = 1
  `).bind(slug).first();

  const wa = env.WA_NUMBER || '6281234567890';

  if (!row) {
    return new Response(layout('Produk Tidak Ditemukan', `
      <div class="breadcrumb"><a href="/">Beranda</a><span class="sep">›</span><span>Produk</span></div>
      <div class="card empty-cart" style="text-align:center;padding:50px 20px;margin-top:20px">
        <span class="big" style="font-size:48px">🔍</span>
        <p style="font-weight:800;color:var(--black);margin-bottom:6px">Produk tidak ditemukan</p>
        <p class="hint" style="margin-bottom:18px">Produk mungkin sudah tidak tersedia.</p>
        <a href="/produk" class="btn btn-primary">🛍️ Lihat Katalog</a>
      </div>`, '', wa), {
      status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  const titleSafe = htmlEscape(row.title);
  const stockHtml = row.stock > 0
    ? '<span class="pd-stock in-stock">✓ Stok tersedia</span>'
    : '<span class="pd-stock preorder">⏳ Pre-order (pesan dulu)</span>';

  const content = `
    <div class="breadcrumb"><a href="/">Beranda</a><span class="sep">›</span><a href="/produk">Produk</a>${row.category_slug ? `<span class="sep">›</span><a href="/produk?kategori=${htmlEscape(row.category_slug)}">${htmlEscape(row.category_name || '')}</a>` : ''}</div>
    <div class="pd-main">
      <div class="pd-gallery">
        <div class="pd-img">
          ${row.image_url ? `<img src="${htmlEscape(row.image_url)}" alt="${titleSafe}" loading="lazy">` : '<div style="font-size:80px;opacity:.3">⚙️</div>'}
        </div>
      </div>
      <div class="pd-info">
        ${row.category_name ? `<div class="pd-cat">${htmlEscape(row.category_name)}</div>` : ''}
        <h1>${titleSafe}</h1>
        <div class="pd-price">Rp ${(parseInt(row.price) || 0).toLocaleString('id-ID')}</div>
        ${stockHtml}
        ${row.description ? `<p class="pd-desc">${htmlEscape(row.description)}</p>` : ''}
        <div class="pd-actions">
          <button class="btn btn-primary" onclick="addToCart({id:${row.id},title:${JSON.stringify(row.title)},price:${row.price},image_url:${JSON.stringify(row.image_url || '')}})">🛒 Tambah ke Keranjang</button>
          <a href="https://wa.me/${htmlEscape(wa)}?text=${encodeURIComponent('Halo ProIndustri, saya mau tanya produk: ' + row.title)}" class="btn btn-light" target="_blank" rel="noopener">💬 Tanya via WA</a>
        </div>
        <ul class="pd-features">
          <li>Impor langsung dari pabrik China — harga kompetitif</li>
          <li>Pengiriman ke seluruh Indonesia</li>
          <li>Order mudah & aman via WhatsApp</li>
        </ul>
      </div>
    </div>
  `;

  return new Response(layout(row.title, content, '', wa), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

export function notFoundPage() {
  return new Response(layout('Halaman Tidak Ditemukan', `
    <div class="card empty-cart" style="text-align:center;padding:50px 20px;margin-top:20px">
      <span class="big" style="font-size:48px">🧭</span>
      <p style="font-weight:800;color:var(--black);margin-bottom:6px">404 — Halaman Tidak Ditemukan</p>
      <p class="hint" style="margin-bottom:18px">Alamat yang Anda tuju tidak tersedia.</p>
      <a href="/" class="btn btn-primary">🏠 Kembali ke Beranda</a>
    </div>`), {
    status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
