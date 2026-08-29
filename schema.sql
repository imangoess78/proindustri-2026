-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_note TEXT DEFAULT '',
  items TEXT NOT NULL,        -- JSON array
  sub INTEGER NOT NULL,
  disc INTEGER DEFAULT 0,
  disc_amt INTEGER DEFAULT 0,
  member_disc INTEGER DEFAULT 0,
  member_amt INTEGER DEFAULT 0,
  voucher_amt INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  payment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Menunggu Pembayaran',
  resi TEXT DEFAULT '',
  deadline TEXT DEFAULT '',
  complaint TEXT DEFAULT '',  -- JSON object
  shipping TEXT DEFAULT '{}', -- JSON: {city, province, courier, cost, etd, weight}
  shipping_cost INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Questions / Tanya Jawab
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT DEFAULT '',
  user_name TEXT DEFAULT 'Anonim',
  date TEXT NOT NULL,
  answered_at TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_questions_product ON questions(product_id);
CREATE INDEX IF NOT EXISTS idx_questions_date ON questions(date DESC);

-- Admin sessions (simple token auth, no Firebase)
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

-- Users (member login/register)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  join_date TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);


-- Products (admin CRUD + frontpage source)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT DEFAULT '',
  name TEXT NOT NULL,
  short_name TEXT DEFAULT '',
  desc TEXT DEFAULT '',
  category TEXT DEFAULT '',
  img_key TEXT DEFAULT '',
  img TEXT DEFAULT '',
  min_price INTEGER DEFAULT 0,
  max_price INTEGER DEFAULT 0,
  variants TEXT DEFAULT '[]',
  specs TEXT DEFAULT '{}',
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Articles / Blog
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Blog',
  content TEXT DEFAULT '',
  image TEXT DEFAULT '',
  status TEXT DEFAULT 'Draft',
  views INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at DESC);

-- Shipping: kota tujuan ongkir (seperti RajaOngkir)
CREATE TABLE IF NOT EXISTS shipping_cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  zone INTEGER NOT NULL DEFAULT 1   -- zona tarif 1=Jabodetabek ... 7=Papua
);
CREATE INDEX IF NOT EXISTS idx_shipping_city ON shipping_cities(city);
CREATE INDEX IF NOT EXISTS idx_shipping_province ON shipping_cities(province);

-- Shipping: tarif per zona per kurir (per kg)
CREATE TABLE IF NOT EXISTS shipping_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  courier TEXT NOT NULL,       -- jne | jnt | sicepat | pos | idexpress
  zone INTEGER NOT NULL,
  cost_per_kg INTEGER NOT NULL,
  etd TEXT DEFAULT ''          -- estimasi hari (contoh: '1-2')
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_shipping_rate ON shipping_rates(courier, zone);

-- Categories: dinamis, bisa CRUD admin
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL,
  icon TEXT DEFAULT '📦',
  featured_image TEXT DEFAULT '',
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO categories (slug, name, icon, featured_image, description, sort_order) VALUES
('mesin-tools','Mesin & Tools','⚙️','','Mesin bor, gerinda, las, compressor & power tools impor China',1),
('elektronik-power-tools','Elektronik & Power Tools','🔌','','Perkakas listrik, kabel, multimeter & perlengkapan elektronik industri',2),
('industri-manufaktur','Industri & Manufaktur','🏭','','Perlengkapan manufaktur, alat ukur & kebutuhan pabrik',3),
('safety-perlengkapan','Safety & Perlengkapan','🦺','','Helm, sarung tangan las & APD standar industri',4),
('lainnya','Lainnya','📦','','Produk industri lainnya',5);

-- Notifications: push-in-app untuk admin & customer
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer',
  type TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  message TEXT DEFAULT '',
  link TEXT DEFAULT '',
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notif_admin ON notifications(role, is_read);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);

-- Coupons / Kupon diskon
CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'percent',
  value INTEGER NOT NULL DEFAULT 0,
  min_order INTEGER NOT NULL DEFAULT 0,
  max_discount INTEGER DEFAULT 0,
  usage_limit INTEGER DEFAULT 0,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
