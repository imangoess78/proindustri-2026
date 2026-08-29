// ProIndustri — Site JS
// Tema hitam-orange, struktur seperti Murah-Plastic
// Produk listing, kategori nav, cart, checkout via WA, admin panel

const API = '/api';
const CART_KEY = 'proindustri_cart';
let adminToken = localStorage.getItem('proindustri_admin_token') || '';

// ─── Format ───
const fmt = (n) => 'Rp ' + (parseInt(n) || 0).toLocaleString('id-ID');

// ─── Toast ───
function showToast(msg, isErr) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:' + (isErr ? '#DC2626' : '#0B0B0B') + ';color:#fff;padding:12px 26px;border-radius:12px;z-index:9999;font-size:14px;font-weight:600;box-shadow:0 8px 30px rgba(0,0,0,.3);transition:opacity .3s;max-width:90%;text-align:center;opacity:1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.style.opacity = '0', 2200);
}

// ─── Cart helpers ───
function getCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } }
function saveCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); updateCartCount(); }
function updateCartCount() {
  const n = getCart().reduce((s, i) => s + (i.qty || 1), 0);
  document.querySelectorAll('#cartCount').forEach(el => el.textContent = n);
}
function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) existing.qty = (existing.qty || 1) + 1;
  else cart.push({ ...product, qty: 1 });
  saveCart(cart);
  showToast('✅ ' + product.title.slice(0, 40) + ' masuk keranjang');
}
function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, (item.qty || 1) + delta);
  saveCart(cart);
  renderCart();
}
function removeItem(id) {
  saveCart(getCart().filter(i => i.id !== id));
  renderCart();
}

// ─── Categories (cat-nav, sidebar, footer) ───
async function loadCategories() {
  try {
    const res = await fetch(`${API}/categories`);
    const data = await res.json();
    const cats = data.categories || [];

    // Cat-nav (top horizontal)
    const navInner = document.getElementById('catNavInner');
    if (navInner) {
      const current = new URLSearchParams(location.search).get('kategori') || '';
      const links = ['<a href="/produk" class="cat-nav-item' + (!current ? ' active' : '') + '">Semua Produk</a>'];
      cats.forEach(c => {
        links.push(`<a href="/produk?kategori=${c.slug}" class="cat-nav-item${current === c.slug ? ' active' : ''}">${c.name}</a>`);
      });
      navInner.innerHTML = links.join('');
    }

    // Sidebar kategori (katalog page)
    const catList = document.getElementById('catList');
    if (catList) {
      const current = new URLSearchParams(location.search).get('kategori') || '';
      const items = cats.map(c => `
        <li><button data-cat="${c.slug}" class="${current === c.slug ? 'active' : ''}" onclick="selectCat('${c.slug}')">${c.name} <span class="cnt" id="cnt-${c.slug}">–</span></button></li>
      `).join('');
      catList.insertAdjacentHTML('beforeend', items);
      // highlight "Semua" if no category
      if (!current) document.querySelector('#catList button[data-cat=""]')?.classList.add('active');
    }

    // Footer kategori
    const footerCats = document.getElementById('footerCats');
    if (footerCats) {
      footerCats.innerHTML = ['<li><a href="/produk">Semua Produk</a></li>'].concat(
        cats.slice(0, 6).map(c => `<li><a href="/produk?kategori=${c.slug}">${c.name}</a></li>`)
      ).join('');
    }

    // Category counts (sidebar) — fetch all products count per category
    loadCatCounts(cats);
  } catch (e) { /* silent */ }
}
async function loadCatCounts(cats) {
  try {
    const res = await fetch(`${API}/produk?limit=1`);
    const data = await res.json();
    const total = data.total || 0;
    const allCnt = document.getElementById('catAllCnt');
    if (allCnt) allCnt.textContent = total;
    // per-category counts (lazy: fetch each with limit=1 to get total)
    for (const c of cats) {
      const r = await fetch(`${API}/produk?kategori=${c.slug}&limit=1`);
      const d = await r.json();
      const el = document.getElementById(`cnt-${c.slug}`);
      if (el) el.textContent = d.total || 0;
    }
  } catch (e) { /* silent */ }
}

// ─── Render product card ───
function productCard(p) {
  const img = p.image_url
    ? `<img src="${p.image_url}" alt="${p.title}" loading="lazy">`
    : '<div class="p-imgfallback">⚙️</div>';
  const badge = p.stock > 0 ? '' : '<span class="p-badge">Pre-order</span>';
  const cat = p.category_name ? `<div class="p-cat">${p.category_name}</div>` : '<div class="p-cat">Produk</div>';
  return `
  <div class="product-card">
    <a href="/produk/${p.slug}" class="p-thumb">${img}${badge}</a>
    <div class="p-body">
      ${cat}
      <a href="/produk/${p.slug}" class="p-title">${p.title}</a>
      <div class="p-price">${fmt(p.price)}</div>
      <div class="p-meta">${p.stock > 0 ? '<span class="in-stock">✓ Stok tersedia</span>' : '<span class="preorder">Pre-order</span>'}</div>
      <div class="p-actions">
        <button class="btn btn-primary btn-sm" onclick="addToCart({id:${p.id},title:${JSON.stringify(p.title)},price:${p.price},image_url:${JSON.stringify(p.image_url || '')}})">+ Keranjang</button>
        <a href="/produk/${p.slug}" class="btn btn-light btn-sm">Detail</a>
      </div>
    </div>
  </div>`;
}

// ─── Featured (homepage) ───
async function loadFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  try {
    const res = await fetch(`${API}/produk?limit=8`);
    const data = await res.json();
    grid.innerHTML = data.products.length
      ? data.products.map(productCard).join('')
      : '<p class="shop-empty"><span class="big">📦</span>Belum ada produk. Tambah via admin →.</p>';
  } catch (e) {
    grid.innerHTML = '<p class="shop-loading">Gagal memuat produk.</p>';
  }
}

// ─── Catalog page ───
let currentPage = 1, currentCat = '', currentSearch = '', currentSort = 'newest';
function getUrlParams() {
  const sp = new URLSearchParams(location.search);
  currentCat = sp.get('kategori') || '';
  currentSearch = sp.get('q') || '';
  currentSort = sp.get('sort') || 'newest';
  if (currentSearch) {
    const input = document.getElementById('shopSearch');
    if (input) input.value = currentSearch;
  }
  const sel = document.getElementById('sortSelect');
  if (sel) sel.value = currentSort;
}
async function loadProducts(reset = true) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  if (reset) currentPage = 1;
  grid.innerHTML = '<p class="shop-loading">Memuat produk...</p>';
  try {
    const params = new URLSearchParams({ page: currentPage, limit: 24, sort: currentSort });
    if (currentCat) params.set('kategori', currentCat);
    if (currentSearch) params.set('q', currentSearch);
    const res = await fetch(`${API}/produk?${params}`);
    const data = await res.json();
    if (!data.products.length) {
      grid.innerHTML = '<div class="shop-empty"><span class="big">🔍</span>Produk tidak ditemukan.<br><button class="btn btn-primary btn-sm" style="margin-top:14px" onclick="resetFilters()">Reset Filter</button></div>';
    } else {
      grid.innerHTML = data.products.map(productCard).join('');
    }
    const count = document.getElementById('shopCount');
    if (count) count.innerHTML = `<b>${data.total}</b> produk ditemukan${currentSearch ? ` untuk "<b>${currentSearch}</b>"` : ''}`;
    renderPagination(data);
  } catch (e) {
    grid.innerHTML = '<p class="shop-loading">Gagal memuat produk.</p>';
  }
}
function renderPagination(data) {
  const el = document.getElementById('pagination');
  if (!el) return;
  const totalPages = Math.ceil(data.total / data.limit);
  if (totalPages <= 1) { el.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
  el.innerHTML = html;
}
function goPage(p) { currentPage = p; loadProducts(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function selectCat(slug) {
  currentCat = slug;
  document.querySelectorAll('#catList button').forEach(b => b.classList.toggle('active', b.dataset.cat === slug));
  document.querySelectorAll('#catNavInner .cat-nav-item').forEach(a => a.classList.toggle('active', a.getAttribute('href').includes(slug)));
  loadProducts();
}
function applySearch() {
  const input = document.getElementById('shopSearch');
  currentSearch = input ? input.value.trim() : '';
  loadProducts();
}
function applySort() {
  const sel = document.getElementById('sortSelect');
  currentSort = sel ? sel.value : 'newest';
  loadProducts();
}
function resetFilters() {
  currentCat = ''; currentSearch = ''; currentSort = 'newest';
  const input = document.getElementById('shopSearch');
  if (input) input.value = '';
  const sel = document.getElementById('sortSelect');
  if (sel) sel.value = 'newest';
  document.querySelectorAll('#catList button').forEach(b => b.classList.toggle('active', b.dataset.cat === ''));
  loadProducts();
}

// ─── Cart page ───
function renderCart() {
  const cart = getCart();
  const empty = document.getElementById('cartEmpty');
  const content = document.getElementById('cartContent');
  if (!content) return;
  if (!cart.length) {
    empty.style.display = 'block';
    content.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  content.style.display = 'grid';
  const items = document.getElementById('cartItems');
  items.innerHTML = cart.map(i => `
    <div class="c-item">
      <div class="c-item-img">${i.image_url ? `<img src="${i.image_url}" alt="">` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:24px">⚙️</div>'}</div>
      <div style="flex:1;min-width:0">
        <div class="c-item-name">${i.title}</div>
        <div class="c-item-price">${fmt(i.price)}</div>
        <div class="c-subtotal">Subtotal: <b>${fmt((i.price || 0) * (i.qty || 1))}</b></div>
      </div>
      <div class="c-qty">
        <button onclick="changeQty(${i.id}, -1)">−</button>
        <span style="font-weight:800;font-size:14px;min-width:24px;text-align:center">${i.qty}</span>
        <button onclick="changeQty(${i.id}, 1)">+</button>
      </div>
      <button class="c-remove" onclick="removeItem(${i.id})" title="Hapus">🗑️</button>
    </div>`).join('');
  const total = cart.reduce((s, i) => s + (parseInt(i.price) || 0) * (parseInt(i.qty) || 1), 0);
  const t1 = document.getElementById('totalAmount');
  const t2 = document.getElementById('totalAmount2');
  if (t1) t1.textContent = fmt(total);
  if (t2) t2.textContent = fmt(total);
}

// ─── Checkout via WA ───
async function checkoutWa() {
  const name = document.getElementById('custName').value.trim();
  const wa = document.getElementById('custWa').value.trim();
  const note = document.getElementById('custNote').value.trim();
  const cart = getCart();
  if (!name) return showToast('⚠ Isi nama lengkap dulu', true);
  if (!wa) return showToast('⚠ Isi nomor WhatsApp dulu', true);
  if (!cart.length) return showToast('⚠ Keranjang kosong', true);

  try {
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_name: name, customer_wa: wa, items: cart, note })
    });
    const data = await res.json();
    if (res.status === 200 && data.wa_url) {
      showToast('✅ Membuka WhatsApp...');
      localStorage.removeItem(CART_KEY);
      updateCartCount();
      setTimeout(() => window.open(data.wa_url, '_blank'), 600);
    } else {
      showToast('⚠ ' + (data.error || 'Gagal order'), true);
    }
  } catch (e) {
    showToast('⚠ Gagal koneksi. Coba lagi.', true);
  }
}

// ─── Admin ───
async function adminLogin() {
  const pin = document.getElementById('pinInput').value.trim();
  if (!pin) return showToast('⚠ Masukkan PIN', true);
  adminToken = pin;
  localStorage.setItem('proindustri_admin_token', pin);
  verifyAdmin();
}
async function verifyAdmin() {
  const loginGate = document.getElementById('loginGate');
  const panel = document.getElementById('adminPanel');
  if (!loginGate || !panel) return;
  try {
    const res = await fetch(`${API}/admin/products`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    if (res.status === 200) {
      loginGate.style.display = 'none';
      panel.style.display = 'block';
      loadAdminProducts(); loadScrapeQueue(); loadOrders();
    } else {
      panel.style.display = 'none';
      loginGate.style.display = 'block';
      if (adminToken) showToast('⚠ PIN salah', true);
    }
  } catch (e) {
    panel.style.display = 'none';
    loginGate.style.display = 'block';
  }
}

// Scrape queue
async function addToScrapeQueue() {
  const input = document.getElementById('scrapeUrl');
  const url = input.value.trim();
  if (!url) return showToast('⚠ Masukkan URL dulu', true);
  try {
    const res = await fetch(`${API}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (res.status === 200) {
      setResult('scrapeResult', '✅ ' + data.message, true);
      input.value = '';
      loadScrapeQueue();
    } else {
      setResult('scrapeResult', '⚠ ' + (data.error || 'Gagal'), false);
    }
  } catch (e) { setResult('scrapeResult', '⚠ Gagal koneksi', false); }
}
async function loadScrapeQueue() {
  const el = document.getElementById('scrapeQueue');
  if (!el) return;
  try {
    const res = await fetch(`${API}/admin/scrape-queue`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    const data = await res.json();
    const tasks = data.tasks || [];
    el.innerHTML = tasks.length ? tasks.map(t => `
      <div class="queue-item">
        <span class="q-url" title="${t.source_url}" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.source_url}</span>
        <span class="queue-status ${t.status}">${t.status === 'pending' ? '⏳ Menunggu' : t.status === 'done' ? '✅ Selesai' : '❌ ' + (t.error || 'gagal')}</span>
      </div>`).join('') : '<p class="hint">Belum ada antrian.</p>';
  } catch (e) { el.innerHTML = '<p class="hint">Gagal memuat.</p>'; }
}

// Admin products
async function loadAdminProducts() {
  const tbody = document.getElementById('productTable');
  if (!tbody) return;
  try {
    const res = await fetch(`${API}/admin/products`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    const data = await res.json();
    const rows = data.products || [];
    tbody.innerHTML = rows.length ? rows.map(p => `
      <tr>
        <td>${p.image_url ? `<img src="${p.image_url}" alt="">` : '—'}</td>
        <td>${p.title}</td>
        <td>${fmt(p.price)}</td>
        <td>${p.stock}</td>
        <td>${p.is_active ? '<span class="in-stock">Aktif</span>' : '<span class="preorder">Disembunyikan</span>'}</td>
        <td>
          <div class="admin-actions">
            <button class="btn-toggle" onclick="toggleProduct(${p.id}, ${p.is_active})">${p.is_active ? 'Sembunyikan' : 'Tampilkan'}</button>
            <button class="btn-del" onclick="deleteProduct(${p.id})">Hapus</button>
          </div>
        </td>
      </tr>`).join('') : '<tr><td colspan="6" class="loading">Belum ada produk.</td></tr>';
  } catch (e) { tbody.innerHTML = '<tr><td colspan="6" class="loading">Gagal memuat.</td></tr>'; }
}
async function toggleProduct(id, active) {
  try {
    await fetch(`${API}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ is_active: active ? 0 : 1 })
    });
    showToast(active ? '🙈 Produk disembunyikan' : '👁️ Produk ditampilkan');
    loadAdminProducts();
  } catch (e) { showToast('⚠ Gagal', true); }
}
async function deleteProduct(id) {
  if (!confirm('Hapus produk ini?')) return;
  try {
    await fetch(`${API}/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    showToast('🗑️ Produk dihapus');
    loadAdminProducts();
  } catch (e) { showToast('⚠ Gagal', true); }
}

// Admin orders
async function loadOrders() {
  const el = document.getElementById('orderList');
  if (!el) return;
  try {
    const res = await fetch(`${API}/admin/orders`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    const data = await res.json();
    const orders = data.orders || [];
    el.innerHTML = orders.length ? orders.map(o => {
      let items = [];
      try { items = JSON.parse(o.items || '[]'); } catch {}
      const itemSummary = items.map(i => `${i.title} x${i.qty}`).join(', ');
      return `
      <div class="queue-item">
        <div style="flex:1;min-width:0">
          <b style="color:var(--orange-dark)">${o.order_code}</b>
          <div style="font-size:12px;color:var(--mid)">${o.customer_name} · ${o.customer_wa}</div>
          <div style="font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${itemSummary}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <b style="color:var(--dark)">${fmt(o.total)}</b>
          <div class="queue-status ${o.status}">${o.status}</div>
        </div>
      </div>`;
    }).join('') : '<p class="hint">Belum ada order.</p>';
  } catch (e) { el.innerHTML = '<p class="hint">Gagal memuat.</p>'; }
}

// ─── Admin tabs ───
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
      btn.classList.add('active');
      const panel = document.getElementById('tab-' + btn.dataset.tab);
      if (panel) panel.style.display = 'block';
    });
  });
}

// ─── Helper ───
function setResult(id, msg, ok) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'result-msg ' + (ok ? 'ok' : 'err');
  setTimeout(() => el.textContent = '', 5000);
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  loadCategories();
  getUrlParams();

  // Homepage
  const featured = document.getElementById('featuredGrid');
  if (featured) loadFeatured();

  // Catalog
  const grid = document.getElementById('productGrid');
  if (grid) loadProducts();

  // Cart
  const content = document.getElementById('cartContent');
  if (content) renderCart();

  // Admin
  const loginGate = document.getElementById('loginGate');
  if (loginGate) {
    initTabs();
    if (adminToken) verifyAdmin();
    document.getElementById('pinInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') adminLogin(); });
  }
});

// Expose for inline handlers
window.addToCart = addToCart;
window.adminLogin = adminLogin;
window.verifyAdmin = verifyAdmin;
window.addToScrapeQueue = addToScrapeQueue;
window.toggleProduct = toggleProduct;
window.deleteProduct = deleteProduct;
window.checkoutWa = checkoutWa;
window.changeQty = changeQty;
window.removeItem = removeItem;
window.goPage = goPage;
window.showToast = showToast;
window.selectCat = selectCat;
window.applySearch = applySearch;
window.applySort = applySort;
window.resetFilters = resetFilters;
