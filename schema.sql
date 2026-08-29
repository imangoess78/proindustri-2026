-- ProIndustri — D1 schema
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS scrape_queue;

CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,          -- harga jual (Rupiah, integer)
  cost_price INTEGER DEFAULT 0,              -- harga modal (opsional)
  image_url TEXT DEFAULT '',                 -- URL di R2 / CDN
  source_url TEXT DEFAULT '',                -- URL AliExpress asli
  category_id INTEGER REFERENCES categories(id),
  stock INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_wa TEXT NOT NULL,
  items TEXT NOT NULL DEFAULT '[]',          -- JSON array [{id,title,price,qty}]
  total INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'new',                 -- new|confirmed|paid|shipped|done|cancelled
  note TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE scrape_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_url TEXT NOT NULL,
  title TEXT DEFAULT '',
  price TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',             -- pending|done|failed
  error TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_scrape_status ON scrape_queue(status);

-- Seed kategori
INSERT INTO categories (name, slug) VALUES
  ('Mesin & Tools', 'mesin-tools'),
  ('Elektronik', 'elektronik'),
  ('Industri & Manufaktur', 'industri-manufaktur'),
  ('Safety & Perlengkapan', 'safety-perlengkapan'),
  ('Lainnya', 'lainnya');
