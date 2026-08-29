// ProIndustri — Site JS
// Produk listing, cart, checkout via WA, admin panel

const API = '/api';
const CART_KEY = 'proindustri_cart';

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
  showToast('✅ Ditambahkan ke keranjang');
}

// ─── Format ───
const fmt = (n) => 'Rp ' + (parseInt(n) || 0).toLocaleString('id-ID');

// ─── Toast ───
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:12px 24px;border-radius:8px;z-index:9999;font-size:14px;box-shadow:0 4px 16px rgba(0,0,0,.2);transition:opacity .3s';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.style.opacity = '0', 2000);
}

// ─── Render product card ───
function productCard(p) {
  const img = p.image_url
    ? `<img src="${p.image_url}" alt="${p.title}" loading="lazy">`
    : '<div class="no-img">⚙️</div>';
  const stockHtml = p.stock > 0
    ? `<span class="in-stock">✓ Stok tersedia</span>`
    : `<span class="preorder">Pre-order</span>`;
  return `
  <div class="product-card">
    <a href="/produk/${p.slug}" class="thumb">${img}</a>
    <div class="p-body">
      <a href="/produk/${p.slug}" class="p-title">${p.title}</a>
      <div class="p-price">${fmt(p.price)}</div>
      <div class="p-stock">${stockHtml}</div>
      <div class="p-actions">
        <button class="btn btn-primary btn-sm" onclick="addToCart({id:${p.id},title:${JSON.stringify(p.title)},price:${p.price},image_url:${JSON.stringify(p.image_url||'')}})">+ Keranjang</button>
        <a href="/produk/${p.slug}" class="btn btn-outline btn-sm" style="border-color:var(--border);color:var(--dark)">Detail</a>
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
      : '<p class="loading">Belum ada produk. Tambah via admin →.</p>';
  } catch (e) {
    grid.innerHTML = '<p class="loading">Gagal memuat produk.</p>';
  }
}

// ─── Catalog page ───
let currentPage = 1, currentCat = '', currentSearch = '';
async function loadProducts(reset = true) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  if (reset) { currentPage = 1; }
  grid.innerHTML = '<p class="loading">Memuat...</p>';
  try {
    const params = new URLSearchParams({ page: currentPage, limit: 24 });
    if (currentCat) params.set('kategori', currentCat);
    if (currentSearch) params.set('q', currentSearch);
    const res = await fetch(`${API}/produk?${params}`);
    const data = await res.json();
    if (!data.products.length) { grid.innerHTML = '<p class="loading">Produk tidak ditemukan.</p>'; }
    else grid.innerHTML = data.products.map(productCard).join('');
    renderPagination(data);
  } catch (e) {
    grid.innerHTML = '<p class="loading">Gagal memuat produk.</p>';
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
  items.innerHTML = cart.map((i, idx) => `
    <div class="cart-item">
      ${i.image_url ? `<img src="${i.image_url}" alt="">` : ''}
      <div class="ci-info">
        <div class="ci-title">${i.title}</div>
        <div class="ci-price">${fmt(i.price)}</div>
      </div>
      <div class="ci-qty">
        <button onclick="changeQty(${idx}, -1)">−</button>
        <span>${i.qty}</span>
        <button onclick="changeQty(${idx}, 1)">+</button>
      </div>
      <button class="ci-remove" onclick="removeItem(${idx})">✕</button>
    </div>
  `).join('');
  updateTotal();
}
function changeQty(idx, delta) {
  const cart = getCart();
  cart[idx].qty = Math.max(1, (cart[idx].qty || 1) + delta);
  saveCart(cart); renderCart();
}
function removeItem(idx) {
  const cart = getCart();
  cart.splice(idx, 1);
  saveCart(cart); renderCart();
}
function updateTotal() {
  const cart = getCart();
  const total = cart.reduce((s, i) => s + (parseInt(i.price) || 0) * (i.qty || 1), 0);
  document.querySelectorAll('#totalAmount').forEach(el => el.textContent = fmt(total));
}

// ─── Checkout → WA ───
async function checkoutWa() {
  const name = document.getElementById('custName')?.value.trim();
  const wa = document.getElementById('custWa')?.value.trim();
  const note = document.getElementById('custNote')?.value.trim();
  const cart = getCart();
  if (!name) return showToast('⚠ Isi nama dulu');
  if (!wa) return showToast('⚠ Isi nomor WA dulu');
  if (!cart.length) return showToast('⚠ Keranjang kosong');
  try {
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_name: name, customer_wa: wa, items: cart, note })
    });
    const data = await res.json();
    if (data.wa_url) {
      localStorage.removeItem(CART_KEY); updateCartCount(); renderCart();
      showToast('✅ Order dibuat! WhatsApp terbuka...');
      setTimeout(() => window.open(data.wa_url, '_blank'), 600);
    } else {
      showToast('⚠ Gagal: ' + (data.error || 'unknown'));
    }
  } catch (e) {
    showToast('⚠ Gagal membuat order');
  }
}

// ─── Admin ───
let adminToken = sessionStorage.getItem('proindustri_admin_token') || '';
function adminLogin() {
  const pin = document.getElementById('pinInput').value.trim();
  if (!pin) return;
  adminToken = pin;
  sessionStorage.setItem('proindustri_admin_token', pin);
  verifyAdmin();
}
function setResult(elId, msg, ok) {
  const el = document.getElementById(elId);
  if (el) { el.className = 'result-msg ' + (ok ? 'ok' : 'err'); el.textContent = msg; }
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
      if (adminToken) showToast('⚠ PIN salah');
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
  if (!url) return showToast('⚠ Masukkan URL dulu');
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
        <span class="q-url" title="${t.source_url}">${t.source_url}</span>
        <span class="q-status ${t.status}">${t.status === 'pending' ? '⏳ Menunggu scrape' : t.status === 'done' ? '✅ Selesai' : '❌ ' + (t.error || 'gagal')}</span>
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
        <td class="mini-price">${fmt(p.price)}</td>
        <td>${p.stock}</td>
        <td>${p.is_active ? '✅' : '❌'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="toggleProduct(${p.id}, ${p.is_active})">${p.is_active ? 'Sembunyikan' : 'Tampilkan'}</button>
          <button class="btn btn-sm" onclick="deleteProduct(${p.id})" style="border-color:var(--border)">Hapus</button>
        </td>
      </tr>`).join('') : '<tr><td colspan="6" class="loading">Belum ada produk.</td></tr>';
  } catch (e) { tbody.innerHTML = '<tr><td colspan="6" class="loading">Gagal memuat.</td></tr>'; }
}
async function toggleProduct(id, isActive) {
  try {
    await fetch(`${API}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ is_active: isActive ? 0 : 1 })
    });
    loadAdminProducts();
  } catch (e) { showToast('⚠ Gagal'); }
}
async function deleteProduct(id) {
  if (!confirm('Hapus produk ini?')) return;
  try {
    await fetch(`${API}/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } });
    loadAdminProducts();
  } catch (e) { showToast('⚠ Gagal'); }
}

// Orders
async function loadOrders() {
  const el = document.getElementById('orderList');
  if (!el) return;
  try {
    const res = await fetch(`${API}/admin/orders`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    const data = await res.json();
    const orders = data.orders || [];
    el.innerHTML = orders.length ? orders.map(o => `
      <div class="queue-item">
        <div style="flex:1;font-size:13px">
          <strong>${o.order_code}</strong> — ${o.customer_name} (${o.customer_wa})<br>
          <span class="hint">${o.items.replace(/"/g, '')} • ${fmt(o.total)} • ${o.created_at}</span>
        </div>
        <span class="q-status pending">${o.status}</span>
      </div>`).join('') : '<p class="hint">Belum ada order.</p>';
  } catch (e) { el.innerHTML = '<p class="hint">Gagal memuat.</p>'; }
}

// ─── Admin tabs ───
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).style.display = 'block';
    });
  });
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  loadFeatured();
  initTabs();
  const grid = document.getElementById('productGrid');
  if (grid) {
    loadProducts();
    const search = document.getElementById('searchInput');
    const cat = document.getElementById('categoryFilter');
    if (search) {
      let t;
      search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { currentSearch = search.value.trim(); loadProducts(); }, 400); });
    }
    if (cat) {
      fetch(`${API}/categories`).then(r => r.json()).then(data => {
        cat.innerHTML = '<option value="">Semua Kategori</option>' + data.categories.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
        cat.addEventListener('change', () => { currentCat = cat.value; loadProducts(); });
      });
    }
  }
  const content = document.getElementById('cartContent');
  if (content) renderCart();
  // Admin init
  const loginGate = document.getElementById('loginGate');
  if (loginGate) {
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
