// ProIndustri — Main Worker
import { renderProduct } from './pages.js';

// ─── Helpers ───
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
});

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

// ─── Router ───
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' } });

    try {
      // ── API Routes ──
      if (pathname.startsWith('/api/')) return await handleAPI(request, env, url);

      // ── Static page routes (serve specific HTML files) ──
      if (['/', '/admin', '/produk', '/cart', '/kategori'].includes(pathname) || pathname.startsWith('/kategori/')) {
        const fileMap = { '/': 'index.html', '/admin': 'admin.html', '/produk': 'produk.html', '/cart': 'cart.html' };
        const file = fileMap[pathname] || (pathname.startsWith('/kategori/') ? 'produk.html' : null);
        if (file) {
          const resp = await env.ASSETS.fetch(new Request(`${url.origin}/${file}`, request));
          return resp;
        }
      }

      // ── SSR Product Detail ──
      const prodMatch = pathname.match(/^\/produk\/(.+)$/);
      if (prodMatch) return await renderProduct(env, prodMatch[1]);

      // ── Static Assets ──
      return await env.ASSETS.fetch(request);
    } catch (e) {
      console.error('Worker Error:', e);
      return json({ error: 'Internal Server Error', detail: e.message }, 500);
    }
  }
};

async function handleAPI(request, env, url) {
  const method = request.method;
  const pathname = url.pathname;
  const db = env.DB;

  // ─── AUTH middleware (admin routes) ───
  const isAdminRoute = pathname.startsWith('/api/admin/') || pathname === '/api/scrape' || (pathname.startsWith('/api/products') && method !== 'GET');
  if (isAdminRoute) {
    // Simple token check — local scraper sends token
    const auth = request.headers.get('Authorization') || '';
    const token = auth.replace('Bearer ', '');
    // For first deploy, use a simple PIN. Set via wrangler secret.
    const adminPin = env.ADMIN_PIN || '1234';
    if (token !== adminPin) return json({ error: 'Unauthorized' }, 401);
  }

  // ─── GET /api/produk ─── (list products)
  if (pathname === '/api/produk' && method === 'GET') {
    const { searchParams } = url;
    const category = searchParams.get('kategori');
    const search = searchParams.get('q');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = 24;
    const offset = (page - 1) * limit;

    let where = 'WHERE p.is_active = 1';
    const params = [];
    if (category) { where += ' AND c.slug = ?'; params.push(category); }
    if (search) { where += ' AND (p.title LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const orderMap = { newest: 'p.created_at DESC', price_asc: 'p.price ASC', price_desc: 'p.price DESC', name: 'p.title ASC' };
    const orderBy = orderMap[sort] || 'p.created_at DESC';

    const rows = await db.prepare(`
      SELECT p.id, p.title, p.slug, p.price, p.image_url, p.stock, p.created_at,
        c.name as category_name, c.slug as category_slug
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    const total = await db.prepare(`SELECT COUNT(*) as n FROM products p LEFT JOIN categories c ON p.category_id = c.id ${where}`).bind(...params).first();

    return json({ products: rows.results, total: total.n, page, limit });
  }

  // ─── GET /api/produk/:slug ───
  const singleMatch = pathname.match(/^\/api\/produk\/(.+)$/);
  if (singleMatch && method === 'GET') {
    const row = await db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ? AND p.is_active = 1
    `).bind(singleMatch[1]).first();
    if (!row) return json({ error: 'Not found' }, 404);
    return json(row);
  }

  // ─── POST /api/products ─── (create from local scraper)
  if (pathname === '/api/products' && method === 'POST') {
    const body = await request.json();
    const slug = slugify(body.title);
    // ensure unique slug
    let finalSlug = slug;
    let counter = 1;
    while (await db.prepare('SELECT id FROM products WHERE slug = ?').bind(finalSlug).first()) {
      finalSlug = `${slug}-${counter++}`;
    }
    await db.prepare(`
      INSERT INTO products (title, slug, description, price, image_url, source_url, category_id, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.title, finalSlug, body.description || '',
      parseInt(body.price) || 0, body.image_url || '',
      body.source_url || '', parseInt(body.category_id) || 5, parseInt(body.stock) || 0
    ).run();
    return json({ success: true, slug: finalSlug });
  }

  // ─── PUT /api/products/:id ─── (update)
  const putMatch = pathname.match(/^\/api\/products\/(\d+)$/);
  if (putMatch && method === 'PUT') {
    const body = await request.json();
    const fields = [];
    const params = [];
    for (const key of ['title', 'description', 'price', 'image_url', 'stock', 'is_active', 'category_id']) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(body[key]);
      }
    }
    if (fields.length === 0) return json({ error: 'No fields to update' }, 400);
    fields.push('updated_at = datetime(\'now\')');
    params.push(putMatch[1]);
    await db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).bind(...params).run();
    return json({ success: true });
  }

  // ─── DELETE /api/products/:id ───
  const delMatch = pathname.match(/^\/api\/products\/(\d+)$/);
  if (delMatch && method === 'DELETE') {
    await db.prepare('DELETE FROM products WHERE id = ?').bind(delMatch[1]).run();
    return json({ success: true });
  }

  // ─── POST /api/scrape ─── (add URL to queue)
  if (pathname === '/api/scrape' && method === 'POST') {
    const { url: sourceUrl } = await request.json();
    if (!sourceUrl || !sourceUrl.includes('aliexpress.com')) return json({ error: 'URL AliExpress tidak valid' }, 400);
    await db.prepare('INSERT INTO scrape_queue (source_url) VALUES (?)').bind(sourceUrl).run();
    return json({ success: true, message: 'URL ditambahkan ke antrian. Jalankan scraper: python3 scrape_proindustri.py' });
  }

  // ─── GET /api/scrape-queue ─── (list pending tasks for local scraper)
  if (pathname === '/api/scrape-queue' && method === 'GET') {
    const rows = await db.prepare('SELECT id, source_url FROM scrape_queue WHERE status = ? ORDER BY id ASC LIMIT 10').bind('pending').all();
    return json({ tasks: rows.results });
  }

  // ─── GET /api/admin/scrape-queue ─── (all tasks for admin panel)
  if (pathname === '/api/admin/scrape-queue' && method === 'GET') {
    const rows = await db.prepare('SELECT id, source_url, status, error, created_at FROM scrape_queue ORDER BY id DESC LIMIT 20').all();
    return json({ tasks: rows.results });
  }

  // ─── PUT /api/scrape-queue/:id ─── (mark as done/failed)
  const sqMatch = pathname.match(/^\/api\/scrape-queue\/(\d+)$/);
  if (sqMatch && method === 'PUT') {
    const body = await request.json();
    await db.prepare('UPDATE scrape_queue SET status = ?, title = ?, price = ?, image_url = ?, description = ?, error = ? WHERE id = ?')
      .bind(body.status || 'done', body.title || '', body.price || '', body.image_url || '', body.description || '', body.error || '', sqMatch[1]).run();
    return json({ success: true });
  }

  // ─── POST /api/orders ─── (create order → WA)
  if (pathname === '/api/orders' && method === 'POST') {
    const body = await request.json();
    const { customer_name, customer_wa, items, note } = body;
    if (!customer_name || !customer_wa || !items?.length) return json({ error: 'Nama, WA, dan item wajib' }, 400);
    const orderCode = 'INV-' + Date.now().toString(36).toUpperCase();
    const total = items.reduce((sum, i) => sum + (parseInt(i.price) || 0) * (parseInt(i.qty) || 1), 0);
    await db.prepare('INSERT INTO orders (order_code, customer_name, customer_wa, items, total, note) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(orderCode, customer_name, customer_wa, JSON.stringify(items), total, note || '').run();
    // Generate WA link
    let waText = `Halo ProIndustri! Saya ${customer_name} (WA: ${customer_wa}) ingin order:\n`;
    items.forEach(i => { waText += `- ${i.title} x${i.qty || 1} = Rp${((parseInt(i.price)||0)*(i.qty||1)).toLocaleString()}\n`; });
    waText += `\nTotal: Rp${total.toLocaleString()}\nKode: ${orderCode}`;
    if (note) waText += `\nCatatan: ${note}`;
    const waUrl = `https://wa.me/${env.WA_NUMBER || '6281234567890'}?text=${encodeURIComponent(waText)}`;
    return json({ success: true, order_code: orderCode, wa_url: waUrl });
  }

  // ─── GET /api/categories ───
  if (pathname === '/api/categories' && method === 'GET') {
    const rows = await db.prepare('SELECT id, name, slug FROM categories ORDER BY name').all();
    return json({ categories: rows.results });
  }

  // ─── GET /api/admin/orders ───
  if (pathname === '/api/admin/orders' && method === 'GET') {
    const rows = await db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50').all();
    return json({ orders: rows.results });
  }

  // ─── GET /api/admin/products (all, including inactive) ───
  if (pathname === '/api/admin/products' && method === 'GET') {
    const rows = await db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC LIMIT 100
    `).all();
    return json({ products: rows.results });
  }

  // ─── POST /api/images/upload ─── (upload from local scraper)
  if (pathname === '/api/images/upload' && method === 'POST') {
    const formData = await request.formData();
    const file = formData.get('image');
    if (!file) return json({ error: 'No image' }, 400);
    const key = `products/${Date.now()}-${file.name}`;
    await env.IMAGES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    // Make public via URL
    const publicUrl = `${env.SITE_URL || 'https://proindustri.imangoess78.workers.dev'}/images/${key}`;
    return json({ url: publicUrl });
  }

  // serve images from R2
  const imgMatch = pathname.match(/^\/images\/(.+)$/);
  if (imgMatch) {
    const obj = await env.IMAGES.get(imgMatch[1]);
    if (!obj) return new Response('Not Found', { status: 404 });
    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000');
    return new Response(obj.body, { headers });
  }

  return json({ error: 'Not Found' }, 404);
}