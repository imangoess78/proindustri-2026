// ProIndustri — Seed produk impor China (industri & tools)
// Format: {id, name, short_name, desc, category, img_key, img, min_price, max_price, variants, specs, slug}
export const PRODUCTS_SEED = [
  {
    id: 'PI-001',
    name: 'Mesin Bor Tangan Industri 800W',
    short_name: 'Mesin Bor Industri 800W',
    desc: 'Mesin bor tangan 800W untuk kebutuhan industri dan konstruksi. Cocok untuk pengeboran kayu, besi, dan beton. Dilengkapi chuck 13mm, speed variabel, dan handle tambahan untuk kenyamanan.',
    category: 'Mesin & Tools',
    img_key: 'cat_mesin',
    img: '/img/products/bor_800w.jpg',
    min_price: 350000,
    max_price: 450000,
    variants: [
      { name: '800W Standard', price: 350000, stock: 50, min_qty: 1 },
      { name: '800W + Box Set', price: 450000, stock: 25, min_qty: 1 }
    ],
    specs: { 'Daya': '800W', 'Chuck': '13mm', 'Kecepatan': '0-2800 RPM', 'Berat': '1.8 kg', 'Garansi': '1 Tahun' },
    slug: 'mesin-bor-tangan-industri-800w'
  },
  {
    id: 'PI-002',
    name: 'Mesin Gerinda Tangan 4" 850W',
    short_name: 'Mesin Gerinda 4" 850W',
    desc: 'Gerinda tangan 4 inci dengan daya 850W, cocok untuk memotong dan mengamplas logam, keramik, dan batu. Desain ergonomis, safety switch, dan carbon brush yang mudah diganti.',
    category: 'Mesin & Tools',
    img_key: 'cat_mesin',
    img: '/img/products/gerinda_4.jpg',
    min_price: 280000,
    max_price: 380000,
    variants: [
      { name: '850W Standard', price: 280000, stock: 60, min_qty: 1 },
      { name: '850W + Box Set', price: 380000, stock: 30, min_qty: 1 }
    ],
    specs: { 'Daya': '850W', 'Ukuran Batu': '4" (100mm)', 'Kecepatan': '11000 RPM', 'Berat': '1.6 kg', 'Garansi': '1 Tahun' },
    slug: 'mesin-gerinda-tangan-4-850w'
  },
  {
    id: 'PI-003',
    name: 'Mesin Las Listrik MMA 200A Inverter',
    short_name: 'Mesin Las MMA 200A',
    desc: 'Mesin las inverter MMA 200A dengan teknologi IGBT, hemat daya dan stabil. Cocok untuk las besi dan stainless steel. Dilengkapi hot start, anti-stick, dan arc force.',
    category: 'Mesin & Tools',
    img_key: 'cat_mesin',
    img: '/img/products/las_200a.jpg',
    min_price: 650000,
    max_price: 850000,
    variants: [
      { name: '200A Standard', price: 650000, stock: 20, min_qty: 1 },
      { name: '200A + Helm + Elektroda', price: 850000, stock: 15, min_qty: 1 }
    ],
    specs: { 'Tipe': 'MMA Inverter', 'Arus': '20-200A', 'Daya': '4.5 kVA', 'Berat': '5.2 kg', 'Garansi': '1 Tahun' },
    slug: 'mesin-las-listrik-mma-200a-inverter'
  },
  {
    id: 'PI-004',
    name: 'Compressor Angin 24L 1HP',
    short_name: 'Compressor 24L 1HP',
    desc: 'Compressor angin 24 liter dengan motor 1HP, cocok untuk pemakaian industri ringan, bengkel, dan cat ulang. Tekanan max 8 bar, dilengkapi pressure gauge dan safety valve.',
    category: 'Mesin & Tools',
    img_key: 'cat_mesin',
    img: '/img/products/compressor_24l.jpg',
    min_price: 1200000,
    max_price: 1500000,
    variants: [
      { name: '24L 1HP Oil-Free', price: 1200000, stock: 10, min_qty: 1 },
      { name: '24L 1HP + 5 Pcs Tool Kit', price: 1500000, stock: 8, min_qty: 1 }
    ],
    specs: { 'Kapasitas': '24 Liter', 'Daya': '1 HP (750W)', 'Tekanan Max': '8 Bar', 'Berat': '18 kg', 'Garansi': '1 Tahun' },
    slug: 'compressor-angin-24l-1hp'
  },
  {
    id: 'PI-005',
    name: 'Mesin Bor Impact 18V Cordless (2 Baterai)',
    short_name: 'Bor Impact 18V Cordless',
    desc: 'Bor impact cordless 18V dengan 2 baterai lithium-ion. Cocok untuk pengeboran dan sekrup tanpa kabel. LED work light, quick chuck, dan carrying case.',
    category: 'Elektronik & Power Tools',
    img_key: 'cat_elektronik',
    img: '/img/products/bor_impact_18v.jpg',
    min_price: 550000,
    max_price: 750000,
    variants: [
      { name: '18V 2 Batrei 2.0Ah', price: 550000, stock: 35, min_qty: 1 },
      { name: '18V 2 Baterai 4.0Ah', price: 750000, stock: 20, min_qty: 1 }
    ],
    specs: { 'Tegangan': '18V', 'Baterai': 'Lithium-ion 2.0Ah/4.0Ah', 'Chuck': '13mm', 'Torsi': '45 Nm', 'Garansi': '1 Tahun' },
    slug: 'mesin-bor-impact-18v-cordless'
  },
  {
    id: 'PI-006',
    name: 'Mesin Circular Saw 7" 1200W',
    short_name: 'Circular Saw 7" 1200W',
    desc: 'Mesin circular saw 7 inci dengan daya 1200W, mampu memotong kayu, multipleks, dan triplek dengan presisi. Depth adjustment, laser guide, dan dust blower.',
    category: 'Mesin & Tools',
    img_key: 'cat_mesin',
    img: '/img/products/circular_7.jpg',
    min_price: 450000,
    max_price: 600000,
    variants: [
      { name: '1200W Standard', price: 450000, stock: 20, min_qty: 1 },
      { name: '1200W + Spare Blade', price: 600000, stock: 12, min_qty: 1 }
    ],
    specs: { 'Daya': '1200W', 'Ukuran Mata': '7" (185mm)', 'Kedalaman Potong': '65mm @90°', 'Kecepatan': '5000 RPM', 'Garansi': '1 Tahun' },
    slug: 'mesin-circular-saw-7-1200w'
  },
  {
    id: 'PI-007',
    name: 'Safety Helmet Industri Proyek + Earplug Set',
    short_name: 'Safety Helmet + Earplug',
    desc: 'Helm safety standar proyek SNI, dilengkapi earplug dan strap adjustable. Tahan benturan, ringan, dan nyaman dipakai seharian. Pilihan warna: putih, kuning, biru, merah.',
    category: 'Safety & Perlengkapan',
    img_key: 'cat_safety',
    img: '/img/products/safety_helmet.jpg',
    min_price: 45000,
    max_price: 65000,
    variants: [
      { name: 'Helm + Earplug (Putih)', price: 45000, stock: 200, min_qty: 5 },
      { name: 'Helm + Earplug (Kuning)', price: 45000, stock: 200, min_qty: 5 },
      { name: 'Helm + Earplug (Biru)', price: 45000, stock: 150, min_qty: 5 },
      { name: 'Helm + Earplug (Merah)', price: 45000, stock: 150, min_qty: 5 },
      { name: 'Helm Set + Earplug + Masker', price: 65000, stock: 100, min_qty: 5 }
    ],
    specs: { 'Standar': 'SNI 01-6363-2000', 'Bahan': 'HDPE', 'Berat': '380 gram', 'Aksesoris': 'Earplug + Strap' },
    slug: 'safety-helmet-industri-proyek-earplug-set'
  },
  {
    id: 'PI-008',
    name: 'Sarung Tangan Las Kulit (Welding Gloves) Heavy Duty',
    short_name: 'Sarung Tangan Las Heavy Duty',
    desc: 'Sarung tangan las dari kulit sapi asli, tahan percikan api dan panas tinggi. Cocok untuk las MMA, MIG, dan TIG. Jahitan double reinforced, panjang 35cm.',
    category: 'Safety & Perlengkapan',
    img_key: 'cat_safety',
    img: '/img/products/welding_gloves.jpg',
    min_price: 85000,
    max_price: 120000,
    variants: [
      { name: 'Standard (35cm)', price: 85000, stock: 100, min_qty: 2 },
      { name: 'Premium (40cm, double layer)', price: 120000, stock: 60, min_qty: 2 }
    ],
    specs: { 'Bahan': 'Kulit Sapi Asli', 'Panjang': '35-40 cm', 'Tahan Panas': '~350°C', 'Jahitan': 'Double Kevlar' },
    slug: 'sarung-tangan-las-kulit-welding-gloves'
  },
  {
    id: 'PI-009',
    name: 'Kabel NYYHY 3x2.5mm 50m (Tembaga Murni)',
    short_name: 'Kabel NYYHY 3x2.5mm 50m',
    desc: 'Kabel listrik NYYHY 3x2.5mm tembaga murni, panjang 50 meter. SNI certified, cocok untuk instalasi industri, panel listrik, dan power distribution. Fleksibel, tahan panas.',
    category: 'Elektronik & Power Tools',
    img_key: 'cat_elektronik',
    img: '/img/products/kabel_nyyhy.jpg',
    min_price: 450000,
    max_price: 450000,
    variants: [
      { name: '3x2.5mm 50m', price: 450000, stock: 40, min_qty: 1 }
    ],
    specs: { 'Tipe': 'NYYHY', 'Ukuran': '3x2.5 mm²', 'Panjang': '50 meter', 'Bahan': 'Tembaga Murni', 'Standar': 'SNI 04-6629-2001' },
    slug: 'kabel-nyyhy-3x25mm-50m'
  },
  {
    id: 'PI-010',
    name: 'Measuring Tape / Meteran 50m Fiberglass',
    short_name: 'Meteran 50m Fiberglass',
    desc: 'Meteran gulung fiberglass panjang 50 meter, cocok untuk survey lapangan, konstruksi, dan pengukuran industri. Anti karat, angka jelas, dan casing karet anti pecah.',
    category: 'Industri & Manufaktur',
    img_key: 'cat_industri',
    img: '/img/products/meteran_50m.jpg',
    min_price: 65000,
    max_price: 95000,
    variants: [
      { name: '50m Fiberglass', price: 65000, stock: 80, min_qty: 1 },
      { name: '50m Fiberglass + Clamp', price: 95000, stock: 40, min_qty: 1 }
    ],
    specs: { 'Panjang': '50 meter', 'Bahan': 'Fiberglass', 'Lebar': '13mm', 'Casing': 'Karet Anti Pecah' },
    slug: 'measuring-tape-meteran-50m-fiberglass'
  },
  {
    id: 'PI-011',
    name: 'Tool Kit Set 150 Pcs (Socket + Kunci + Obeng)',
    short_name: 'Tool Kit 150 Pcs Set',
    desc: 'Tool kit profesional 150 pcs dalam 1 box. Termasuk socket set, kunci ring/pas, obeng set, kunci L, tang, dan aksesoris. Cocok untuk bengkel, industri, dan rumah tangga.',
    category: 'Industri & Manufaktur',
    img_key: 'cat_industri',
    img: '/img/products/toolkit_150.jpg',
    min_price: 250000,
    max_price: 350000,
    variants: [
      { name: '150 Pcs Standard', price: 250000, stock: 30, min_qty: 1 },
      { name: '150 Pcs Premium + Tas', price: 350000, stock: 15, min_qty: 1 }
    ],
    specs: { 'Jumlah': '150 Pcs', 'Bahan': 'CR-V (Chrome Vanadium)', 'Box': 'Plastik ABS + Aluminium Frame', 'Berat': '3.5 kg' },
    slug: 'tool-kit-set-150-pcs'
  },
  {
    id: 'PI-012',
    name: 'Multimeter Digital AC/DC Clamp Meter',
    short_name: 'Multimeter Clamp Meter',
    desc: 'Clamp meter digital untuk pengukuran arus AC/DC, tegangan, resistansi, dan kontinuitas. Dilengkapi backlight, data hold, dan NCV (non-contact voltage) detection.',
    category: 'Elektronik & Power Tools',
    img_key: 'cat_elektronik',
    img: '/img/products/clamp_meter.jpg',
    min_price: 180000,
    max_price: 280000,
    variants: [
      { name: 'Auto Range Standard', price: 180000, stock: 40, min_qty: 1 },
      { name: 'Auto Range + Temperature', price: 280000, stock: 20, min_qty: 1 }
    ],
    specs: { 'Tipe': 'Clamp Meter Digital', 'AC Current': '0-600A', 'DC Current': '0-600A', 'Display': 'LCD Backlight', 'Fitur': 'NCV, Data Hold, True RMS' },
    slug: 'multimeter-digital-acdc-clamp-meter'
  }
];