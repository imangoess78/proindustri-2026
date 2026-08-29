// ProIndustri — SSR Pages
import { htmlEscape } from './html-helper.js';

const SITE_NAME = 'ProIndustri';
const SITE_DESC = 'Jual mesin, tools, elektronik & perlengkapan industri — langsung dari China, harga pabrik.';

const layout = (title, content, headExtra = '', waNumber = '6281234567890') => `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${htmlEscape(title)} | ${SITE_NAME}</title>
<meta name="description" content="${htmlEscape(SITE_DESC)}">
<link rel="stylesheet" href="/assets/site.css">
${headExtra}
</head>
<body>
<header class="site-header">
  <div class="container header-inner">
    <a href="/" class="logo">${SITE_NAME}</a>
    <nav class="nav-links">
      <a href="/">Beranda</a>
      <a href="/produk">Produk</a>
      <a href="/admin">Admin</a>
    </nav>
  </div>
</header>
<main class="container">${content}</main>
<footer class="site-footer">
  <div class="container">
    <p>© 2026 ${SITE_NAME}. Produk impor China langsung dari pabrik.</p>
    <p>Order via WA: <a href="https://wa.me/${htmlEscape(waNumber)}">${htmlEscape(waNumber)}</a></p>
  </div>
</footer>
</body>
</html>`;

export async function renderProduct(env, slug) {
  const db = env.DB;
  const row = await db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = ? AND p.is_active = 1
  `).bind(slug).first();

  if (!row) {
    return new Response(layout('Produk Tidak Ditemukan', '<h1>Produk tidak ditemukan</h1><p><a href="/produk">← Kembali ke katalog</a></p>', ''), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  const content = `
    <div class="product-detail">
      <a href="/produk" class="back-link">← Kembali</a>
      <div class="pd-grid">
        <div class="pd-image">
          ${row.image_url ? `<img src="${htmlEscape(row.image_url)}" alt="${htmlEscape(row.title)}" loading="lazy">` : '<div class="pd-noimg">Tidak ada gambar</div>'}
        </div>
        <div class="pd-info">
          <h1>${htmlEscape(row.title)}</h1>
          ${row.category_name ? `<p class="pd-category">Kategori: ${htmlEscape(row.category_name)}</p>` : ''}
          <p class="pd-price">Rp ${(parseInt(row.price) || 0).toLocaleString()}</p>
          ${row.description ? `<p class="pd-desc">${htmlEscape(row.description)}</p>` : ''}
          <p class="pd-stock">Stok: ${row.stock > 0 ? 'Tersedia' : 'Pesan Dulu'}</p>
          <div class="pd-actions">
            <button class="btn btn-primary" onclick="addToCart({id:${row.id},title:'${htmlEscape(row.title).replace(/'/g, "\\'")}',price:${row.price}})">Tambah ke Keranjang</button>
          </div>
        </div>
      </div>
    </div>
  `;

  return new Response(layout(row.title, content, '', env.WA_NUMBER || '6281234567890'), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

export function notFoundPage() {
  return new Response(layout('Halaman Tidak Ditemukan', '<h1>404 — Halaman Tidak Ditemukan</h1><p><a href="/">← Kembali ke beranda</a></p>'), {
    status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}