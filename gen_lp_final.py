#!/usr/bin/env python3
"""Generate clean LP pages with details/summary FAQ, IC helper, sprite."""
import re, os, json

KONTAK = open('public/kontak.html', encoding='utf-8').read()
m = re.search(r'(<svg[^>]*style="display:none"[^>]*>.*?</svg>)', KONTAK, re.S)
SPRITE = m.group(1) if m else ''

IC_SNIPPET = '<script>window.IC = (n) => `<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;</script>'

# ============ DATA 10 LP ============
LPS = [
  {
    'slug': 'honeywell-xnx-gas-detector',
    'title': 'Honeywell XNX Gas Detector — Jual Universal Gas Transmitter',
    'h1': 'Honeywell XNX Universal Gas Transmitter',
    'desc': 'Jual Honeywell XNX gas detector — universal gas transmitter untuk deteksi gas berbahaya. Harga kompetitif, garansi resmi. Tersedia xnx xnx honeywell analysis & detector.',
    'intro': '''<p>Honeywell XNX adalah <strong>universal gas transmitter</strong> generasi terbaru yang kompatibel dengan berbagai sensor gas — mulai dari oksigen, hidrogen sulfida, karbon monoksida, hingga gas mudah meledak. Perangkat ini banyak digunakan di industri minyak & gas, pertambangan, petrokimia, dan pengolahan air limbah.</p><p>Dengan desain modular yang mendukung hingga 15 jenis sensor berbeda, XNX memberikan fleksibilitas maksimal dalam satu platform. Dilengkapi tampilan digital, output analog 4-20 mA, relay alarm, dan komunikasi HART sebagai standar.</p>''',
    'features': [
      'Kompatibel dengan 15+ jenis sensor gas (katalitik, elektrokimia, IR)',
      'Output 4-20 mA, HART, relay alarm 3 level',
      'Tampilan LCD backlit dengan status LED',
      'Sertifikasi ATEX, IECEx, SIL 2 untuk area berbahaya',
      'Housing stainless steel & aluminium — tahan korosi dan ledakan',
      'Konfigurasi mudah via menu onboard atau software'
    ],
    'products': [
      ('XNX Universal Gas Transmitter','Sensor universal, 4-20 mA + HART, ATEX, SIL 2','https://darmasakti.com/jual/honeywell-xnx-universal-gas-transmitter'),
      ('XNX + Sensor O2','Oksigen 0-25% vol, elektrokimia','https://darmasakti.com/jual/honeywell-xnx-universal-gas-transmitter'),
      ('XNX + Sensor H2S','Hidrogen sulfida 0-100 ppm','https://darmasakti.com/jual/honeywell-xnx-universal-gas-transmitter'),
      ('XNX + Sensor CO','Karbon monoksida 0-1000 ppm','https://darmasakti.com/jual/honeywell-xnx-universal-gas-transmitter'),
      ('XNX + Sensor LEL','Gas mudah meledak 0-100% LEL','https://darmasakti.com/jual/honeywell-xnx-universal-gas-transmitter'),
    ],
    'faqs': [
      ('Apa itu Honeywell XNX gas detector?','Honeywell XNX adalah universal gas transmitter yang menerima berbagai jenis sensor gas. Berfungsi sebagai monitor gas tetap (fixed gas detector) untuk deteksi kebocoran gas berbahaya di area industri.'),
      ('Berapa harga Honeywell XNX?','Harga tergantung konfigurasi sensor dan aksesori. Hubungi kami untuk penawaran harga terbaru sesuai kebutuhan Anda.'),
      ('Sensor gas apa saja yang kompatibel dengan XNX?','XNX mendukung sensor katalitik, elektrokimia (O2, H2S, CO, SO2, Cl2, NH3, dll), dan infra merah (IR) untuk CO2 dan hidrokarbon.'),
      ('Apakah XNX memiliki sertifikasi untuk area berbahaya?','Ya, XNX memiliki sertifikasi ATEX, IECEx, dan SIL 2 sehingga aman digunakan di area berbahaya (zona 1, 2, 21, 22).'),
      ('Bagaimana cara memesan Honeywell XNX?','Anda dapat mengisi form inquiry di bawah atau menghubungi kami via WhatsApp. Tim kami akan membantu memilih konfigurasi yang tepat.'),
    ]
  },
  {
    'slug': 'mitutoyo',
    'title': 'Distributor Mitutoyo Indonesia — Jual Alat Ukur Presisi',
    'h1': 'Distributor Mitutoyo Indonesia',
    'desc': 'Distributor Mitutoyo Indonesia — jual alat ukur presisi: caliper, micrometer, dial gauge, height gauge, CMM. Harga bersaing, garansi resmi, pengiriman seluruh Indonesia.',
    'intro': '<p><strong>Mitutoyo</strong> adalah merek alat ukur presisi asal Jepang yang telah menjadi standar global di industri manufaktur, otomotif, dan engineering. Dari jangka sorong digital hingga mesin ukur koordinat (CMM), Mitutoyo dikenal dengan akurasi tinggi, durabilitas, dan inovasi teknologi pengukuran.</p><p>Kami menyediakan berbagai produk Mitutoyo untuk kebutuhan kalibrasi, quality control, dan produksi Anda. Tersedia jangka sorong digital, mikrometer, dial gauge, indikator, height gauge, dan aksesori pengukuran lainnya.</p>',
    'features': [
      'Produk asli Mitutoyo Jepang dengan garansi resmi',
      'Tersedia caliper, micrometer, dial gauge, height gauge, CMM',
      'Akurasi tinggi dengan resolusi hingga 0.001 mm',
      'Tipe digital dan analog — cocok untuk berbagai aplikasi',
      'Dukungan kalibrasi dan sertifikat traceable',
      'Pengiriman ke seluruh Indonesia'
    ],
    'products': [
      ('Mitutoyo Digital Caliper 150mm/6\"','Seri 500-196-30, LCD, IP67, akurasi ±0.02mm','https://darmasakti.com/product-brand/mitutoyo'),
      ('Mitutoyo Micrometer Outside 0-25mm','Seri 293-340-30, ratchet stop, 0.001mm','https://darmasakti.com/product-brand/mitutoyo'),
      ('Mitutoyo Dial Indicator 0.01mm','Range 10mm, seri 2046S','https://darmasakti.com/product-brand/mitutoyo'),
      ('Mitutoyo Height Gauge 300mm','Seri 570-227, digital, ABS scale','https://darmasakti.com/product-brand/mitutoyo'),
      ('Mitutoyo CMM (Coordinate Measuring Machine)','CRYSTA-Apex S Series, berbagai ukuran','https://darmasakti.com/product-brand/mitutoyo'),
    ],
    'faqs': [
      ('Apa itu Mitutoyo?','Mitutoyo adalah perusahaan alat ukur presisi asal Jepang, produsen jangka sorong, mikrometer, dial gauge, dan mesin ukur CMM yang digunakan di industri manufaktur global.'),
      ('Berapa harga Mitutoyo Digital Caliper?','Harga Mitutoyo Digital Caliper 150mm bervariasi tergantung seri. Hubungi kami untuk harga terbaru.'),
      ('Apakah produk Mitutoyo yang dijual original?','Ya, seluruh produk Mitutoyo yang kami jual adalah produk original dengan garansi resmi distributor.'),
      ('Bagaimana cara merawat alat ukur Mitutoyo?','Simpan di tempat kering, bersihkan setelah pemakaian, kalibrasi secara berkala, dan hindari benturan keras.'),
      ('Apakah Mitutoyo menyediakan sertifikat kalibrasi?','Ya, tersedia sertifikat kalibrasi traceable untuk setiap alat ukur.'),
    ]
  },
  {
    'slug': 'alat-laboratorium',
    'title': 'Toko Alat Laboratorium — Jual Peralatan Lab Industri',
    'h1': 'Toko Alat Laboratorium & Peralatan Lab',
    'desc': 'Toko alat laboratorium terlengkap — jual peralatan lab industri, gelas kimia, oven, timbangan, mikroskop, pH meter. Harga bersaing, kirim seluruh Indonesia.',
    'intro': '<p>Kami menyediakan berbagai <strong>alat laboratorium</strong> untuk kebutuhan pendidikan, riset, industri, dan kesehatan. Dari peralatan gelas dasar hingga instrumen analitik canggih, semua tersedia dengan kualitas terjamin.</p><p>Laboratorium membutuhkan peralatan yang akurat dan andal. Kami bekerja sama dengan merek-merek terpercaya untuk memastikan setiap alat yang Anda gunakan memberikan hasil pengukuran dan analisis yang presisi.</p>',
    'features': [
      'Tersedia alat laboratorium dari berbagai merek internasional',
      'Peralatan gelas, timbangan, oven, inkubator, spektrofotometer',
      'Alat ukur pH, konduktivitas, DO, TDS — untuk uji kualitas air & tanah',
      'Mikroskop, autoklaf, sentrifus untuk laboratorium mikrobiologi',
      'Harga bersaing dengan garansi resmi',
      'Pengiriman ke seluruh Indonesia'
    ],
    'products': [
      ('Timbangan Analitik Digital','Akurasi 0.0001g, kapasitas max 220g, kalibrasi internal','https://darmasakti.com/harga/alat-laboratorium'),
      ('pH Meter Digital','Range 0-14 pH, akurasi ±0.01, ATC','https://darmasakti.com/harga/alat-laboratorium'),
      ('Oven Laboratorium','Range 50-300°C, volume 50L, digital PID','https://darmasakti.com/harga/alat-laboratorium'),
      ('Mikroskop Binokuler','Perbesaran 40x-1500x, LED illumination','https://darmasakti.com/harga/alat-laboratorium'),
      ('Autoklaf Sterilisator','Kapasitas 18L, 126°C, digital','https://darmasakti.com/harga/alat-laboratorium'),
    ],
    'faqs': [
      ('Apa saja alat laboratorium yang tersedia?','Kami menyediakan alat laboratorium umum (gelas, timbangan, oven), alat ukur (pH meter, DO meter, spektrofotometer), dan alat mikrobiologi (mikroskop, autoklaf, laminar flow).'),
      ('Harga alat laboratorium?','Harga bervariasi tergantung merek, spesifikasi, dan kelengkapan. Silakan hubungi kami untuk penawaran sesuai kebutuhan.'),
      ('Apakah ada garansi untuk alat lab?','Ya, setiap alat laboratorium mendapat garansi sesuai ketentuan merek masing-masing.'),
      ('Bagaimana cara memesan?','Anda bisa mengisi form inquiry di bawah atau langsung chat WA. Tim kami akan membantu memilih alat yang sesuai.'),
    ]
  },
  {
    'slug': 'bosch',
    'title': 'Distributor Bosch Indonesia — Jual Power Tools & Aksesori',
    'h1': 'Distributor Bosch Indonesia',
    'desc': 'Distributor Bosch Indonesia — jual power tools, bor, gerinda, laser distance meter, dan aksesori. Tersedia di Surabaya, Jakarta, Batam, Balikpapan, Palembang, Jogja. Harga terbaik.',
    'intro': '<p><strong>Bosch</strong> adalah merek global terkemuka untuk power tools dan perlengkapan industri. Dari bor listrik, gerinda tangan, hingga laser distance meter GLM400, Bosch dikenal dengan kualitas Jerman, durabilitas tinggi, dan inovasi teknologi.</p><p>Kami adalah distributor Bosch yang melayani pengiriman ke seluruh Indonesia: Jakarta, Surabaya, Batam, Balikpapan, Palembang, Jogja, dan kota lainnya. Tersedia power tools cordless, corded, dan aksesori original Bosch.</p>',
    'features': [
      'Produk Bosch original dengan garansi resmi',
      'Tersedia power tools cordless & corded',
      'Bosch Laser Distance Meter GLM400 — akurasi ±1.5mm',
      'Melayani pengiriman ke seluruh Indonesia',
      'Tersedia service center untuk perbaikan',
      'Harga distributor untuk partai besar'
    ],
    'products': [
      ('Bosch Bor Impact GSB 18V-50','Cordless, 2 baterai 18V, 50 Nm, LED','https://darmasakti.com/product-brand/bosch'),
      ('Bosch Gerinda GWS 7-115','7A, 720W, 11000 rpm, 4\"','https://darmasakti.com/product-brand/bosch'),
      ('Bosch Laser GLM400','40m, akurasi ±1.5mm, Bluetooth','https://darmasakti.com/jual/bosch-glm400-laser-distance-meter'),
      ('Bosch Bor Hammer GBH 2-26 DRE','SDS+, 800W, 2.7 J, variabel speed','https://darmasakti.com/product-brand/bosch'),
      ('Bosch Aksesori Set Mata Bor','Set 13 pcs, HSS, titanium coated','https://darmasakti.com/product-brand/bosch'),
    ],
    'faqs': [
      ('Di mana lokasi distributor Bosch terdekat?','Kami melayani pengiriman seluruh Indonesia. Untuk pembelian langsung, hubungi kami untuk informasi stok dan lokasi terdekat.'),
      ('Berapa harga Bosch GLM400 laser distance meter?','Harga tergantung varian dan promo. Silakan hubungi kami untuk harga terbaru.'),
      ('Apakah ada service center Bosch?','Kami menyediakan layanan purna jual dan informasi service center resmi Bosch.'),
      ('Bosch Surabaya apakah ada?','Kami melayani pengiriman ke Surabaya dan seluruh Jawa Timur.'),
    ]
  },
  {
    'slug': 'kyoritsu',
    'title': 'Distributor Kyoritsu — Jual Alat Ukur Listrik',
    'h1': 'Distributor Kyoritsu Indonesia',
    'desc': 'Distributor Kyoritsu Indonesia — jual clamp meter, multimeter, insulation tester, earth tester. Alat ukur listrik berkualitas dari Jepang. Harga bersaing.',
    'intro': '<p><strong>Kyoritsu</strong> adalah merek alat ukur listrik asal Jepang yang telah dipercaya oleh para teknisi dan insinyur listrik di seluruh dunia. Produk Kyoritsu mencakup clamp meter, multimeter digital, insulation tester, earth resistance tester, dan phase rotation tester.</p><p>Dikenal dengan akurasi tinggi, keamanan (CAT III/CAT IV), dan durabilitas, Kyoritsu menjadi pilihan utama untuk pengukuran listrik di industri, bangunan, dan instalasi tenaga.</p>',
    'features': [
      'Alat ukur listrik Kyoritsu original Jepang',
      'Tersedia clamp meter AC/DC, insulation tester, earth tester',
      'Sertifikasi keamanan CAT III 600V / CAT IV 300V',
      'Akurasi tinggi untuk pengukuran presisi',
      'Garansi resmi dan dukungan teknis',
      'Pengiriman ke seluruh Indonesia'
    ],
    'products': [
      ('Kyoritsu Clamp Meter 2002R','AC 2000A, true RMS, CAT III 600V','https://darmasakti.com/product-brand/kyoritsu'),
      ('Kyoritsu Insulation Tester 3125','5000V, digital, PI/DAR, CAT IV 600V','https://darmasakti.com/product-brand/kyoritsu'),
      ('Kyoritsu Earth Tester 4105A','Digital, 2/3 pole, 200Ω range','https://darmasakti.com/product-brand/kyoritsu'),
      ('Kyoritsu Multimeter 1009','Digital, True RMS, AC/DC 1000V','https://darmasakti.com/product-brand/kyoritsu'),
      ('Kyoritsu Phase Rotation Tester 8031','Non-contact, LED indicator, 40-600V','https://darmasakti.com/product-brand/kyoritsu'),
    ],
    'faqs': [
      ('Apa itu Kyoritsu?','Kyoritsu adalah merek alat ukur listrik asal Jepang yang memproduksi clamp meter, insulation tester, dan earth tester untuk aplikasi industri.'),
      ('Berapa harga Kyoritsu clamp meter?','Harga Kyoritsu Clamp Meter 2002R bervariasi. Hubungi kami untuk penawaran terbaik.'),
      ('Apakah produk Kyoritsu original?','Ya, seluruh produk Kyoritsu yang kami jual adalah original dengan garansi.'),
      ('Bagaimana cara memilih Kyoritsu yang tepat?','Kebutuhan: clamp meter untuk pengukuran arus, insulation tester untuk tahanan isolasi, earth tester untuk pentanahan. Tim kami siap membantu.'),
    ]
  },
  {
    'slug': 'skf-bearing',
    'title': 'Distributor Bearing SKF — Jual Bearing & Seal Industri',
    'h1': 'Distributor Bearing SKF Indonesia',
    'desc': 'Distributor SKF bearing — jual bearing, seal, dan pelumas industri. Tersedia ball bearing, roller bearing, spherical bearing, dan aksesoris. Harga bersaing, Jakarta.',
    'intro': '<p><strong>SKF</strong> adalah merek bearing dan seal asal Swedia yang menjadi pemimpin global dalam teknologi bantalan (bearing). Dari ball bearing, roller bearing, spherical bearing, hingga bearing housing dan seal, SKF digunakan di berbagai industri: otomotif, manufaktur, pertambangan, dan pembangkit listrik.</p><p>Kami menyediakan berbagai tipe bearing SKF untuk kebutuhan industri Anda. Tersedia bearing SKF original dengan garansi resmi distributor.</p>',
    'features': [
      'Bearing SKF original — berbagai tipe: ball, roller, spherical',
      'Bearing seal, housing, dan aksesori pendukung',
      'Pelumas SKF untuk perawatan bearing',
      'Melayani kebutuhan spare part industri',
      'Harga bersaing untuk partai kecil hingga besar',
      'Pengiriman ke seluruh Indonesia'
    ],
    'products': [
      ('SKF Ball Bearing 6205-2RS','Deep groove, 25x52x15mm, karet 2 sisi','https://darmasakti.com/product-brand/skf'),
      ('SKF Roller Bearing NU 205','Cylindrical, 25x52x15mm, brass cage','https://darmasakti.com/product-brand/skf'),
      ('SKF Spherical Bearing 22220 CC','100x180x46mm, spherical roller','https://darmasakti.com/product-brand/skf'),
      ('SKF Bearing Housing SNL 515','Split housing, cast iron, untuk 515 series','https://darmasakti.com/product-brand/skf'),
      ('SKF Grease LGHP 2','High-temp, 18 kg pail, untuk industri','https://darmasakti.com/product-brand/skf'),
    ],
    'faqs': [
      ('Apa itu SKF bearing?','SKF adalah produsen bearing asal Swedia yang memproduksi ball bearing, roller bearing, spherical bearing, dan aksesori untuk industri.'),
      ('Berapa harga bearing SKF 6205?','Harga SKF 6205-2RS tergantung varian (C3, 2RS, karet). Hubungi kami untuk harga terkini.'),
      ('Apakah ada SKF bearing untuk pabrik kelapa sawit?','Ya, kami menyediakan bearing SKF yang cocok untuk industri sawit: spherical roller bearing, pillow block, dan bearing housing.'),
      ('Bagaimana cara membedakan bearing SKF asli dan palsu?','Bearing asli memiliki kode laser presisi, kemasan resmi, dan hologram. Kami hanya menjual produk original.'),
    ]
  },
  {
    'slug': 'total-station',
    'title': 'Jual Total Station — Topcon, Ruide & Alat Survey Pemetaan',
    'h1': 'Jual Total Station & Alat Survey Pemetaan',
    'desc': 'Jual total station Topcon, Ruide, dan alat survey pemetaan. Tersedia total station bekas, echo sounder, GPS survey. Harga bersaing, garansi, kirim Indonesia.',
    'intro': '<p><strong>Total station</strong> adalah alat utama dalam pekerjaan survey pemetaan dan konstruksi. Kami menyediakan berbagai merek total station: <strong>Topcon</strong>, <strong>Ruide</strong>, dan aksesori survey seperti echo sounder, GPS survey, dan prisma reflektor.</p><p>Baik untuk proyek pemetaan lahan, pengukuran topografi, konstruksi jalan, atau bathymetry (echo sounder), kami memiliki alat survey yang tepat untuk kebutuhan Anda. Tersedia juga total station bekas berkualitas dengan harga ekonomis.</p>',
    'features': [
      'Total station Topcon & Ruide — berbagai tipe dan spesifikasi',
      'Single beam echo sounder untuk bathymetry',
      'Tersedia GPS survey, prisma, tripod, dan aksesori',
      'Kalibrasi dan servis alat survey',
      'Jual beli alat survey bekas — kondisi baik, harga bersaing',
      'Pengiriman ke seluruh Indonesia'
    ],
    'products': [
      ('Topcon Total Station ES-105','1\" (0.3mgon), 500m reflektor, 350m non-prisma','https://darmasakti.com/product-brand/topcon'),
      ('Ruide Total Station RTS-822','2\", 500m, laser pointer, waterproof','https://darmasakti.com/jual/total-station-ruide-rts-822'),
      ('Ruide Total Station RTS-822A','2\", 700m, bluetooth, onboard software','https://darmasakti.com/jual/total-station-ruide-rts-822a'),
      ('Single Beam Echo Sounder','Portable, 200 kHz, 0.3-100m, LCD','https://darmasakti.com/jual/single-beam-echo-sounder'),
      ('Ruide Total Station RTS-822R3','2\", 500m, reflectorless, 3D','https://darmasakti.com/jual/ruide-total-station-rts-822r3'),
    ],
    'faqs': [
      ('Apa itu total station?','Total station adalah alat survey elektronik yang mengukur jarak, sudut, dan koordinat secara simultan. Digunakan untuk pemetaan, konstruksi, dan topografi.'),
      ('Berapa harga total station Topcon?','Harga tergantung tipe dan spesifikasi. Hubungi kami untuk penawaran terbaru.'),
      ('Apakah ada total station bekas?','Ya, tersedia total station bekas kondisi baik dengan harga lebih ekonomis dan garansi.'),
      ('Echo sounder untuk apa?','Echo sounder digunakan untuk mengukur kedalaman air (bathymetry) — cocok untuk survey sungai, danau, dan pelabuhan.'),
    ]
  },
  {
    'slug': 'alat-ukur',
    'title': 'Distributor Alat Ukur Industri — Sensor & Instrumen',
    'h1': 'Distributor Alat Ukur Industri',
    'desc': 'Jual alat ukur industri: pressure sensor, temperature transmitter, thermocouple, spectrum analyzer, 3D laser measuring tool. Distributor terpercaya, harga bersaing.',
    'intro': '<p><strong>Alat ukur industri</strong> adalah jantung dari sistem kontrol dan monitoring di pabrik dan fasilitas industri. Kami menyediakan berbagai instrumen pengukuran: <strong>pressure sensor transmitter</strong>, <strong>temperature transmitter</strong> Yokogawa, <strong>thermocouple</strong> 2-wire, <strong>spectrum analyzer</strong>, dan <strong>3D laser measuring tool</strong>.</p><p>Dari sensor dasar hingga instrumen analitik canggih, kami membantu Anda memilih alat ukur yang tepat untuk aplikasi proses industri, quality control, dan riset.</p>',
    'features': [
      'Pressure sensor & transmitter untuk berbagai rentang tekanan',
      'Temperature transmitter Yokogawa — akurasi tinggi, isolasi',
      'Thermocouple tipe K, J, T — 2 wire, berbagai range suhu',
      'Spectrum analyzer untuk pengukuran frekuensi & sinyal RF',
      '3D laser measuring tool untuk pengukuran dimensi presisi',
      'Garansi, kalibrasi, dan dukungan teknis'
    ],
    'products': [
      ('Pressure Sensor Transmitter 4-20 mA','Range 0-10 bar, output 4-20 mA, stainless steel','https://darmasakti.com/harga/alat-ukur'),
      ('Yokogawa Temperature Transmitter YTA710','Head-mounted, RTD/TC, HART, isolasi','https://darmasakti.com/product-brand/yokogawa'),
      ('Thermocouple Type K 2-Wire','Range -200°C s/d 1250°C, probe 150mm','https://darmasakti.com/harga/alat-ukur'),
      ('Spectrum Analyzer','9 kHz - 3.2 GHz, tracking generator','https://darmasakti.com/harga/alat-ukur'),
      ('3D Laser Measuring Tool','Range 30m, akurasi ±1mm, Bluetooth','https://darmasakti.com/harga/alat-ukur'),
    ],
    'faqs': [
      ('Apa itu pressure sensor transmitter?','Pressure sensor transmitter mengubah tekanan fluida/gas menjadi sinyal listrik 4-20 mA untuk monitoring dan kontrol proses.'),
      ('Berapa range thermocouple type K?','Thermocouple type K memiliki range -200°C hingga 1250°C, cocok untuk aplikasi industri suhu tinggi.'),
      ('Apa itu spectrum analyzer?','Spectrum analyzer mengukur amplitudo sinyal terhadap frekuensi — digunakan untuk analisis RF, EMI, dan troubleshooting sinyal.'),
      ('Bagaimana cara memilih transmitter yang tepat?','Pertimbangkan range tekanan, media, output (4-20 mA / HART), dan lingkungan pemasangan. Tim kami siap membantu.'),
    ]
  },
  {
    'slug': 'az-instrument',
    'title': 'Distributor AZ Instrument — Alat Ukur Lingkungan & Air',
    'h1': 'Distributor AZ Instrument Indonesia',
    'desc': 'Jual AZ Instrument — TDS meter, pH meter, manometer, CO2 meter, weather meter, salinity meter. Alat ukur lingkungan & kualitas air. Harga bersaing.',
    'intro': '<p><strong>AZ Instrument</strong> adalah merek alat ukur asal Taiwan yang dikenal dengan produk-produk portable untuk pengukuran lingkungan dan kualitas air. Produk AZ mencakup <strong>TDS meter</strong>, <strong>pH meter</strong>, <strong>manometer</strong>, <strong>CO2 meter</strong>, <strong>weather meter</strong>, <strong>salinity meter</strong>, dan <strong>anemometer</strong>.</p><p>AZ Instrument menjadi pilihan praktisi laboratorium, pengelola air bersih, petani hidroponik, dan teknisi HVAC karena kualitasnya yang konsisten dengan harga terjangkau.</p>',
    'features': [
      'TDS meter digital — ukur total dissolved solids dalam air',
      'pH meter portable — akurasi ±0.01 pH, ATC',
      'Manometer digital — ukur tekanan udara/gas, berbagai unit',
      'CO2 meter — monitor kualitas udara dalam ruangan',
      'Weather meter — anemometer + humidity + temperature',
      'Salinity meter — ukur salinitas air laut & tambak'
    ],
    'products': [
      ('AZ TDS Meter 8601','Range 0-9990 ppm, ATC, waterproof','https://darmasakti.com/product-brand/az-instrument'),
      ('AZ pH Meter 86505','Range 0-14 pH, akurasi ±0.01, ATC','https://darmasakti.com/product-brand/az-instrument'),
      ('AZ Manometer 82100','Dual port, 0-100 psi, 11 unit','https://darmasakti.com/product-brand/az-instrument'),
      ('AZ CO2 Meter 77235','NDIR, 0-9999 ppm, data logger','https://darmasakti.com/product-brand/az-instrument'),
      ('AZ Salinity Meter 8373','Range 0-10%, waterproof, ATC','https://darmasakti.com/product-brand/az-instrument'),
    ],
    'faqs': [
      ('Apa itu AZ Instrument?','AZ Instrument adalah merek alat ukur asal Taiwan yang memproduksi TDS meter, pH meter, manometer, CO2 meter, dan weather meter untuk aplikasi lingkungan dan industri.'),
      ('Berapa harga AZ Instrument?','Harga bervariasi tergantung jenis instrumen. Hubungi kami untuk penawaran terbaru.'),
      ('Apakah AZ Instrument cocok untuk hidroponik?','Ya, AZ TDS meter dan pH meter sangat cocok untuk monitoring nutrisi hidroponik.'),
      ('Bagaimana garansi AZ Instrument?','Setiap produk AZ Instrument mendapat garansi sesuai ketentuan.'),
    ]
  },
  {
    'slug': 'sanwa-multimeter',
    'title': 'Jual Sanwa Multimeter — Digital Multimeter CD800a & Lebih',
    'h1': 'Jual Sanwa Multimeter Digital',
    'desc': 'Jual Sanwa multimeter original — CD800a, analog, dan digital. Alat ukur listrik berkualitas Jepang. Harga bersaing, garansi resmi, kirim Indonesia.',
    'intro': '<p><strong>Sanwa</strong> adalah merek multimeter asal Jepang yang telah menjadi favorit para teknisi dan insinyur listrik di Indonesia. Sanwa dikenal dengan kualitas build yang kokoh, akurasi pengukuran yang konsisten, dan fitur keamanan yang mumpuni.</p><p>Produk unggulan Sanwa adalah <strong>CD800a Digital Multimeter</strong> — multimeter digital dengan True RMS, CAT III 600V, dan berbagai fitur pengukuran lengkap: AC/DC voltage, current, resistance, capacitance, frequency, dan temperature.</p>',
    'features': [
      'Sanwa multimeter original Jepang — kualitas build terbaik',
      'Sanwa CD800a: True RMS, CAT III 600V, akurasi tinggi',
      'Tersedia multimeter analog dan digital',
      'Fitur lengkap: voltage, current, resistance, capacitance, frequency, temp',
      'Garansi resmi dan dukungan teknis',
      'Pengiriman ke seluruh Indonesia'
    ],
    'products': [
      ('Sanwa CD800a Digital Multimeter','True RMS, CAT III 600V, 4000 count, backlight','https://darmasakti.com/jual/sanwa-cd800a-digital-multimeter'),
      ('Sanwa Analog Multimeter 360-YTR','Multi-range, mirror scale, 20 kΩ/V','https://darmasakti.com/product-brand/sanwa'),
      ('Sanwa PC5000a','True RMS, 50000 count, USB, PC link','https://darmasakti.com/product-brand/sanwa'),
      ('Sanwa DCM400','Clamp meter AC/DC, 400A, True RMS','https://darmasakti.com/product-brand/sanwa'),
      ('Sanwa Accessories Set','Test lead, probe, alligator clip, kantung','https://darmasakti.com/product-brand/sanwa'),
    ],
    'faqs': [
      ('Apa itu Sanwa CD800a?','Sanwa CD800a adalah digital multimeter True RMS dengan 4000 count, CAT III 600V, dan fitur lengkap untuk pengukuran listrik.'),
      ('Berapa harga Sanwa CD800a?','Harga Sanwa CD800a bervariasi. Hubungi kami untuk penawaran terbaru.'),
      ('Apakah Sanwa multimeter original?','Ya, kami menjual Sanwa multimeter original Jepang dengan garansi resmi.'),
      ('Apa perbedaan multimeter analog dan digital Sanwa?','Multimeter digital lebih presisi dengan display numerik, analog lebih responsif untuk melihat perubahan sinyal.'),
    ]
  },
]

def gen_lp(data):
    slug = data['slug']
    title = data['title']
    h1 = data['h1']
    desc = data['desc']
    intro = data['intro']
    features = data['features']
    products = data['products']
    faqs = data['faqs']
    canonical = f'https://proindustri.com/jual/{slug}'
    brand = h1.split('—')[0].strip() if '—' in h1 else h1

    feat_html = '\n      '.join(f'<li>{f}</li>' for f in features)
    prod_rows = '\n'.join(
        f'        <tr><td><a href="{url}" target="_blank" rel="noopener">{name}</a></td><td>{spec}</td></tr>'
        for name, spec, url in products
    )
    faq_html = '\n    '.join(
        f'<details class="faq-item"><summary>{q}</summary><p>{a}</p></details>'
        for q, a in faqs
    )
    faq_schema_items = [f'{{"@type":"Question","name":{json.dumps(q)},"acceptedAnswer":{{"@type":"Answer","text":{json.dumps(a)}}}}}' for q, a in faqs]
    faq_schema = f'{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{",".join(faq_schema_items)}]}}'

    return f'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ProIndustri">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="https://proindustri.com/assets/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="id_ID">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="https://proindustri.com/assets/og-image.jpg">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230F1B2D'/><text x='50' y='68' font-size='50' font-weight='900' fill='white' text-anchor='middle'>P</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
<script type="application/ld+json">{faq_schema}</script>
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"Product","name":"{h1}","description":"{desc}","url":"{canonical}","brand":{{"@type":"Brand","name":"{brand}"}},"offers":{{"@type":"AggregateOffer","offerCount":"{len(products)}","availability":"https://schema.org/InStock","url":"{canonical}"}}}}</script>
<style>
.lp-page{{max-width:1000px;margin:30px auto 60px;padding:0 20px}}
.lp-intro{{background:#fff;border:1px solid var(--border);border-radius:16px;padding:30px;margin-bottom:30px;line-height:1.8}}
.lp-intro h1{{font-size:24px;font-weight:800;margin-bottom:16px;color:var(--dark)}}
.lp-intro p{{font-size:14px;color:var(--muted);margin-bottom:12px}}
.lp-intro p:last-child{{margin-bottom:0}}
.lp-section{{background:#fff;border:1px solid var(--border);border-radius:16px;padding:30px;margin-bottom:30px}}
.lp-section h2{{font-size:18px;font-weight:700;margin-bottom:16px;color:var(--dark);padding-bottom:10px;border-bottom:2px solid var(--red)}}
.lp-section ul{{list-style:none;padding:0}}
.lp-section ul li{{padding:10px 0 10px 24px;position:relative;font-size:14px;color:var(--muted);border-bottom:1px solid #f0f0f0}}
.lp-section ul li:last-child{{border-bottom:none}}
.lp-section ul li::before{{content:"\\2713";position:absolute;left:0;color:var(--red);font-weight:700}}
.lp-table{{width:100%;border-collapse:collapse;font-size:13px}}
.lp-table th{{background:#f8f8f8;padding:12px;text-align:left;font-weight:700;color:var(--dark);border-bottom:2px solid var(--border)}}
.lp-table td{{padding:12px;border-bottom:1px solid #f0f0f0;color:var(--muted)}}
.lp-table td:first-child a{{color:var(--red);text-decoration:none;font-weight:600}}
.lp-table td:first-child a:hover{{text-decoration:underline}}
.lp-table tr:last-child td{{border-bottom:none}}
.lp-faq .faq-item{{padding:16px 0;border-bottom:1px solid #f0f0f0}}
.lp-faq .faq-item:last-child{{border-bottom:none}}
.lp-faq .faq-item summary{{font-size:14px;font-weight:700;color:var(--dark);margin-bottom:6px;cursor:pointer;list-style:none}}
.lp-faq .faq-item summary::-webkit-details-marker{{display:none}}
.lp-faq .faq-item summary::before{{content:"\\25B6";margin-right:8px;color:var(--red);font-size:11px;display:inline-block;transition:transform .2s}}
.lp-faq .faq-item[open] summary::before{{transform:rotate(90deg)}}
.lp-faq .faq-item p{{font-size:13px;color:var(--muted);line-height:1.7;margin:8px 0 0 20px}}
.lp-inquiry{{background:#fff;border:1px solid var(--border);border-radius:16px;padding:30px;margin-bottom:30px}}
.lp-inquiry h2{{font-size:18px;font-weight:700;margin-bottom:6px;color:var(--dark)}}
.lp-inquiry .sub{{font-size:13px;color:var(--muted);margin-bottom:20px}}
.lp-inquiry .form-group{{margin-bottom:14px}}
.lp-inquiry .form-group label{{display:block;font-size:13px;font-weight:600;color:var(--dark);margin-bottom:5px}}
.lp-inquiry .form-group input,.lp-inquiry .form-group textarea{{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:14px;font-family:inherit;box-sizing:border-box;background:#fff;color:var(--dark)}}
.lp-inquiry .form-group input:focus,.lp-inquiry .form-group textarea:focus{{outline:none;border-color:var(--red);box-shadow:0 0 0 3px rgba(220,38,38,.08)}}
.lp-inquiry .form-group textarea{{resize:vertical;min-height:80px}}
.lp-inquiry .btn{{background:var(--red);color:#fff;border:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:opacity .2s}}
.lp-inquiry .btn:hover{{opacity:.9}}
.lp-inquiry .btn-wa{{background:#25D366;color:#fff}}
.lp-inquiry .btn-wa:hover{{opacity:.9}}
@media(max-width:768px){{.lp-page{{margin:15px auto 40px;padding:0 12px}}.lp-intro,.lp-section,.lp-inquiry{{padding:20px}}.lp-intro h1{{font-size:20px}}.lp-table{{font-size:12px}}.lp-table th,.lp-table td{{padding:8px}}}}
</style>
</head>
<body>
<div id="site-nav"></div>

<div class="lp-page">
  <div class="lp-intro">
    <h1>{h1}</h1>
    {intro}
  </div>

  <div class="lp-section">
    <h2>Keunggulan {brand}</h2>
    <ul>
      {feat_html}
    </ul>
  </div>

  <div class="lp-section">
    <h2>Produk Tersedia</h2>
    <p style="font-size:13px;color:var(--muted);margin-bottom:16px">Klik nama produk untuk melihat detail spesifikasi di halaman mitra kami.</p>
    <table class="lp-table">
      <thead><tr><th>Produk</th><th>Spesifikasi</th></tr></thead>
      <tbody>
{prod_rows}
      </tbody>
    </table>
  </div>

  <div class="lp-section lp-faq">
    <h2>Pertanyaan Umum (FAQ)</h2>
    {faq_html}
  </div>

  <div class="lp-inquiry">
    <h2>Ajukan Inquiry</h2>
    <div class="sub">Isi form di bawah, kami akan merespon via WhatsApp dalam 1x24 jam.</div>
    <div id="formFields">
      <div class="form-group"><label>Nama *</label><input type="text" id="inqName" placeholder="Nama Anda" required></div>
      <div class="form-group"><label>Kontak (HP/Email) *</label><input type="text" id="inqContact" placeholder="No. WhatsApp atau Email" required></div>
      <div class="form-group"><label>Produk yang diminati</label><input type="text" id="inqProduct" value="{h1}"></div>
      <div class="form-group"><label>Pesan tambahan</label><textarea id="inqMessage" placeholder="Spesifikasi, jumlah, atau pertanyaan Anda..."></textarea></div>
      <button class="btn btn-wa" onclick="sendInquiry()">Kirim ke WhatsApp</button>
    </div>
    <div id="inqSuccess" style="display:none;color:var(--red);font-weight:700;padding:20px 0;text-align:center">Terima kasih! Kami akan merespon pesan Anda segera.</div>
  </div>
</div>

<footer class="footer" id="site-footer"></footer>

{IC_SNIPPET}
<script>
function sendInquiry(){{
  var n=document.getElementById('inqName').value.trim();
  var c=document.getElementById('inqContact').value.trim();
  var p=document.getElementById('inqProduct').value.trim();
  var m=document.getElementById('inqMessage').value.trim();
  if(!n||!c){{alert('Mohon isi nama dan kontak');return;}}
  var msg='Halo ProIndustri \\ud83d\\udc4b\\n\\nSaya tertarik dengan:\\n*'+p+'*\\n\\nNama: '+n+'\\nKontak: '+c+(m?'\\nPesan: '+m:'')+'\\n\\nMohon informasinya.';
  window.open('https://wa.me/6281394191904?text='+encodeURIComponent(msg),'_blank');
  document.getElementById('formFields').style.display='none';
  document.getElementById('inqSuccess').style.display='block';
}}
</script>
{SPRITE}
<script src="/assets/site.js"></script>
</body>
</html>'''

os.makedirs('public/jual', exist_ok=True)
for lp in LPS:
    html = gen_lp(lp)
    path = f'public/jual/{lp["slug"]}.html'
    open(path, 'w', encoding='utf-8').write(html)
    sz = len(html.encode('utf-8')) / 1024
    print(f'  {lp["slug"]}.html — {sz:.0f} KB')
print('Done!')