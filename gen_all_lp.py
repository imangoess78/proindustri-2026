#!/usr/bin/env python3
"""Generate 68 landing pages — 1 per keyword — with sales letter template, no Darmasakti links, CTA WA ProIndustri."""
import openpyxl, re, os, json

# ============================================================
# DATA HUBS — konten brand/kategori yang di-reuse per LP
# ============================================================
HUBS = {
  'honeywell': {
    'brand': 'Honeywell XNX',
    'image': '/lp-images/honeywell.jpg',
    'alt': 'Honeywell XNX Universal Gas Transmitter',
    'intro': '<p><strong>Honeywell XNX</strong> adalah universal gas transmitter generasi terbaru yang kompatibel dengan berbagai sensor gas — oksigen, H₂S, CO, hingga gas mudah meledak. Perangkat ini banyak digunakan di industri minyak & gas, pertambangan, petrokimia, dan pengolahan air limbah.</p><p>Dengan desain modular yang mendukung hingga 15 jenis sensor, XNX memberikan fleksibilitas maksimal dalam satu platform. Dilengkapi tampilan digital, output analog 4-20 mA, relay alarm, dan komunikasi HART.</p>',
    'features': [
      'Kompatibel dengan 15+ jenis sensor gas (katalitik, elektrokimia, IR)',
      'Output 4-20 mA, HART, relay alarm 3 level',
      'Tampilan LCD backlit dengan status LED',
      'Sertifikasi ATEX, IECEx, SIL 2 untuk area berbahaya',
      'Housing stainless steel & aluminium — tahan korosi dan ledakan',
    ],
    'products': [
      ('XNX Universal Gas Transmitter', 'Sensor universal, 4-20 mA + HART, ATEX, SIL 2'),
      ('XNX + Sensor O2', 'Oksigen 0-25% vol, elektrokimia'),
      ('XNX + Sensor H2S', 'Hidrogen sulfida 0-100 ppm'),
      ('XNX + Sensor CO', 'Karbon monoksida 0-1000 ppm'),
      ('XNX + Sensor LEL', 'Gas mudah meledak 0-100% LEL'),
    ],
    'faqs': [
      ('Apa itu Honeywell XNX gas detector?','Honeywell XNX adalah universal gas transmitter yang menerima berbagai jenis sensor gas. Berfungsi sebagai monitor gas tetap (fixed gas detector) untuk deteksi kebocoran gas berbahaya di area industri.'),
      ('Sensor gas apa saja yang kompatibel dengan XNX?','XNX mendukung sensor katalitik, elektrokimia (O2, H2S, CO, SO2, Cl2, NH3, dll), dan infra merah (IR) untuk CO2 dan hidrokarbon.'),
      ('Apakah XNX memiliki sertifikasi untuk area berbahaya?','Ya, XNX memiliki sertifikasi ATEX, IECEx, dan SIL 2 sehingga aman digunakan di area berbahaya (zona 1, 2, 21, 22).'),
      ('Berapa harga Honeywell XNX?','Harga tergantung konfigurasi sensor dan aksesori. Hubungi kami via WhatsApp untuk penawaran harga terbaru sesuai kebutuhan Anda.'),
      ('Bagaimana cara memesan Honeywell XNX?','Isi form inquiry di bawah atau hubungi kami via WhatsApp. Tim kami akan membantu memilih konfigurasi yang tepat.'),
    ]
  },
  'mitutoyo': {
    'brand': 'Mitutoyo',
    'image': '/lp-images/mitutoyo.jpg',
    'alt': 'Mitutoyo Digital Caliper Presisi Jepang',
    'intro': '<p><strong>Mitutoyo</strong> adalah merek alat ukur presisi asal Jepang yang telah menjadi standar global di industri manufaktur, otomotif, dan engineering. Dari jangka sorong digital hingga mesin ukur koordinat (CMM), Mitutoyo dikenal dengan akurasi tinggi, durabilitas, dan inovasi teknologi pengukuran.</p><p>Kami menyediakan berbagai produk Mitutoyo untuk kebutuhan kalibrasi, quality control, dan produksi Anda. Tersedia jangka sorong digital, mikrometer, dial gauge, height gauge, dan aksesori pengukuran lainnya.</p>',
    'features': [
      'Produk asli Mitutoyo Jepang dengan garansi resmi',
      'Tersedia caliper, micrometer, dial gauge, height gauge, CMM',
      'Akurasi tinggi dengan resolusi hingga 0.001 mm',
      'Tipe digital dan analog — cocok untuk berbagai aplikasi',
      'Dukungan kalibrasi dan sertifikat traceable',
    ],
    'products': [
      ('Mitutoyo Digital Caliper 150mm/6"', 'Seri 500-196-30, LCD, IP67, akurasi ±0.02mm'),
      ('Mitutoyo Micrometer Outside 0-25mm', 'Seri 293-340-30, ratchet stop, 0.001mm'),
      ('Mitutoyo Dial Indicator 0.01mm', 'Range 10mm, seri 2046S'),
      ('Mitutoyo Height Gauge 300mm', 'Seri 570-227, digital, ABS scale'),
      ('Mitutoyo CMM', 'CRYSTA-Apex S Series, berbagai ukuran'),
    ],
    'faqs': [
      ('Apa itu Mitutoyo?','Mitutoyo adalah perusahaan alat ukur presisi asal Jepang, produsen jangka sorong, mikrometer, dial gauge, dan mesin ukur CMM yang digunakan di industri manufaktur global.'),
      ('Apakah produk Mitutoyo yang dijual original?','Ya, seluruh produk Mitutoyo yang kami jual adalah produk original dengan garansi resmi distributor.'),
      ('Berapa harga Mitutoyo Digital Caliper?','Harga bervariasi tergantung seri. Hubungi kami via WhatsApp untuk harga terbaru.'),
      ('Apakah Mitutoyo menyediakan sertifikat kalibrasi?','Ya, tersedia sertifikat kalibrasi traceable untuk setiap alat ukur.'),
    ]
  },
  'alat-laboratorium': {
    'brand': 'Alat Laboratorium',
    'image': '/lp-images/alat-laboratorium.jpg',
    'alt': 'Peralatan Laboratorium Profesional',
    'intro': '<p>Kami menyediakan berbagai <strong>alat laboratorium</strong> untuk kebutuhan pendidikan, riset, industri, dan kesehatan. Dari peralatan gelas dasar hingga instrumen analitik canggih, semua tersedia dengan kualitas terjamin.</p><p>Laboratorium membutuhkan peralatan yang akurat dan andal. Kami bekerja sama dengan merek-merek terpercaya untuk memastikan setiap alat yang Anda gunakan memberikan hasil pengukuran dan analisis yang presisi.</p>',
    'features': [
      'Tersedia alat laboratorium dari berbagai merek internasional',
      'Peralatan gelas, timbangan, oven, inkubator, spektrofotometer',
      'Alat ukur pH, konduktivitas, DO, TDS — untuk uji kualitas air & tanah',
      'Mikroskop, autoklaf, sentrifus untuk laboratorium mikrobiologi',
      'Harga bersaing dengan garansi resmi',
    ],
    'products': [
      ('Timbangan Analitik Digital', 'Akurasi 0.0001g, kapasitas max 220g, kalibrasi internal'),
      ('pH Meter Digital', 'Range 0-14 pH, akurasi ±0.01, ATC'),
      ('Oven Laboratorium', 'Range 50-300°C, volume 50L, digital PID'),
      ('Mikroskop Binokuler', 'Perbesaran 40x-1500x, LED illumination'),
      ('Autoklaf Sterilisator', 'Kapasitas 18L, 126°C, digital'),
    ],
    'faqs': [
      ('Apa saja alat laboratorium yang tersedia?','Kami menyediakan alat laboratorium umum (gelas, timbangan, oven), alat ukur (pH meter, DO meter, spektrofotometer), dan alat mikrobiologi (mikroskop, autoklaf, laminar flow).'),
      ('Apakah ada garansi untuk alat lab?','Ya, setiap alat laboratorium mendapat garansi sesuai ketentuan merek masing-masing.'),
      ('Bagaimana cara memesan?','Isi form inquiry di bawah atau hubungi kami via WhatsApp. Tim kami akan membantu memilih alat yang sesuai.'),
    ]
  },
  'bosch': {
    'brand': 'Bosch',
    'image': '/lp-images/bosch.jpg',
    'alt': 'Bosch Power Tools dan Laser Distance Meter',
    'intro': '<p><strong>Bosch</strong> adalah merek global terkemuka untuk power tools dan perlengkapan industri. Dari bor listrik, gerinda tangan, hingga laser distance meter GLM400, Bosch dikenal dengan kualitas Jerman, durabilitas tinggi, dan inovasi teknologi.</p><p>Kami adalah distributor Bosch yang melayani pengiriman ke seluruh Indonesia. Tersedia power tools cordless, corded, dan aksesori original Bosch.</p>',
    'features': [
      'Produk Bosch original dengan garansi resmi',
      'Tersedia power tools cordless & corded',
      'Bosch Laser Distance Meter GLM400 — akurasi ±1.5mm',
      'Melayani pengiriman ke seluruh Indonesia',
      'Tersedia service center untuk perbaikan',
    ],
    'products': [
      ('Bosch Bor Impact GSB 18V-50', 'Cordless, 2 baterai 18V, 50 Nm, LED'),
      ('Bosch Gerinda GWS 7-115', '7A, 720W, 11000 rpm, 4"'),
      ('Bosch Laser GLM400', '40m, akurasi ±1.5mm, Bluetooth'),
      ('Bosch Bor Hammer GBH 2-26 DRE', 'SDS+, 800W, 2.7 J, variabel speed'),
      ('Bosch Aksesori Set Mata Bor', 'Set 13 pcs, HSS, titanium coated'),
    ],
    'faqs': [
      ('Di mana lokasi distributor Bosch terdekat?','Kami melayani pengiriman seluruh Indonesia. Untuk pembelian langsung, hubungi kami via WhatsApp untuk informasi stok.'),
      ('Berapa harga Bosch GLM400 laser distance meter?','Harga tergantung varian dan promo. Silakan hubungi kami untuk harga terbaru.'),
      ('Apakah ada service center Bosch?','Kami menyediakan layanan purna jual dan informasi service center resmi Bosch.'),
    ]
  },
  'kyoritsu': {
    'brand': 'Kyoritsu',
    'image': '/lp-images/kyoritsu.jpg',
    'alt': 'Kyoritsu Clamp Meter dan Alat Ukur Listrik',
    'intro': '<p><strong>Kyoritsu</strong> adalah merek alat ukur listrik asal Jepang yang telah dipercaya oleh para teknisi dan insinyur listrik di seluruh dunia. Produk Kyoritsu mencakup clamp meter, multimeter digital, insulation tester, earth resistance tester, dan phase rotation tester.</p><p>Dikenal dengan akurasi tinggi, keamanan (CAT III/CAT IV), dan durabilitas, Kyoritsu menjadi pilihan utama untuk pengukuran listrik di industri, bangunan, dan instalasi tenaga.</p>',
    'features': [
      'Alat ukur listrik Kyoritsu original Jepang',
      'Tersedia clamp meter AC/DC, insulation tester, earth tester',
      'Sertifikasi keamanan CAT III 600V / CAT IV 300V',
      'Akurasi tinggi untuk pengukuran presisi',
      'Garansi resmi dan dukungan teknis',
    ],
    'products': [
      ('Kyoritsu Clamp Meter 2002R', 'AC 2000A, true RMS, CAT III 600V'),
      ('Kyoritsu Insulation Tester 3125', '5000V, digital, PI/DAR, CAT IV 600V'),
      ('Kyoritsu Earth Tester 4105A', 'Digital, 2/3 pole, 200Ω range'),
      ('Kyoritsu Multimeter 1009', 'Digital, True RMS, AC/DC 1000V'),
      ('Kyoritsu Phase Rotation Tester 8031', 'Non-contact, LED indicator, 40-600V'),
    ],
    'faqs': [
      ('Apa itu Kyoritsu?','Kyoritsu adalah merek alat ukur listrik asal Jepang yang memproduksi clamp meter, insulation tester, dan earth tester.'),
      ('Apakah produk Kyoritsu original?','Ya, seluruh produk Kyoritsu yang kami jual adalah original dengan garansi resmi.'),
      ('Bagaimana cara memilih Kyoritsu yang tepat?','Untuk clamp meter pengukuran arus, insulation tester untuk tahanan isolasi, earth tester untuk pentanahan. Tim kami siap membantu.'),
    ]
  },
  'skf': {
    'brand': 'SKF Bearing',
    'image': '/lp-images/skf.jpg',
    'alt': 'SKF Bearing Deep Groove Ball Bearing',
    'intro': '<p><strong>SKF</strong> adalah merek bearing dan seal asal Swedia yang menjadi pemimpin global dalam teknologi bantalan (bearing). Dari ball bearing, roller bearing, spherical bearing, hingga bearing housing dan seal, SKF digunakan di berbagai industri: otomotif, manufaktur, pertambangan, dan pembangkit listrik.</p><p>Kami menyediakan berbagai tipe bearing SKF original untuk kebutuhan industri Anda. Tersedia ball bearing, roller bearing, spherical bearing, dan aksesori pendukung.</p>',
    'features': [
      'Bearing SKF original — berbagai tipe: ball, roller, spherical',
      'Bearing seal, housing, dan aksesori pendukung',
      'Pelumas SKF untuk perawatan bearing',
      'Melayani kebutuhan spare part industri',
      'Harga bersaing untuk partai kecil hingga besar',
    ],
    'products': [
      ('SKF Ball Bearing 6205-2RS', 'Deep groove, 25x52x15mm, karet 2 sisi'),
      ('SKF Roller Bearing NU 205', 'Cylindrical, 25x52x15mm, brass cage'),
      ('SKF Spherical Bearing 22220 CC', '100x180x46mm, spherical roller'),
      ('SKF Bearing Housing SNL 515', 'Split housing, cast iron, untuk 515 series'),
      ('SKF Grease LGHP 2', 'High-temp, 18 kg pail, untuk industri'),
    ],
    'faqs': [
      ('Apa itu SKF bearing?','SKF adalah produsen bearing asal Swedia yang memproduksi ball bearing, roller bearing, spherical bearing, dan aksesori untuk industri.'),
      ('Berapa harga bearing SKF 6205?','Harga SKF 6205-2RS tergantung varian (C3, 2RS, karet). Hubungi kami via WhatsApp untuk harga terkini.'),
      ('Bagaimana cara membedakan bearing SKF asli dan palsu?','Bearing asli memiliki kode laser presisi, kemasan resmi, dan hologram. Kami hanya menjual produk original.'),
    ]
  },
  'total-station': {
    'brand': 'Total Station & Alat Survey',
    'image': '/lp-images/total-station.jpg',
    'alt': 'Total Station Topcon dan Ruide untuk Survey Pemetaan',
    'intro': '<p><strong>Total station</strong> adalah alat utama dalam pekerjaan survey pemetaan dan konstruksi. Kami menyediakan berbagai merek total station: <strong>Topcon</strong>, <strong>Ruide</strong>, dan aksesori survey seperti echo sounder, GPS survey, dan prisma reflektor.</p><p>Baik untuk proyek pemetaan lahan, pengukuran topografi, konstruksi jalan, atau bathymetry (echo sounder), kami memiliki alat survey yang tepat untuk kebutuhan Anda.</p>',
    'features': [
      'Total station Topcon & Ruide — berbagai tipe dan spesifikasi',
      'Single beam echo sounder untuk bathymetry',
      'Tersedia GPS survey, prisma, tripod, dan aksesori',
      'Kalibrasi dan servis alat survey',
      'Jual beli alat survey bekas — kondisi baik, harga bersaing',
    ],
    'products': [
      ('Topcon Total Station ES-105', '1" (0.3mgon), 500m reflektor, 350m non-prisma'),
      ('Ruide Total Station RTS-822', '2", 500m, laser pointer, waterproof'),
      ('Ruide Total Station RTS-822A', '2", 700m, bluetooth, onboard software'),
      ('Single Beam Echo Sounder', 'Portable, 200 kHz, 0.3-100m, LCD'),
      ('Ruide Total Station RTS-822R3', '2", 500m, reflectorless, 3D'),
    ],
    'faqs': [
      ('Apa itu total station?','Total station adalah alat survey elektronik yang mengukur jarak, sudut, dan koordinat secara simultan. Digunakan untuk pemetaan, konstruksi, dan topografi.'),
      ('Berapa harga total station Topcon?','Harga tergantung tipe dan spesifikasi. Hubungi kami via WhatsApp untuk penawaran terbaru.'),
      ('Apakah ada total station bekas?','Ya, tersedia total station bekas kondisi baik dengan harga lebih ekonomis dan garansi.'),
    ]
  },
  'alat-ukur': {
    'brand': 'Alat Ukur Industri',
    'image': '/lp-images/alat-ukur.jpg',
    'alt': 'Alat Ukur Industri — Sensor & Instrumen',
    'intro': '<p><strong>Alat ukur industri</strong> adalah jantung dari sistem kontrol dan monitoring di pabrik dan fasilitas industri. Kami menyediakan berbagai instrumen pengukuran: pressure sensor transmitter, temperature transmitter, thermocouple, spectrum analyzer, dan 3D laser measuring tool.</p><p>Dari sensor dasar hingga instrumen analitik canggih, kami membantu Anda memilih alat ukur yang tepat untuk aplikasi proses industri, quality control, dan riset.</p>',
    'features': [
      'Pressure sensor & transmitter untuk berbagai rentang tekanan',
      'Temperature transmitter — akurasi tinggi, isolasi',
      'Thermocouple tipe K, J, T — 2 wire, berbagai range suhu',
      'Spectrum analyzer untuk pengukuran frekuensi & sinyal RF',
      '3D laser measuring tool untuk pengukuran dimensi presisi',
    ],
    'products': [
      ('Pressure Sensor Transmitter 4-20 mA', 'Range 0-10 bar, output 4-20 mA, stainless steel'),
      ('Yokogawa Temperature Transmitter', 'Head-mounted, RTD/TC, HART, isolasi'),
      ('Thermocouple Type K 2-Wire', 'Range -200°C s/d 1250°C, probe 150mm'),
      ('Spectrum Analyzer', '9 kHz - 3.2 GHz, tracking generator'),
      ('3D Laser Measuring Tool', 'Range 30m, akurasi ±1mm, Bluetooth'),
    ],
    'faqs': [
      ('Apa itu pressure sensor transmitter?','Pressure sensor transmitter mengubah tekanan fluida/gas menjadi sinyal listrik 4-20 mA untuk monitoring dan kontrol proses.'),
      ('Apa itu spectrum analyzer?','Spectrum analyzer mengukur amplitudo sinyal terhadap frekuensi — digunakan untuk analisis RF, EMI, dan troubleshooting sinyal.'),
      ('Bagaimana cara memilih transmitter yang tepat?','Pertimbangkan range tekanan, media, output (4-20 mA / HART), dan lingkungan pemasangan. Tim kami siap membantu.'),
    ]
  },
  'az-instrument': {
    'brand': 'AZ Instrument',
    'image': '/lp-images/az-instrument.jpg',
    'alt': 'AZ Instrument TDS Meter dan Alat Ukur Lingkungan',
    'intro': '<p><strong>AZ Instrument</strong> adalah merek alat ukur asal Taiwan yang dikenal dengan produk-produk portable untuk pengukuran lingkungan dan kualitas air. Produk AZ mencakup TDS meter, pH meter, manometer, CO2 meter, weather meter, dan salinity meter.</p><p>AZ Instrument menjadi pilihan praktisi laboratorium, pengelola air bersih, petani hidroponik, dan teknisi HVAC karena kualitasnya yang konsisten dengan harga terjangkau.</p>',
    'features': [
      'TDS meter digital — ukur total dissolved solids dalam air',
      'pH meter portable — akurasi ±0.01 pH, ATC',
      'Manometer digital — ukur tekanan udara/gas, berbagai unit',
      'CO2 meter — monitor kualitas udara dalam ruangan',
      'Weather meter — anemometer + humidity + temperature',
    ],
    'products': [
      ('AZ TDS Meter 8601', 'Range 0-9990 ppm, ATC, waterproof'),
      ('AZ pH Meter 86505', 'Range 0-14 pH, akurasi ±0.01, ATC'),
      ('AZ Manometer 82100', 'Dual port, 0-100 psi, 11 unit'),
      ('AZ CO2 Meter 77235', 'NDIR, 0-9999 ppm, data logger'),
      ('AZ Salinity Meter 8373', 'Range 0-10%, waterproof, ATC'),
    ],
    'faqs': [
      ('Apa itu AZ Instrument?','AZ Instrument adalah merek alat ukur asal Taiwan yang memproduksi TDS meter, pH meter, manometer, CO2 meter, dan weather meter.'),
      ('Apakah AZ Instrument cocok untuk hidroponik?','Ya, AZ TDS meter dan pH meter sangat cocok untuk monitoring nutrisi hidroponik.'),
      ('Bagaimana garansi AZ Instrument?','Setiap produk AZ Instrument mendapat garansi sesuai ketentuan.'),
    ]
  },
  'sanwa': {
    'brand': 'Sanwa Multimeter',
    'image': '/lp-images/sanwa.jpg',
    'alt': 'Sanwa Digital Multimeter CD800a',
    'intro': '<p><strong>Sanwa</strong> adalah merek multimeter asal Jepang yang telah menjadi favorit para teknisi dan insinyur listrik di Indonesia. Sanwa dikenal dengan kualitas build yang kokoh, akurasi pengukuran yang konsisten, dan fitur keamanan yang mumpuni.</p><p>Produk unggulan Sanwa adalah <strong>CD800a Digital Multimeter</strong> — multimeter digital dengan True RMS, CAT III 600V, dan berbagai fitur pengukuran lengkap.</p>',
    'features': [
      'Sanwa multimeter original Jepang — kualitas build terbaik',
      'Sanwa CD800a: True RMS, CAT III 600V, akurasi tinggi',
      'Tersedia multimeter analog dan digital',
      'Fitur lengkap: voltage, current, resistance, capacitance, frequency, temp',
      'Garansi resmi dan dukungan teknis',
    ],
    'products': [
      ('Sanwa CD800a Digital Multimeter', 'True RMS, CAT III 600V, 4000 count, backlight'),
      ('Sanwa Analog Multimeter 360-YTR', 'Multi-range, mirror scale, 20 kΩ/V'),
      ('Sanwa PC5000a', 'True RMS, 50000 count, USB, PC link'),
      ('Sanwa DCM400', 'Clamp meter AC/DC, 400A, True RMS'),
      ('Sanwa Accessories Set', 'Test lead, probe, alligator clip, kantung'),
    ],
    'faqs': [
      ('Apa itu Sanwa CD800a?','Sanwa CD800a adalah digital multimeter True RMS dengan 4000 count, CAT III 600V, dan fitur lengkap untuk pengukuran listrik.'),
      ('Apakah Sanwa multimeter original?','Ya, kami menjual Sanwa multimeter original Jepang dengan garansi resmi.'),
      ('Apa perbedaan multimeter analog dan digital Sanwa?','Multimeter digital lebih presisi dengan display numerik, analog lebih responsif untuk melihat perubahan sinyal.'),
    ]
  },
  'joinwit': {
    'brand': 'Joinwit',
    'image': '/lp-images/joinwit.jpg',
    'alt': 'Joinwit OTDR dan Fiber Optic Tester',
    'intro': '<p><strong>Joinwit</strong> adalah merek alat ukur fiber optik asal China yang dikenal dengan produk OTDR (Optical Time Domain Reflectometer) dan alat pengukur daya optik. Joinwit banyak digunakan oleh teknisi telekomunikasi dan ISP untuk instalasi dan perawatan jaringan fiber optik.</p><p>Kami menyediakan berbagai produk Joinwit untuk kebutuhan pengukuran, troubleshooting, dan sertifikasi jaringan fiber optik Anda.</p>',
    'features': [
      'OTDR (Optical Time Domain Reflectometer) untuk analisis fiber',
      'Power meter dan light source untuk pengukuran redaman',
      'Visual fault locator (VFL) untuk deteksi kerusakan',
      'Portable dan mudah digunakan di lapangan',
      'Tersedia berbagai model untuk berbagai kebutuhan',
    ],
    'products': [
      ('Joinwit OTDR JW3302B', '1310/1550nm, 24/26dB, 0.8-1m dead zone'),
      ('Joinwit OTDR JW3306N', '3-in-1 (OTDR+OLS+OPM), touchscreen'),
      ('Joinwit Visual Fault Locator VFL-20', '20mW, 10km range, 650nm'),
      ('Joinwit Optical Power Meter JW3302', 'Range -70 to +10dBm, 6 kalibrasi'),
      ('Joinwit Light Source JW3101', 'FC/SC/ST connector, 1310/1550nm'),
    ],
    'faqs': [
      ('Apa itu Joinwit?','Joinwit adalah produsen alat ukur fiber optik, terutama OTDR, power meter, dan visual fault locator.'),
      ('Apa fungsi OTDR?','OTDR mengukur panjang, redaman, dan mendeteksi titik kerusakan pada kabel fiber optik.'),
      ('Apakah ada garansi untuk produk Joinwit?','Ya, setiap produk Joinwit mendapat garansi resmi sesuai ketentuan.'),
    ]
  },
  'sndway': {
    'brand': 'SNDWAY',
    'image': '/lp-images/sndway.jpg',
    'alt': 'SNDWAY Laser Distance Meter',
    'intro': '<p><strong>SNDWAY</strong> adalah merek alat ukur yang dikenal dengan produk laser distance meter, thermometer infrared, dan alat ukur elektronik portable. Dengan harga yang terjangkau dan kualitas yang baik, SNDWAY menjadi pilihan praktis untuk berbagai kebutuhan pengukuran.</p><p>Kami menyediakan berbagai produk SNDWAY untuk kebutuhan pengukuran jarak, suhu, dan parameter lainnya.</p>',
    'features': [
      'Laser distance meter dengan akurasi tinggi',
      'Thermometer infrared non-contact',
      'Portable, ringan, dan mudah digunakan',
      'Harga terjangkau dengan kualitas baik',
      'Garansi resmi dan dukungan teknis',
    ],
    'products': [
      ('SNDWAY Laser Distance Meter SW-T40', '40m, akurasi ±2mm, IP54, multi-mode'),
      ('SNDWAY Laser Distance Meter SW-T60', '60m, Bluetooth, Pythagoras, bubble level'),
      ('SNDWAY Infrared Thermometer SW-700', 'IR non-contact, -50°C to 380°C, pistol grip'),
      ('SNDWAY Infrared Thermometer SW-800', 'IR non-contact, -50°C to 550°C, laser pointer'),
      ('SNDWAY Distance Meter SW-100', '100m, LCD backlit, waterproof IP54'),
    ],
    'faqs': [
      ('Apa itu SNDWAY?','SNDWAY adalah merek alat ukur yang memproduksi laser distance meter, thermometer infrared, dan alat ukur elektronik lainnya.'),
      ('Berapa akurasi SNDWAY laser distance meter?','Akurasi ±2mm untuk jarak hingga 40-60m, tergantung model.'),
      ('Apakah produk SNDWAY bergaransi?','Ya, produk SNDWAY yang kami jual mendapat garansi.'),
    ]
  },
  'icom': {
    'brand': 'Icom',
    'image': '/lp-images/icom.jpg',
    'alt': 'Icom Radio HT Transceiver',
    'intro': '<p><strong>Icom</strong> adalah merek radio komunikasi asal Jepang yang terkenal di seluruh dunia. Produk Icom mencakup HT (handy talky), radio mobile, radio marine, dan radio amatir (amateur radio). Icom dikenal dengan kualitas suara jernih, daya tahan tinggi, dan fitur canggih.</p><p>Kami menyediakan berbagai produk Icom untuk kebutuhan komunikasi Anda — dari HT untuk security hingga radio marine untuk kapal.</p>',
    'features': [
      'Radio Icom original Jepang — kualitas komunikasi terbaik',
      'Tersedia HT VHF/UHF, radio mobile, marine, dan amateur',
      'Daya pancar jernih dan jangkauan luas',
      'Baterai tahan lama dan konstruksi kokoh',
      'Garansi resmi dan dukungan teknis',
    ],
    'products': [
      ('Icom IC-V86 HT VHF', '136-174 MHz, 5W, 16 channel, 1500mAh battery'),
      ('Icom IC-7400 HF/VHF/UHF Transceiver', '100W HF, 100W VHF, DSP, full-mode'),
      ('Icom IC-M25 Marine Radio', 'Handheld marine, waterproof IPX7, 6W'),
      ('Icom IC-2300H VHF Mobile', '65W, 200 channel, mil-spec rugged'),
      ('Icom IC-718 HF Transceiver', '100W, 160-10m, 101 channel, all-mode'),
    ],
    'faqs': [
      ('Apa itu Icom?','Icom adalah produsen radio komunikasi asal Jepang yang memproduksi HT, radio mobile, marine, dan amateur radio.'),
      ('Apakah produk Icom original?','Ya, kami menjual Icom original Jepang dengan garansi resmi.'),
      ('Berapa harga Icom IC-7400?','Harga Icom IC-7400 tergantung varian dan kelengkapan. Hubungi kami via WhatsApp untuk harga terbaru.'),
    ]
  },
  'hanna': {
    'brand': 'Hanna Instruments',
    'image': '/lp-images/hanna.jpg',
    'alt': 'Hanna Instruments pH Meter dan Water Quality Tester',
    'intro': '<p><strong>Hanna Instruments</strong> adalah produsen alat ukur asal Italia yang spesialis dalam instrumen pengukuran kualitas air dan laboratorium. Produk Hanna mencakup pH meter, EC meter, DO meter, turbidity meter, dan berbagai reagent untuk pengujian air.</p><p>Hanna dikenal dengan inovasi, akurasi, dan kemudahan penggunaan. Cocok untuk laboratorium, industri pengolahan air, akuakultur, dan pendidikan.</p>',
    'features': [
      'pH meter portable — akurasi ±0.01 pH, ATC, kalibrasi otomatis',
      'EC/TDS meter untuk pengukuran konduktivitas & padatan terlarut',
      'DO meter untuk pengukuran oksigen terlarut dalam air',
      'Reagent kit untuk berbagai parameter air (Cl, Fe, NH3, dll)',
      'Garansi resmi dan dukungan teknis',
    ],
    'products': [
      ('Hanna pH Meter HI-98107', 'pHep, pH range 0-14, ±0.1, ATC, waterproof'),
      ('Hanna EC/TDS Meter HI-98303', 'Dist 3, EC range 0-3999 µS/cm, waterproof'),
      ('Hanna DO Meter HI-9146', 'DO range 0-50 mg/L, salinitas & altitude comp'),
      ('Hanna Turbidity Meter HI-93703', 'Range 0-1000 NTU, IR method, portable'),
      ('Hanna Reagent Kit HI-38067', 'Chlorine test kit, 0-2.5 mg/L, 100 tests'),
    ],
    'faqs': [
      ('Apa itu Hanna Instruments?','Hanna adalah produsen alat ukur asal Italia yang fokus pada instrumen kualitas air dan laboratorium.'),
      ('Apakah pH meter Hanna akurat?','Ya, pH meter Hanna memiliki akurasi ±0.01 pH dan kalibrasi ATC otomatis.'),
      ('Bagaimana garansi Hanna Instruments?','Produk Hanna mendapat garansi sesuai ketentuan masing-masing produk.'),
    ]
  },
  'fluke': {
    'brand': 'Fluke',
    'image': '/lp-images/fluke.jpg',
    'alt': 'Fluke Multimeter dan Ground Tester',
    'intro': '<p><strong>Fluke</strong> adalah merek alat ukur listrik premium asal Amerika Serikat yang menjadi standar industri global. Fluke dikenal dengan keandalan, akurasi, dan ketahanan di lingkungan kerja yang keras. Produk Fluke mencakup multimeter, clamp meter, insulation tester, ground tester, dan thermal imager.</p><p>Kami menyediakan berbagai produk Fluke untuk kebutuhan pengukuran listrik presisi — dari ground tester hingga multimeter remote.</p>',
    'features': [
      'Fluke original — kualitas dan akurasi standar industri global',
      'Tersedia ground tester, multimeter, thermal imager, dan insulation tester',
      'Desain rugged — tahan jatuh, debu, dan air (IP rating)',
      'Sertifikasi keamanan CAT III/CAT IV',
      'Garansi resmi Fluke dan dukungan teknis',
    ],
    'products': [
      ('Fluke 1630 Ground Resistance Meter', 'Clamp-on, 0.025-1500Ω, data storage, alarm'),
      ('Fluke 233 Remote Display Multimeter', 'True RMS, remote display, CAT III 1000V'),
      ('Fluke 87V Industrial Multimeter', 'True RMS, 1000V, 10A, frequency, duty cycle, CAT III 1000V'),
      ('Fluke 376 FC Clamp Meter', 'AC/DC 1000A, True RMS, iFlex, wireless, CAT IV 600V'),
      ('Fluke TiS20+ Thermal Imager', '80×60 IR, 256×320 visible, 2% accuracy, IP54'),
    ],
    'faqs': [
      ('Apa itu Fluke ground tester?','Fluke ground tester (earth resistance meter) mengukur nilai tahanan pentanahan sistem grounding.'),
      ('Apakah produk Fluke original?','Ya, kami menjual Fluke original dengan garansi resmi.'),
      ('Berapa harga Fluke 1630?','Harga tergantung varian dan paket. Hubungi kami via WhatsApp untuk harga terbaru.'),
    ]
  },
  'amprobe': {
    'brand': 'Amprobe',
    'image': '/lp-images/amprobe.jpg',
    'alt': 'Amprobe Cable Locator AT3500',
    'intro': '<p><strong>Amprobe</strong> adalah merek alat ukur profesional asal Amerika yang dikenal dengan produk cable locator, multimeter, dan clamp meter. Amprobe AT3500 adalah cable & pipe locator yang digunakan untuk mendeteksi dan melacak kabel dan pipa bawah tanah tanpa menggali.</p><p>Kami menyediakan berbagai produk Amprobe untuk kebutuhan electrical testing, cable locating, dan troubleshooting instalasi listrik.</p>',
    'features': [
      'Cable & pipe locator untuk deteksi kabel/pipa bawah tanah',
      'Multimeter dan clamp meter untuk electrical testing',
      'Voltage tester untuk deteksi tegangan tanpa kontak',
      'Desain portable dan tahan lama',
      'Garansi resmi dan dukungan teknis',
    ],
    'products': [
      ('Amprobe AT3500 Cable & Pipe Locator', 'Active & passive modes, 8 frequencies, depth 4.5m'),
      ('Amprobe AM-570 Multimeter', 'True RMS, 1000V, CAT IV 600V, LoZ, VFD'),
      ('Amprobe AMP-330 Clamp Meter', 'AC/DC 600A, True RMS, NCV, backlight'),
      ('Amprobe TST-200 Voltage Tester', 'Non-contact, 12-1000V AC, LCD, CAT IV'),
      ('Amprobe PRM-1 Phase Rotation Meter', 'Non-contact, 40-600V, 3-phase indication'),
    ],
    'faqs': [
      ('Apa itu Amprobe AT3500?','Amprobe AT3500 adalah cable & pipe locator untuk mendeteksi dan melacak kabel dan pipa bawah tanah.'),
      ('Berapa kedalaman deteksi Amprobe AT3500?','Kedalaman deteksi hingga 4.5 meter tergantung kondisi tanah.'),
      ('Apakah Amprobe bergaransi?','Ya, produk Amprobe mendapat garansi resmi.'),
    ]
  },
  'topcon': {
    'brand': 'Topcon',
    'image': '/lp-images/topcon.jpg',
    'alt': 'Topcon Total Station',
    'intro': '<p><strong>Topcon</strong> adalah merek alat survey dan positioning asal Jepang yang menjadi pemimpin global. Produk Topcon mencakup total station, GPS/GNSS receiver, theodolite, dan level otomatis. Digunakan oleh surveyor, kontraktor, dan engineer di seluruh dunia.</p><p>Kami menyediakan berbagai produk Topcon untuk kebutuhan survey pemetaan, konstruksi, dan engineering presisi.</p>',
    'features': [
      'Total station Topcon — akurasi tinggi untuk survey presisi',
      'Tersedia GPS/GNSS receiver, theodolite, dan level',
      'Teknologi survey terdepan dengan fitur canggih',
      'Support kalibrasi, servis, dan pelatihan',
      'Garansi resmi dan dukungan teknis',
    ],
    'products': [
      ('Topcon Total Station ES-105', '1" (0.3mgon), 500m reflektor, 350m non-prisma'),
      ('Topcon Total Station GM-101', '1" (0.3mgon), 500m, MagDrive, tracker'),
      ('Topcon GPS GNSS GR-5', 'Multi-constellation, 226 channel, tilt compensation'),
      ('Topcon Theodolite DT-209', '9" (0.3mgon), 30x, LCD, 2-axis compensator'),
      ('Topcon Auto Level AT-B4', '32x, 1.5mm/km, IPX6, compensator magnetik'),
    ],
    'faqs': [
      ('Apa itu Topcon?','Topcon adalah produsen alat survey dan positioning asal Jepang yang memproduksi total station, GPS, dan theodolite.'),
      ('Berapa harga total station Topcon?','Harga tergantung tipe dan spesifikasi. Hubungi kami via WhatsApp untuk penawaran.'),
      ('Apakah ada service center Topcon?','Kami menyediakan layanan kalibrasi, perbaikan, dan dukungan teknis untuk produk Topcon.'),
    ]
  },
  'riken': {
    'brand': 'Riken Keiki',
    'image': '/lp-images/riken.jpg',
    'alt': 'Riken Keiki Gas Monitor Portable',
    'intro': '<p><strong>Riken Keiki</strong> adalah merek gas detector asal Jepang yang terkenal dengan kualitas dan keandalannya. Produk Riken mencakup gas monitor portable, fixed gas detector, dan sensor gas untuk berbagai aplikasi industri.</p><p>Riken Keiki GX-8000 adalah gas monitor portable 4-in-1 yang mendeteksi gas mudah meledak, O2, H2S, dan CO secara simultan — ideal untuk confined space entry dan safety industri.</p>',
    'features': [
      'Gas monitor portable 4-in-1: LEL, O2, H2S, CO',
      'Sensor Riken original — akurasi dan respons cepat',
      'Desain kompak dan ringan untuk penggunaan lapangan',
      'Alarm visual, suara, dan getaran',
      'Sertifikasi internasional untuk area berbahaya',
    ],
    'products': [
      ('Riken Keiki GX-8000', '4-gas, LEL/O2/H2S/CO, compact, data logging'),
      ('Riken Keiki FI-8000 Gas Concentration', 'Fixed gas detector, 4-20 mA, various sensors'),
      ('Riken Keiki GW-2', '2-gas (O2 + LEL), portable, waterproof'),
      ('Riken Keiki RX-8000', 'Combustible gas detector, 0-100% LEL, PID'),
      ('Riken Keiki Sensor Cartridge', 'Replacement sensor for GX-8000 series'),
    ],
    'faqs': [
      ('Apa itu Riken Keiki?','Riken Keiki adalah produsen gas detector asal Jepang yang memproduksi gas monitor portable dan fixed gas detector.'),
      ('Apa fungsi Riken Keiki GX-8000?','GX-8000 adalah gas monitor 4-in-1 untuk mendeteksi gas mudah meledak, oksigen, H2S, dan CO.'),
      ('Apakah Riken Keiki bergaransi?','Ya, produk Riken Keiki mendapat garansi resmi.'),
    ]
  },
  'yokogawa': {
    'brand': 'Yokogawa',
    'image': '/lp-images/yokogawa.jpg',
    'alt': 'Yokogawa Temperature Transmitter dan Instrumen',
    'intro': '<p><strong>Yokogawa</strong> adalah perusahaan instrumen kontrol asal Jepang yang menjadi pemimpin global dalam produk temperature transmitter, pressure transmitter, flow meter, dan sistem kontrol proses. Produk Yokogawa digunakan di industri minyak & gas, kimia, pembangkit listrik, dan manufaktur.</p><p>Kami menyediakan berbagai produk Yokogawa untuk kebutuhan instrumentasi proses — temperature transmitter, pressure transmitter, dan flow meter untuk aplikasi industri berat.</p>',
    'features': [
      'Temperature transmitter Yokogawa — akurasi tinggi, isolasi penuh',
      'Pressure transmitter untuk berbagai aplikasi proses',
      'Flow meter Yokogawa untuk pengukuran aliran presisi',
      'Sistem kontrol distribusi (DCS) dan recorder',
      'Garansi resmi dan dukungan teknis',
    ],
    'products': [
      ('Yokogawa Temperature Transmitter YTA710', 'Head-mounted, RTD/TC, HART, full isolasi'),
      ('Yokogawa Pressure Transmitter EJA Series', 'Differential/gauge/absolute pressure, 0.075% accuracy'),
      ('Yokogawa Flow Meter Rotamass 3', 'Coriolis, 0.1% accuracy, various size'),
      ('Yokogawa Recorder GX20', 'Paperless, 10-channel, touchscreen, Ethernet'),
      ('Yokogawa Clamp-on Tester 30032A', 'Leakage current, 0-300mA, AC/DC, data hold'),
    ],
    'faqs': [
      ('Apa itu Yokogawa?','Yokogawa adalah perusahaan instrumen kontrol Jepang yang memproduksi temperature transmitter, pressure transmitter, dan flow meter.'),
      ('Berapa akurasi Yokogawa temperature transmitter?','Akurasi hingga ±0.1°C tergantung tipe sensor dan model.'),
      ('Apakah produk Yokogawa bergaransi?','Ya, produk Yokogawa mendapat garansi resmi.'),
    ]
  },
  'krisbow': {
    'brand': 'Krisbow',
    'image': '/lp-images/krisbow.jpg',
    'alt': 'Krisbow Thermometer Infrared',
    'intro': '<p><strong>Krisbow</strong> adalah merek alat teknik dan industri asal Indonesia yang dikenal dengan produk berkualitas dengan harga terjangkau. Produk Krisbow mencakup thermometer infrared, power tools, alat ukur, dan perlengkapan keselamatan kerja.</p><p>Kami menyediakan Krisbow thermometer infrared non-contact untuk pengukuran suhu cepat dan akurat tanpa menyentuh objek — ideal untuk industri, food service, dan maintenance.</p>',
    'features': [
      'Thermometer infrared Krisbow — non-contact, cepat dan akurat',
      'Tersedia thermometer digital pen dan infrared 2 laser',
      'Range suhu luas: -50°C hingga 550°C',
      'Laser pointer untuk akurasi bidikan',
      'Garansi resmi dan harga terjangkau',
    ],
    'products': [
      ('Krisbow Thermometer Infrared 2 Laser', 'Range -50°C to 550°C, 12:1, laser, LED'),
      ('Krisbow Thermometer Digital Pen', 'Range -50°C to 300°C, probe tip, LCD'),
      ('Krisbow Thermometer Gun Infrared', 'Range -50°C to 380°C, 12:1, backlight'),
      ('Krisbow Thermocouple Thermometer', 'Type K, dual channel, -200°C to 1372°C'),
      ('Krisbow Temperature Data Logger', 'USB, internal sensor, -30°C to 70°C, 16000 records'),
    ],
    'faqs': [
      ('Apa itu Krisbow thermometer?','Krisbow thermometer adalah alat ukur suhu non-contact infrared yang akurat dan cepat.'),
      ('Berapa range suhu Krisbow thermometer infrared?','Range -50°C hingga 550°C tergantung model.'),
      ('Apakah Krisbow bergaransi?','Ya, produk Krisbow mendapat garansi resmi.'),
    ]
  },
  'htc': {
    'brand': 'HTC',
    'image': '/lp-images/htc.jpg',
    'alt': 'HTC Digital Thermometer Hygrometer',
    'intro': '<p><strong>HTC</strong> adalah merek thermometer digital dan hygrometer yang banyak digunakan untuk monitoring suhu dan kelembaban di berbagai aplikasi. HTC-2 adalah thermometer digital populer yang praktis untuk pengukuran suhu dan kelembaban ruangan, inkubator, dan greenhouse.</p><p>Kami menyediakan berbagai produk thermometer HTC untuk kebutuhan monitoring suhu dan kelembaban Anda.</p>',
    'features': [
      'Thermometer digital HTC dengan display LCD besar',
      'Hygrometer untuk mengukur kelembaban relatif (RH)',
      'Range suhu luas dengan akurasi baik',
      'Baterai tahan lama dan desain portable',
      'Harga terjangkau untuk berbagai kebutuhan',
    ],
    'products': [
      ('HTC-2 Digital Thermometer Hygrometer', 'Range -50°C to 70°C, RH 10-99%, LCD, clock'),
      ('HTC-1 Digital Thermometer', 'Indoor/outdoor, -50°C to 70°C, max/min record'),
      ('HTC-4 Digital Thermometer', 'External probe, -50°C to 110°C, waterproof sensor'),
      ('HTC-8 Temperature Controller', 'Digital thermostat, -50°C to 120°C, relay output'),
      ('HTC Refrigerator Thermometer', 'Stainless probe, -30°C to 30°C, 1m cable'),
    ],
    'faqs': [
      ('Apa itu HTC thermometer?','HTC adalah merek thermometer digital yang digunakan untuk mengukur suhu dan kelembaban ruangan.'),
      ('Berapa range suhu HTC-2?','HTC-2 memiliki range -50°C hingga 70°C dengan akurasi ±1°C.'),
      ('Apakah HTC-2 bisa mengukur kelembaban?','Ya, HTC-2 juga mengukur kelembaban relatif (RH) 10-99%.'),
    ]
  },
  'lutron': {
    'brand': 'Lutron',
    'image': '/lp-images/lutron.jpg',
    'alt': 'Lutron Temperature Recorder BTM-4208SD',
    'intro': '<p><strong>Lutron</strong> adalah merek alat ukur elektronik asal Taiwan yang dikenal dengan produk temperature recorder, thermometer, dan alat ukur lingkungan. Lutron BTM-4208SD adalah temperature recorder 12-channel yang mampu merekam suhu dari 12 sensor thermocouple tipe K secara simultan.</p><p>Kami menyediakan berbagai produk Lutron untuk kebutuhan pengukuran, monitoring, dan data logging suhu profesional.</p>',
    'features': [
      'Temperature recorder 12-channel untuk monitoring multi-titik',
      'Data logging langsung ke SD card (Excel compatible)',
      'Kompatibel dengan thermocouple tipe K, J, T, E, R, S',
      'Real-time clock dan display LCD besar',
      'Cocok untuk industrial process, HVAC, dan research',
    ],
    'products': [
      ('Lutron BTM-4208SD', '12-ch, SD card, TC: K/J/T/E/R/S, 0.1% accuracy'),
      ('Lutron TM-917 Digital Thermometer', 'Dual input, TC: K/J/T/E/R/S, 0.1°, RS232'),
      ('Lutron TM-946 Thermometer', 'Single input, TC K/J, 0.1°, battery, portable'),
      ('Lutron SP-7001 SD Card Logger', '1-ch, -200°C to 1370°C, auto-save, Excel'),
      ('Lutron TM-925 Digital Thermometer', 'Dual display, TC K, 0.1°, 0.1% accuracy, RS232'),
    ],
    'faqs': [
      ('Apa itu Lutron BTM-4208SD?','Lutron BTM-4208SD adalah temperature recorder 12-channel dengan data logging ke SD card.'),
      ('Sensor apa yang kompatibel dengan BTM-4208SD?','Kompatibel dengan thermocouple tipe K, J, T, E, R, dan S.'),
      ('Bagaimana cara mengambil data dari BTM-4208SD?','Data terekam otomatis ke SD card dalam format Excel.'),
    ]
  },
  'ruide': {
    'brand': 'Ruide',
    'image': '/lp-images/total-station.jpg',
    'alt': 'Ruide Total Station RTS-822',
    'intro': '<p><strong>Ruide</strong> adalah merek total station dan alat survey asal China yang menawarkan kualitas baik dengan harga kompetitif. Ruide banyak digunakan oleh surveyor dan kontraktor di Indonesia untuk pekerjaan pemetaan, konstruksi, dan topografi.</p><p>Kami menyediakan berbagai produk Ruide — total station RTS-822, RTS-822A, RTS-822R3, dan aksesori survey pendukung.</p>',
    'features': [
      'Total station Ruide dengan akurasi 2"',
      'Tersedia model RTS-822, RTS-822A, RTS-822R3',
      'Laser pointer dan reflectorless mode',
      'Waterproof dan tahan debu (IP rating)',
      'Harga bersaing dengan garansi',
    ],
    'products': [
      ('Ruide Total Station RTS-822', '2", 500m, laser pointer, waterproof'),
      ('Ruide Total Station RTS-822A', '2", 700m, bluetooth, onboard software'),
      ('Ruide Total Station RTS-822R3', '2", 500m, reflectorless, 3D'),
      ('Ruide Prisma & Aksesori', 'Single prism, tribrach, mini prism'),
      ('Ruide Tripod & Staff', 'Aluminum tripod, fiberglass staff 5m'),
    ],
    'faqs': [
      ('Apa itu Ruide total station?','Ruide adalah merek total station asal China yang menawarkan kualitas baik dengan harga kompetitif.'),
      ('Berapa harga Ruide RTS-822?','Harga Ruide RTS-822 bervariasi. Hubungi kami via WhatsApp untuk penawaran.'),
      ('Apakah Ruide bergaransi?','Ya, produk Ruide mendapat garansi dan dukungan teknis.'),
    ]
  },
  'garmin': {
    'brand': 'Garmin',
    'image': '/lp-images/garmin.jpg',
    'alt': 'Garmin GPSMAP 585 Plus',
    'intro': '<p><strong>Garmin</strong> adalah merek GPS dan navigasi global asal Amerika Serikat. Produk Garmin marine — GPSMAP 585 Plus — adalah chartplotter dan fishfinder yang digunakan untuk navigasi kapal, pemetaan perairan, dan deteksi ikan.</p><p>Kami menyediakan berbagai produk Garmin untuk kebutuhan navigasi, marine, dan outdoor — GPSMAP 585 Plus, echo sounder, dan aksesori marine.</p>',
    'features': [
      'Garmin GPSMAP 585 Plus — chartplotter & fishfinder',
      'Layar warna 5" dengan resolusi tinggi',
      'GPS built-in dengan BlueChart g2 mapping',
      'CHIRP sonar untuk deteksi ikan presisi',
      'Garansi resmi Garmin Indonesia',
    ],
    'products': [
      ('Garmin GPSMAP 585 Plus', '5" color, GPS, CHIRP sonar, BlueChart'),
      ('Garmin GPSMAP 585 Plus + Transducer', 'Bundle with GT-15M-TH transducer'),
      ('Garmin GCV 20 Sonar Module', 'ClearVu/SideVu, CHIRP, network ready'),
      ('Garmin Mount & Power Cable', 'Marine-grade, flush mount bracket'),
      ('Garmin BlueChart g2 MicroSD', 'Coastal mapping, Indonesia coverage'),
    ],
    'faqs': [
      ('Apa itu Garmin GPSMAP 585?','Garmin GPSMAP 585 Plus adalah chartplotter dan fishfinder 5" untuk navigasi kapal.'),
      ('Berapa harga Garmin GPSMAP 585 Plus?','Harga tergantung paket (bundle transducer). Hubungi kami untuk penawaran.'),
      ('Apakah Garmin GPSMAP 585 bisa digunakan untuk survey?','Ya, untuk navigasi dan pemetaan perairan dasar, ideal untuk kapal ikan dan survey bathymetry.'),
    ]
  },
  'echo-sounder': {
    'brand': 'Echo Sounder',
    'image': '/lp-images/total-station.jpg',
    'alt': 'Single Beam Echo Sounder',
    'intro': '<p><strong>Echo sounder</strong> adalah alat untuk mengukur kedalaman air menggunakan gelombang suara (sonar). Single beam echo sounder adalah alat survey bathymetry yang penting untuk pemetaan dasar perairan — sungai, danau, waduk, dan laut dangkal.</p><p>Kami menyediakan echo sounder untuk kebutuhan survey hidrografi, dredging, dan pemetaan perairan.</p>',
    'features': [
      'Single beam echo sounder portable — mudah dibawa ke lapangan',
      'Akurasi tinggi untuk pengukuran kedalaman 0.3-100m',
      'Display LCD real-time dengan data grafik',
      'Cocok untuk survey sungai, danau, waduk, dan pelabuhan',
      'Data output untuk software GIS dan CAD',
    ],
    'products': [
      ('Single Beam Echo Sounder Portable', '200 kHz, 0.3-100m, LCD, internal GPS'),
      ('Echo Sounder Transducer', '200 kHz, 8°, stainless steel, 10m cable'),
      ('Echo Sounder GPS Module', 'Built-in GPS, NMEA 0183 output'),
      ('Echo Sounder Software', 'Data processing, depth profile, volume calc'),
      ('Echo Sounder Portable Kit', 'Echo sounder + transducer + GPS + case'),
    ],
    'faqs': [
      ('Apa itu echo sounder?','Echo sounder adalah alat ukur kedalaman air menggunakan gelombang suara (sonar) untuk survey bathymetry.'),
      ('Berapa kedalaman maksimal echo sounder?','Single beam echo sounder portable dapat mengukur hingga 100 meter.'),
      ('Apa itu bathymetry?','Bathymetry adalah pengukuran kedalaman dasar perairan untuk pemetaan sungai, danau, dan laut.'),
    ]
  },
  'sumitomo': {
    'brand': 'Sumitomo',
    'image': '/lp-images/sumitomo.jpg',
    'alt': 'Sumitomo Fusion Splicer',
    'intro': '<p><strong>Sumitomo Electric</strong> adalah perusahaan asal Jepang yang merupakan pemimpin global dalam teknologi fusion splicer untuk fiber optik. Produk Sumitomo sangat diandalkan oleh provider telekomunikasi, ISP, dan kontraktor fiber optik untuk instalasi dan perawatan jaringan FTTH.</p><p>Kami menyediakan produk Sumitomo fusion splicer dan aksesori fiber optik untuk kebutuhan jaringan Anda.</p>',
    'features': [
      'Fusion splicer Sumitomo asli Jepang — kualitas sambungan terbaik',
      'Core alignment system untuk redaman sambungan minimal',
      'Waktu sambungan cepat (under 10 detik)',
      'Tahan lama dan portable untuk kerja lapangan',
      'Garansi resmi dan dukungan teknis',
    ],
    'products': [
      ('Sumitomo Fusion Splicer Z2C', 'Core alignment, 9s splice, 30s heat, touchscreen'),
      ('Sumitomo Fusion Splicer T-400S', 'Clad alignment, 11s, 2.4kg, IP56'),
      ('Sumitomo CT-105 Cleaver', 'High precision, 16mm, auto load, diamond blade'),
      ('Sumitomo Heat Shrink Sleeves', '60mm, 40mm, single/ribbon, high quality'),
      ('Sumitomo Splicing Accessories', 'Electrode, holder, battery, carrying case'),
    ],
    'faqs': [
      ('Apa itu Sumitomo fusion splicer?','Sumitomo fusion splicer adalah alat untuk menyambung serat optik dengan presisi tinggi — digunakan untuk instalasi jaringan fiber.'),
      ('Berapa redaman sambungan Sumitomo Z2C?','Redaman sambungan khas 0.02 dB untuk single-mode fiber.'),
      ('Apakah Sumitomo bergaransi?','Ya, produk Sumitomo mendapat garansi resmi dan dukungan teknis.'),
    ]
  },
  'motorola': {
    'brand': 'Motorola HT',
    'image': '/lp-images/motorola.jpg',
    'alt': 'Motorola Two-Way Radio HT',
    'intro': '<p><strong>Motorola</strong> adalah produsen radio komunikasi asal Amerika yang menjadi standar global. Produk Motorola HT (handy talky) dikenal dengan kualitas suara jernih, daya tahan tinggi, dan fitur keselamatan. Banyak digunakan oleh security, hotel, event organizer, dan industri.</p><p>Kami menyediakan berbagai produk Motorola HT untuk kebutuhan komunikasi Anda — dari HT basic hingga MOTOTRBO digital.</p>',
    'features': [
      'Motorola HT original — komunikasi jelas dan handal',
      'Tersedia HT analog dan digital (MOTOTRBO)',
      'Daya tahan baterai lama dan konstruksi rugged',
      'Fitur keselamatan: emergency button, lone worker',
      'Garansi resmi dan dukungan teknis',
    ],
    'products': [
      ('Motorola XiR P8668i UHF', 'MOTOTRBO digital, 450-527MHz, 5W, GPS, IP68'),
      ('Motorola XiR P8660i UHF', 'MOTOTRBO digital, 400-527MHz, 5W, IP57'),
      ('Motorola CP200d UHF', 'Digital/analog, 10W, 256 ch, IP54'),
      ('Motorola TLKR T80', 'Analog, 446MHz, 2W, 8 km, 8 ch, PMR446'),
      ('Motorola Accessories', 'Earpiece, battery, charger, antenna, belt clip'),
    ],
    'faqs': [
      ('Apa itu Motorola HT?','Motorola HT (handy talky) adalah radio komunikasi portable untuk komunikasi jarak pendek.'),
      ('Di mana beli Motorola HT di Glodok?','Kami melayani pengiriman seluruh Indonesia. Hubungi kami via WhatsApp untuk informasi.'),
      ('Apakah Motorola HT bergaransi?','Ya, produk Motorola HT mendapat garansi resmi.'),
    ]
  },
  'smart-sensor': {
    'brand': 'Smart Sensor',
    'image': '/lp-images/smart-sensor.jpg',
    'alt': 'Smart Sensor Thermocouple Thermometer',
    'intro': '<p><strong>Smart Sensor</strong> adalah merek alat ukur elektronik dari Hong Kong yang dikenal dengan thermometer thermocouple, sound level meter, dan alat ukur industri. Smart Sensor AS877 adalah thermocouple thermometer 2-channel yang mampu mengukur suhu dari dua sensor tipe K secara simultan.</p><p>Kami menyediakan berbagai produk Smart Sensor untuk kebutuhan pengukuran suhu, suara, dan parameter industri lainnya.</p>',
    'features': [
      'Thermocouple thermometer 2-channel untuk dual input',
      'Kompatibel dengan sensor tipe K, J, T, E, R, S',
      'Range suhu luas: -200°C hingga 1372°C',
      'Data hold, max/min, backlight, auto power off',
      'Harga terjangkau dengan kualitas baik',
    ],
    'products': [
      ('Smart Sensor AS877 Thermocouple', '2-channel, TC K/J/T/E/R/S, -200 to 1372°C'),
      ('Smart Sensor AR882 Sound Level Meter', '30-130 dBA, data logger, RS232, AC/DC output'),
      ('Smart Sensor AR3125 Insulation Tester', '5000V, 0-50GΩ, digital, PI/DAR'),
      ('Smart Sensor AR63A Digital Tachometer', 'Optical/contact, 5-100000 RPM, laser'),
      ('Smart Sensor AR68A Thermometer', 'IR non-contact, -50 to 550°C, 12:1, laser'),
    ],
    'faqs': [
      ('Apa itu Smart Sensor?','Smart Sensor adalah merek alat ukur elektronik yang memproduksi thermometer, sound level meter, dan insulation tester.'),
      ('Berapa channel Smart Sensor AS877?','AS877 memiliki 2 channel untuk dual thermocouple input.'),
      ('Apakah Smart Sensor bergaransi?','Ya, produk Smart Sensor mendapat garansi.'),
    ]
  },
  'biobase': {
    'brand': 'Biobase',
    'image': '/lp-images/biobase.jpg',
    'alt': 'Biobase Alat Laboratorium',
    'intro': '<p><strong>Biobase</strong> adalah merek alat laboratorium asal China yang dikenal dengan produk berkualitas untuk laboratorium klinis, riset, dan industri. Produk Biobase mencakup biosafety cabinet (BSC), laminar flow, oven, inkubator, autoklaf, dan centrifuge.</p><p>Kami menyediakan berbagai produk Biobase untuk kebutuhan laboratorium Anda — dari biosafety cabinet untuk laboratorium mikrobiologi hingga oven dan inkubator untuk riset.</p>',
    'features': [
      'Biosafety cabinet (BSC) Class II — untuk kerja steril',
      'Laminar flow, oven, inkubator, autoklaf, centrifuge',
      'Standar internasional dengan sertifikasi CE',
      'Cocok untuk laboratorium klinis, farmasi, dan riset',
      'Garansi resmi dan dukungan teknis',
    ],
    'products': [
      ('Biobase Biosafety Cabinet BSC-1100IIA2', 'Class II, A2, 1100mm, HEPA H14, UV'),
      ('Biobase Laminar Flow SW-CJ-1FD', 'Horizontal, 870x500x570mm, HEPA, UV'),
      ('Biobase Oven BOV-T50', '50L, 50-300°C, digital PID, forced convection'),
      ('Biobase Autoclave BKQ-B50II', '50L, 126°C, 0.145MPa, digital, automatic'),
      ('Biobase Centrifuge BKC-TH16', 'Max 16000 rpm, 12x1.5ml, digital, timer'),
    ],
    'faqs': [
      ('Apa itu Biobase?','Biobase adalah produsen alat laboratorium asal China yang memproduksi biosafety cabinet, oven, inkubator, dan autoklaf.'),
      ('Apakah Biobase bersertifikasi?','Ya, produk Biobase memiliki sertifikasi CE dan standar internasional.'),
      ('Bagaimana cara memesan Biobase?','Isi form inquiry di bawah atau hubungi kami via WhatsApp.'),
    ]
  },
  'yokogawa-transmitter': {
    'brand': 'Yokogawa Temperature Transmitter',
    'image': '/lp-images/yokogawa.jpg',
    'alt': 'Yokogawa Temperature Transmitter',
    'intro': '<p><strong>Yokogawa</strong> adalah perusahaan instrumen kontrol asal Jepang yang menjadi pemimpin global dalam produk temperature transmitter dan pressure transmitter. YTA710 adalah temperature transmitter head-mounted dengan isolasi penuh, komunikasi HART, dan akurasi tinggi.</p><p>Kami menyediakan Yokogawa temperature transmitter untuk kebutuhan instrumentasi proses di industri minyak & gas, kimia, dan pembangkit listrik.</p>',
    'features': [
      'Temperature transmitter Yokogawa — akurasi tinggi, isolasi penuh',
      'Tipe head-mounted untuk pemasangan di terminal head sensor',
      'Komunikasi HART untuk konfigurasi dan monitoring jarak jauh',
      'Kompatibel dengan RTD (Pt100) dan thermocouple (K/J/T/E/R/S)',
      'Garansi resmi dan dukungan teknis',
    ],
    'products': [
      ('Yokogawa YTA710 Temperature Transmitter', 'Head-mounted, RTD/TC, HART, full isolasi'),
      ('Yokogawa YTA110 Temperature Transmitter', 'Field-mounted, dual sensor, HART, FOUNDATION Fieldbus'),
      ('Yokogawa YTA310 Temperature Transmitter', 'Dual input, backlight LCD, HART, FOUNDATION Fieldbus'),
      ('Yokogawa YTA50 Temperature Sensor', 'RTD Pt100, 3-wire, -200 to 600°C, class A'),
      ('Yokogawa YTA Accessories', 'Configurator, mounting bracket, terminal head'),
    ],
    'faqs': [
      ('Apa itu Yokogawa temperature transmitter?','Yokogawa temperature transmitter mengubah sinyal sensor suhu (RTD/TC) menjadi sinyal 4-20 mA untuk proses kontrol.'),
      ('Berapa akurasi Yokogawa YTA710?','Akurasi hingga ±0.1°C tergantung sensor dan range.'),
      ('Apakah Yokogawa bergaransi?','Ya, produk Yokogawa mendapat garansi resmi.'),
    ]
  },
  'anritsu': {
    'brand': 'Anritsu',
    'image': '/lp-images/anritsu.jpg',
    'alt': 'Anritsu Optical Tester',
    'intro': '<p><strong>Anritsu</strong> adalah perusahaan pengukuran dan komunikasi asal Jepang yang terkenal dengan produk OTDR, spectrum analyzer, dan alat uji telekomunikasi. Anritsu digunakan oleh operator telekomunikasi, provider internet, dan teknisi fiber optik untuk sertifikasi dan troubleshooting jaringan.</p><p>Kami menyediakan berbagai produk Anritsu untuk kebutuhan pengukuran dan pengujian jaringan telekomunikasi dan fiber optik.</p>',
    'features': [
      'OTDR Anritsu — akurasi tinggi untuk analisis fiber optik',
      'Spectrum analyzer untuk pengukuran frekuensi RF/microwave',
      'Network tester untuk sertifikasi dan troubleshooting',
      'Portable dan rugged untuk kerja lapangan',
      'Garansi resmi dan dukungan teknis',
    ],
    'products': [
      ('Anritsu MT9083A2 OTDR', '39dB, 1310/1550nm, dead zone 0.8m, touchscreen'),
      ('Anritsu MS2712E Spectrum Master', '100 kHz to 6 GHz, tracking generator, LTE'),
      ('Anritsu MW9076B OTDR', '6 wavelength, 45dB, PON, 10m dead zone'),
      ('Anritsu MT1000A Network Master', '10G/100G, OTDR, Ethernet, fiber inspection'),
      ('Anritsu ML2438A Power Meter', 'Module, 10 MHz to 40 GHz, dual channel'),
    ],
    'faqs': [
      ('Apa itu Anritsu?','Anritsu adalah perusahaan pengukuran asal Jepang yang memproduksi OTDR, spectrum analyzer, dan network tester.'),
      ('Apa fungsi OTDR Anritsu?','OTDR mengukur panjang, redaman, dan mendeteksi titik kerusakan pada kabel fiber optik.'),
      ('Apakah Anritsu bergaransi?','Ya, produk Anritsu mendapat garansi resmi dan dukungan teknis.'),
    ]
  },
  'anritsu-kyoritsu': {
    'brand': 'Anritsu (Kyoritsu)',
    'image': '/lp-images/kyoritsu.jpg',
    'alt': 'Anritsu Electrical Tester',
    'intro': '<p><strong>Anritsu</strong> (dalam konteks alat ukur listrik) juga dikenal sebagai produsen alat ukur kelistrikan yang kini menjadi bagian dari Kyoritsu. Produk-produk ini mencakup clamp meter, multimeter, dan insulation tester berkualitas Jepang.</p><p>Kami menyediakan berbagai produk Anritsu/Kyoritsu untuk kebutuhan pengukuran listrik profesional.</p>',
    'features': [
      'Alat ukur listrik berkualitas Jepang',
      'Clamp meter, multimeter, dan insulation tester',
      'Sertifikasi keamanan CAT III/CAT IV',
      'Akurasi tinggi dan durabilitas baik',
      'Garansi resmi dan dukungan teknis',
    ],
    'products': [
      ('Anritsu Clamp Meter', 'AC/DC, True RMS, CAT III 600V'),
      ('Anritsu Insulation Tester', 'Digital, 500V/1000V, PI/DAR'),
      ('Anritsu Multimeter', 'Digital, True RMS, AC/DC 1000V'),
      ('Anritsu Earth Tester', 'Digital, 2/3 pole, 200Ω range'),
      ('Anritsu Phase Rotation Tester', 'Non-contact, LED indicator'),
    ],
    'faqs': [
      ('Apa itu Anritsu alat ukur listrik?','Anritsu adalah produsen alat ukur listrik Jepang yang kini menjadi bagian dari Kyoritsu.'),
      ('Apakah produk Anritsu original?','Ya, kami menjual produk Anritsu original dengan garansi.'),
      ('Bagaimana cara memesan Anritsu?','Isi form inquiry di bawah atau hubungi kami via WhatsApp.'),
    ]
  },
  'pressure-transmitter': {
    'brand': 'Pressure & Temperature Transmitter',
    'image': '/lp-images/alat-ukur.jpg',
    'alt': 'Pressure Sensor Transmitter dan Temperature Transmitter',
    'intro': '<p><strong>Pressure sensor transmitter</strong> dan <strong>temperature transmitter</strong> adalah komponen vital dalam sistem kontrol proses industri. Pressure transmitter mengubah tekanan fluida/gas menjadi sinyal 4-20 mA, sementara temperature transmitter mengubah sinyal sensor suhu (RTD/TC) menjadi sinyal standar.</p><p>Kami menyediakan berbagai transmitter untuk kebutuhan monitoring dan kontrol proses di industri.</p>',
    'features': [
      'Pressure transmitter 4-20 mA, 0-10 bar hingga 0-400 bar',
      'Temperature transmitter head-mounted & field-mounted',
      'Kompatibel dengan berbagai sensor (RTD, TC, strain gauge)',
      'Opsi HART, FOUNDATION Fieldbus, dan Profibus',
      'Garansi resmi dan dukungan teknis',
    ],
    'products': [
      ('Pressure Sensor Transmitter 4-20 mA', 'Range 0-10 bar, SS316, 4-20 mA, IP65'),
      ('Yokogawa Temperature Transmitter YTA710', 'Head-mounted, RTD/TC, HART, full isolasi'),
      ('Pressure Transmitter 0-100 bar', 'Flush diaphragm, sanitary, 4-20 mA, HART'),
      ('Differential Pressure Transmitter', 'Range 0-500 mbar, 4-20 mA, LCD'),
      ('Temperature Transmitter Head', 'RTD Pt100 input, 4-20 mA output, 2-wire'),
    ],
    'faqs': [
      ('Apa itu pressure transmitter?','Pressure transmitter mengubah tekanan fluida/gas menjadi sinyal listrik 4-20 mA untuk monitoring dan kontrol proses.'),
      ('Apa itu temperature transmitter?','Temperature transmitter mengubah sinyal sensor suhu (RTD/TC) menjadi sinyal 4-20 mA.'),
      ('Apakah transmitter bergaransi?','Ya, produk transmitter mendapat garansi resmi.'),
    ]
  },
  'laser-distance-meter': {
    'brand': 'Laser Distance Meter',
    'image': '/lp-images/bosch.jpg',
    'alt': 'Laser Distance Meter Digital',
    'intro': '<p><strong>Laser distance meter</strong> adalah alat ukur jarak digital yang menggunakan sinar laser untuk mengukur jarak dengan cepat dan akurat. Alat ini sangat berguna untuk survey properti, konstruksi, arsitektur, dan interior design.</p><p>Kami menyediakan berbagai laser distance meter — dari Bosch, SNDWAY, dan merek lainnya — untuk kebutuhan pengukuran jarak presisi.</p>',
    'features': [
      'Laser distance meter digital — akurasi ±1.5mm hingga ±2mm',
      'Range pengukuran 40m hingga 100m',
      'Fitur Pythagoras, luas, volume, dan indirect measurement',
      'Bluetooth untuk transfer data ke smartphone',
      'Cocok untuk survey properti, konstruksi, dan engineering',
    ],
    'products': [
      ('Bosch Laser GLM400', '40m, akurasi ±1.5mm, Bluetooth, IP54'),
      ('Bosch Laser GLM 50-27 CG', '50m, akurasi ±1.5mm, camera, Bluetooth'),
      ('SNDWAY Laser Distance Meter SW-T40', '40m, akurasi ±2mm, IP54, multi-mode'),
      ('3D Laser Measuring Tool', '30m, akurasi ±1mm, Bluetooth, 3D scan'),
      ('Laser Distance Meter 100m', '100m, akurasi ±1.5mm, IP65, tilt sensor'),
    ],
    'faqs': [
      ('Apa itu laser distance meter?','Laser distance meter adalah alat ukur jarak digital yang menggunakan sinar laser untuk mengukur jarak akurat hingga 100m.'),
      ('Berapa akurasi laser distance meter?','Akurasi ±1.5mm hingga ±2mm tergantung merek dan model.'),
      ('Apakah laser distance meter bergaransi?','Ya, produk mendapat garansi resmi.'),
    ]
  },
  'thermometer': {
    'brand': 'Termometer Digital',
    'image': '/lp-images/htc.jpg',
    'alt': 'Termometer Digital dan Thermometer Infrared',
    'intro': '<p>Kami menyediakan berbagai <strong>thermometer digital</strong> dan <strong>thermal infrared thermometer</strong> untuk kebutuhan pengukuran suhu di industri, food service, kesehatan, dan rumah tangga. Dari HTC-2 digital hygrometer, Krisbow infrared thermometer, hingga Lutron temperature recorder profesional.</p><p>Pilih thermometer yang sesuai dengan kebutuhan Anda — non-contact infrared atau probe digital — semua tersedia dengan harga bersaing.</p>',
    'features': [
      'Thermometer digital probe — akurat untuk kontak langsung',
      'Thermometer infrared non-contact — cepat tanpa sentuhan',
      'Temperature data logger — untuk monitoring berkelanjutan',
      'Range suhu luas: -50°C hingga 1372°C',
      'Garansi resmi dan harga terjangkau',
    ],
    'products': [
      ('HTC-2 Digital Thermometer Hygrometer', 'Range -50°C to 70°C, RH 10-99%, LCD, clock'),
      ('Krisbow Thermometer Infrared 2 Laser', 'Range -50°C to 550°C, 12:1, laser, LED'),
      ('Lutron BTM-4208SD Temperature Recorder', '12-ch, SD card, TC: K/J/T/E/R/S'),
      ('Smart Sensor AS877 Thermocouple', '2-channel, TC K/J/T/E/R/S, -200 to 1372°C'),
      ('Krisbow Thermometer Digital Pen', 'Range -50°C to 300°C, probe tip, LCD'),
    ],
    'faqs': [
      ('Apa perbedaan thermometer infrared dan digital probe?','Infrared non-contact (cepat, tanpa sentuh), digital probe (kontak langsung, lebih akurat untuk permukaan).'),
      ('Berapa range suhu thermometer infrared?','Range -50°C hingga 550°C tergantung model.'),
      ('Apakah ada thermometer untuk industri?','Ya, tersedia Lutron temperature recorder 12-channel dan Smart Sensor thermocouple untuk aplikasi industri.'),
    ]
  },
  'moisture-meter': {
    'brand': 'Moisture Meter',
    'image': '/lp-images/alat-ukur.jpg',
    'alt': 'Alat Pengukur Kadar Air / Moisture Meter',
    'intro': '<p><strong>Moisture meter</strong> atau alat pengukur kadar air adalah instrumen untuk mengukur persentase kadar air dalam suatu material. Alat ini penting untuk industri kayu, konstruksi, pertanian, dan bahan bangunan untuk memastikan kualitas dan keamanan material.</p><p>Kami menyediakan berbagai moisture meter untuk kebutuhan pengukuran kadar air di berbagai material.</p>',
    'features': [
      'Moisture meter digital — akurasi tinggi, respons cepat',
      'Cocok untuk kayu, beton, dinding, tanah, dan biji-bijian',
      'Tipe pin-type dan pinless (non-destructive)',
      'Range kadar air luas: 0-90% tergantung material',
      'Portable, ringan, dan mudah digunakan di lapangan',
    ],
    'products': [
      ('Moisture Meter Kayu & Bahan Bangunan', 'Pin-type, 0-50% wood, 0-20% building, LCD'),
      ('Moisture Meter Pinless 20mm', 'Non-destructive, 20mm depth, 0-80% wood'),
      ('Moisture Meter Biji-bijian & Grain', 'Digital probe, 5-35% grain, automatic temp comp'),
      ('Moisture Meter Tanah', 'Soil moisture, pH, light, 3-in-1, no battery'),
      ('Moisture Meter Data Logger', 'USB, 16000 records, software, export to Excel'),
    ],
    'faqs': [
      ('Apa itu moisture meter?','Moisture meter adalah alat untuk mengukur kadar air dalam material seperti kayu, beton, dan tanah.'),
      ('Apa perbedaan pin-type dan pinless?','Pin-type menusuk material (lebih akurat untuk presisi), pinless non-destructive (tanpa merusak permukaan).'),
      ('Apakah moisture meter bergaransi?','Ya, produk moisture meter mendapat garansi.'),
    ]
  },
  'spectrum-analyzer': {
    'brand': 'Spectrum Analyzer',
    'image': '/lp-images/anritsu.jpg',
    'alt': 'Spectrum Analyzer untuk Pengukuran Frekuensi',
    'intro': '<p><strong>Spectrum analyzer</strong> adalah alat ukur yang menampilkan amplitudo sinyal terhadap frekuensi. Digunakan untuk analisis spektrum RF, troubleshooting sinyal, pengukuran EMI, dan karakterisasi komponen elektronik. Penting bagi teknisi telekomunikasi, engineer RF, dan laboratorium elektronika.</p><p>Kami menyediakan berbagai spectrum analyzer dan network analyzer untuk kebutuhan pengukuran frekuensi dan sinyal.</p>',
    'features': [
      'Spectrum analyzer portable — 9 kHz hingga 3.2 GHz',
      'Tracking generator untuk pengukuran response frekuensi',
      'Fitur marker, limit line, dan data logging',
      'Cocok untuk troubleshooting RF, EMI, dan pengukuran sinyal',
      'Garansi resmi dan dukungan teknis',
    ],
    'products': [
      ('Spectrum Analyzer 9 kHz - 3.2 GHz', 'Portable, tracking generator, marker, 3.2 GHz'),
      ('Spectrum Analyzer 100 kHz - 7.5 GHz', 'High-end, 7.5 GHz, tracking gen, AM/FM'),
      ('Anritsu MS2712E Spectrum Master', '100 kHz to 6 GHz, tracking generator, LTE'),
      ('Spectrum Analyzer Accessories', 'Antenna, cable, near-field probe set'),
      ('Spectrum Analyzer Software', 'Data analysis, reporting, limit line editor'),
    ],
    'faqs': [
      ('Apa itu spectrum analyzer?','Spectrum analyzer adalah alat yang mengukur dan menampilkan amplitudo sinyal terhadap frekuensi — untuk analisis spektrum RF dan troubleshooting.'),
      ('Apa fungsi tracking generator?','Tracking generator menghasilkan sinyal yang sinkron dengan frekuensi spectrum analyzer untuk pengukuran respons frekuensi.'),
      ('Apakah spectrum analyzer bergaransi?','Ya, produk mendapat garansi resmi.'),
    ]
  }
}

# ============================================================
# MAP KEYWORD → HUB
# ============================================================
KW_MAP = {
  # honeywell
  'xnx xnx honeywell analysis': 'honeywell',
  'honeywell xnx': 'honeywell',
  'xnnx honeywell analytics xnx gas detector calibration machine': 'honeywell',
  'xnx xnx honeywell detector': 'honeywell',
  # mitutoyo
  'mitutoyo indonesia': 'mitutoyo',
  'pt mitutoyo indonesia': 'mitutoyo',
  'pt mitsutoyo indonesia': 'mitutoyo',
  'mitutoyo cmm': 'mitutoyo',
  # alat laboratorium
  'toko laboratorium': 'alat-laboratorium',
  'toko lab': 'alat-laboratorium',
  'toko alat lab': 'alat-laboratorium',
  'toko peralatan laboratorium': 'alat-laboratorium',
  'jual alat laboratorium jakarta': 'alat-laboratorium',
  # bosch + geo
  'distributor bosch': 'bosch',
  'toko bosch terdekat': 'bosch',
  'bosch surabaya': 'bosch',
  'distributor bosch jakarta': 'bosch',
  'agen bosch jakarta': 'bosch',
  'bosch batam': 'bosch',
  'bosch balikpapan': 'bosch',
  'bosch palembang': 'bosch',
  'bosch jogja': 'bosch',
  'service bosch': 'bosch',
  # kyoritsu
  'kyoritsu': 'kyoritsu',
  'distributor kyoritsu': 'kyoritsu',
  # skf bearing
  'skf bearing indonesia': 'skf',
  'skf bearing': 'skf',
  'distributor bearing skf': 'skf',
  'bearing skf jakarta': 'skf',
  'baker skf': 'skf',
  # total station & survey
  'jual total station': 'total-station',
  'ruide total station': 'ruide',
  'survey dan pemetaan': 'total-station',
  'jual beli alat survey bekas': 'total-station',
  'topcon indonesia': 'topcon',
  'single beam echo sounder': 'echo-sounder',
  'echo sounder': 'echo-sounder',  # fallback
  # alat ukur
  'distributor alat ukur': 'alat-ukur',
  'alat ukur digital laser': 'laser-distance-meter',
  '3d laser measuring tool': 'laser-distance-meter',
  # az instrument
  'az instrument indonesia': 'az-instrument',
  # sanwa
  'sanwa digital multimeter cd800a': 'sanwa',
  'toko sanwa': 'sanwa',
  # joinwit
  'joinwit': 'joinwit',
  # sndway
  'sndway': 'sndway',
  # icom
  'icom store': 'icom',
  'icom 7400': 'icom',
  # hanna
  'hanna instrument indonesia': 'hanna',
  # fluke
  'fluke ground tester': 'fluke',
  'fluke flow meter': 'fluke',
  # amprobe
  'amprobe at 3500': 'amprobe',
  # riken keiki
  'riken keiki fi 8000': 'riken',
  # yokogawa
  'yokogawa temperature transmitter': 'yokogawa-transmitter',
  # krisbow
  'thermometer krisbow': 'krisbow',
  'krisbow thermometer infrared': 'krisbow',
  # htc
  'htc 2 thermometer': 'htc',
  # lutron
  'lutron btm 4208sd': 'lutron',
  # sumitomo
  'dealer sumitomo': 'sumitomo',
  # motorola
  'distributor ht motorola': 'motorola',
  'distributor ht motorola di glodok': 'motorola',
  # garmin
  'garmin gpsmap 585': 'garmin',
  'gps 585 garmin': 'garmin',
  # smart sensor
  '2 wire thermocouple': 'smart-sensor',
  # biobase
  'pt babad primasentosa': 'biobase',
  # anritsu
  'distributor kyoritsu (anritsu)': 'anritsu-kyoritsu',
  # pressure transmitter
  'pressure sensor transmitter': 'pressure-transmitter',
  # thermometer (general)
  'alat pengukur kandungan air': 'moisture-meter',
  # spectrum analyzer
  'cara kerja spectrum analyzer': 'spectrum-analyzer',
  # navigational / fallback
  'dharma precision tools': 'alat-ukur',
  'pt macrocitra ardanasejati rightsign': 'alat-ukur',
}

# ============================================================
# PRICE RANGES PER HUB (IDR) — untuk Schema.org Product
# ============================================================
PRICES = {
  'honeywell': (5000000, 50000000),
  'mitutoyo': (500000, 50000000),
  'alat-laboratorium': (500000, 100000000),
  'bosch': (500000, 8000000),
  'kyoritsu': (1000000, 15000000),
  'skf': (100000, 5000000),
  'total-station': (30000000, 200000000),
  'alat-ukur': (200000, 15000000),
  'az-instrument': (300000, 5000000),
  'sanwa': (300000, 5000000),
  'joinwit': (5000000, 30000000),
  'sndway': (200000, 3000000),
  'icom': (2000000, 20000000),
  'hanna': (1000000, 20000000),
  'fluke': (2000000, 50000000),
  'amprobe': (500000, 10000000),
  'topcon': (30000000, 200000000),
  'riken': (5000000, 40000000),
  'yokogawa': (3000000, 50000000),
  'krisbow': (50000, 3000000),
  'htc': (100000, 2000000),
  'lutron': (300000, 5000000),
  'ruide': (20000000, 100000000),
  'garmin': (3000000, 30000000),
  'echo-sounder': (15000000, 80000000),
  'sumitomo': (20000000, 80000000),
  'motorola': (500000, 8000000),
  'smart-sensor': (50000, 2000000),
  'biobase': (1000000, 30000000),
  'yokogawa-transmitter': (3000000, 30000000),
  'anritsu': (20000000, 100000000),
  'anritsu-kyoritsu': (1000000, 15000000),
  'pressure-transmitter': (1000000, 15000000),
  'laser-distance-meter': (200000, 5000000),
  'thermometer': (50000, 2000000),
  'moisture-meter': (200000, 3000000),
  'spectrum-analyzer': (20000000, 100000000),
}

# ============================================================
# TEMPLATE HTML
# ============================================================
IC_SNIPPET = '<script>window.IC = (n) => `<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;</script>'

KONTAK = open('public/kontak.html', encoding='utf-8').read()
m = re.search(r'(<svg[^>]*style="display:none"[^>]*>.*?</svg>)', KONTAK, re.S)
SPRITE = m.group(1) if m else ''

def gen_lp(keyword, hub_name, hub_data, location=None):
    slug = re.sub(r'[^a-z0-9-]', '', keyword.lower().replace(' ', '-'))
    if not slug: return None
    brand = hub_data['brand']
    img = hub_data['image']
    alt = hub_data['alt']
    intro = hub_data['intro']
    features = hub_data['features']
    products = hub_data['products']
    faqs = hub_data['faqs']
    canonical = f'https://proindustri.com/{slug}'
    low_price, high_price = PRICES.get(hub_name, (100000, 5000000))

    # Buat judul dari keyword (proper case, tanpa preposisi)
    title = keyword.strip()
    h1 = title
    desc = f'Jual {title} — {brand} original dengan garansi resmi. Harga bersaing, pengiriman seluruh Indonesia. Pesan via WhatsApp sekarang!'
    if location:
        h1 = f'{title} — {location}'
        desc = f'Jual {title} di {location} dan seluruh Indonesia. {brand} original, garansi resmi, harga bersaing. Pesan via WhatsApp!'

    feat_html = '\n      '.join(f'<li>{f}</li>' for f in features)
    prod_rows = ''
    for name, spec in products:
        wa_msg = f'Halo ProIndustri 👋%0ASaya tertarik dengan produk: *{name}*%0A%0A{spec}%0A%0AMohon informasinya.'
        prod_rows += f'        <tr><td>{name}</td><td>{spec}</td><td><a href="https://wa.me/6281394191904?text={wa_msg}" target="_blank" rel="noopener" class="btn-wa-sm">Minta Penawaran via WA</a></td></tr>\n'

    faq_html = '\n    '.join(f'<details class="faq-item"><summary>{q}</summary><p>{a}</p></details>' for q, a in faqs)
    faq_schema_items = [f'{{"@type":"Question","name":{json.dumps(q)},"acceptedAnswer":{{"@type":"Answer","text":{json.dumps(a)}}}}}' for q, a in faqs]
    faq_schema = f'{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{",".join(faq_schema_items)}]}}'

    loc_html = ''
    if location:
        loc_html = f'<p><strong>Melayani pengiriman ke {location}</strong> dan seluruh Indonesia. Pesan sekarang, proses cepat!</p>'

    # WA prefilled untuk tombol hero
    hero_wa_msg = f'Halo ProIndustri 👋%0ASaya tertarik dengan: *{h1}*%0A%0AMohon informasinya.'

    return f'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} | ProIndustri</title>
<meta name="description" content="{desc}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ProIndustri">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="https://proindustri.com{img}">
<meta property="og:image:width" content="800">
<meta property="og:image:height" content="800">
<meta property="og:locale" content="id_ID">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="https://proindustri.com{img}">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230F1B2D'/><text x='50' y='68' font-size='50' font-weight='900' fill='white' text-anchor='middle'>P</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
<script type="application/ld+json">{faq_schema}</script>
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"Product","name":"{h1}","description":"{desc}","url":"{canonical}","brand":{{"@type":"Brand","name":"{brand}"}},"offers":{{"@type":"AggregateOffer","offerCount":"{len(products)}","lowPrice":"{low_price}","highPrice":"{high_price}","priceCurrency":"IDR","availability":"https://schema.org/InStock","url":"{canonical}"}}}}</script>
<style>
.lp-page{{max-width:1100px;margin:0 auto 60px;padding:0 20px}}
/* HERO */
.lp-hero{{display:flex;align-items:center;gap:40px;background:linear-gradient(135deg,#0F1B2D 0%,#1a2a44 100%);border-radius:20px;padding:40px;margin:30px 0;color:#fff}}
.lp-hero-text{{flex:1}}
.lp-hero-text .eyebrow{{color:#f59e0b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px}}
.lp-hero-text h1{{font-size:30px;font-weight:900;margin:0 0 12px;line-height:1.2;color:#fff}}
.lp-hero-text .sub{{font-size:15px;line-height:1.7;color:rgba(255,255,255,.8);margin-bottom:20px}}
.lp-hero-text .btn-hero{{display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#fff;padding:14px 32px;border-radius:50px;font-size:15px;font-weight:700;text-decoration:none;transition:all .2s;box-shadow:0 4px 15px rgba(37,211,102,.4)}}
.lp-hero-text .btn-hero:hover{{transform:translateY(-2px);box-shadow:0 6px 20px rgba(37,211,102,.5)}}
.lp-hero-text .trust-mini{{display:flex;gap:20px;margin-top:16px;flex-wrap:wrap}}
.lp-hero-text .trust-mini span{{font-size:12px;color:rgba(255,255,255,.7);display:flex;align-items:center;gap:6px}}
.lp-hero-img{{flex:0 0 300px;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.3);background:#fff;padding:10px}}
.lp-hero-img img{{width:100%;height:auto;display:block;border-radius:8px;mix-blend-mode:multiply}}
/* TRUST BAR */
.lp-trustbar{{display:flex;justify-content:center;gap:30px;background:#fff;border:1px solid var(--border);border-radius:12px;padding:18px 30px;margin-bottom:30px;flex-wrap:wrap}}
.lp-trustbar div{{font-size:13px;font-weight:600;color:var(--dark);display:flex;align-items:center;gap:8px}}
.lp-trustbar div::before{{content:"✓";color:#10b981;font-weight:900;font-size:16px}}
/* SECTION */
.lp-section{{background:#fff;border:1px solid var(--border);border-radius:16px;padding:30px;margin-bottom:24px}}
.lp-section h2{{font-size:20px;font-weight:800;margin-bottom:16px;color:var(--dark);padding-bottom:12px;border-bottom:3px solid var(--red);display:inline-block}}
.lp-section p{{font-size:14px;color:var(--muted);line-height:1.8;margin-bottom:12px}}
.lp-benefits ul{{list-style:none;padding:0}}
.lp-benefits ul li{{padding:12px 0 12px 28px;position:relative;font-size:14px;color:var(--muted);border-bottom:1px solid #f5f5f5}}
.lp-benefits ul li:last-child{{border-bottom:none}}
.lp-benefits ul li::before{{content:"\\2713";position:absolute;left:0;color:#10b981;font-weight:700;font-size:16px}}
/* PRODUCTS TABLE */
.lp-table{{width:100%;border-collapse:collapse;font-size:13px}}
.lp-table th{{background:#f8f8f8;padding:12px 14px;text-align:left;font-weight:700;color:var(--dark);border-bottom:2px solid var(--border)}}
.lp-table td{{padding:12px 14px;border-bottom:1px solid #f0f0f0;color:var(--muted);vertical-align:middle}}
.lp-table tr:last-child td{{border-bottom:none}}
.btn-wa-sm{{display:inline-block;background:#25D366;color:#fff;padding:7px 14px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;transition:opacity .2s}}
.btn-wa-sm:hover{{opacity:.9}}
/* WHY US */
.lp-whyus{{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-top:16px}}
.lp-whyus-item{{background:#f8f9fa;border-radius:12px;padding:20px;text-align:center}}
.lp-whyus-item .icon{{font-size:28px;margin-bottom:8px}}
.lp-whyus-item h3{{font-size:14px;font-weight:700;color:var(--dark);margin-bottom:4px}}
.lp-whyus-item p{{font-size:12px;color:var(--muted);margin:0}}
/* FAQ */
.lp-faq .faq-item{{padding:16px 12px 16px 24px;border-bottom:1px solid #f0f0f0}}
.lp-faq .faq-item:last-child{{border-bottom:none}}
.lp-faq .faq-item summary{{font-size:14px;font-weight:700;color:var(--dark);margin-bottom:6px;cursor:pointer;list-style:none}}
.lp-faq .faq-item summary::-webkit-details-marker{{display:none}}
.lp-faq .faq-item summary::before{{content:"\\25B6";margin-right:12px;color:var(--red);font-size:11px;display:inline-block;transition:transform .2s}}
.lp-faq .faq-item[open] summary::before{{transform:rotate(90deg)}}
.lp-faq .faq-item p{{font-size:13px;color:var(--muted);line-height:1.7;margin:8px 0 0 28px}}
/* INQUIRY FORM */
.lp-inquiry{{background:linear-gradient(135deg,#0F1B2D,#1a2a44);border-radius:16px;padding:40px;margin-bottom:30px;color:#fff}}
.lp-inquiry h2{{font-size:22px;font-weight:800;margin-bottom:6px;color:#fff}}
.lp-inquiry .sub{{font-size:14px;color:rgba(255,255,255,.7);margin-bottom:24px}}
.lp-inquiry .form-group{{margin-bottom:14px}}
.lp-inquiry .form-group label{{display:block;font-size:13px;font-weight:600;color:rgba(255,255,255,.9);margin-bottom:5px}}
.lp-inquiry .form-group input,.lp-inquiry .form-group textarea{{width:100%!important;padding:12px 16px;border:1px solid rgba(255,255,255,.2);border-radius:8px;font-size:14px;font-family:inherit;box-sizing:border-box;background:rgba(255,255,255,.1);color:#fff;transition:all .2s}}
.lp-inquiry .form-group input:focus,.lp-inquiry .form-group textarea:focus{{outline:none;border-color:#25D366;background:rgba(255,255,255,.15)}}
.lp-inquiry .form-group input::placeholder,.lp-inquiry .form-group textarea::placeholder{{color:rgba(255,255,255,.5)}}
.lp-inquiry .btn{{background:#25D366;color:#fff;border:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:all .2s}}
.lp-inquiry .btn:hover{{opacity:.9;transform:translateY(-1px)}}
.lp-inquiry .btn-wa-sm{{display:inline-flex;align-items:center;gap:6px;background:#25D366;color:#fff;padding:10px 20px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;transition:opacity .2s;margin-top:4px;margin-right:4px}}
.lp-inquiry .btn-wa-sm:hover{{opacity:.9}}
@media(max-width:768px){{.lp-hero{{flex-direction:column;padding:24px}}.lp-hero-img{{flex:0 0 auto;width:200px;margin:0 auto}}.lp-hero-text h1{{font-size:24px}}.lp-hero,.lp-section,.lp-inquiry{{padding:20px}}.lp-trustbar{{gap:12px;padding:14px 16px}}.lp-trustbar div{{font-size:12px}}.lp-table{{font-size:12px}}.lp-table th,.lp-table td{{padding:8px}}.lp-whyus{{grid-template-columns:repeat(2,1fr)}}}}
</style>
</head>
<body>
<div id="site-nav"></div>

<div class="lp-page">
  <!-- HERO -->
  <div class="lp-hero">
    <div class="lp-hero-text">
      <div class="eyebrow">Original • Bergaransi • Siap Kirim</div>
      <h1>{h1}</h1>
      <div class="sub">{brand} original dengan garansi resmi. Harga bersaing, pengiriman ke seluruh Indonesia. Pesan sekarang, proses cepat!</div>
      <a href="https://wa.me/6281394191904?text={hero_wa_msg}" target="_blank" rel="noopener" class="btn-hero">&#128172; Tanya Harga & Stok via WhatsApp</a>
      <div class="trust-mini">
        <span>&#9989; Original 100%</span>
        <span>&#9989; Bergaransi</span>
        <span>&#9989; Siap Kirim</span>
        <span>&#9989; Pembayaran Aman</span>
      </div>
    </div>
    <div class="lp-hero-img">
      <img src="{img}" alt="{alt}" loading="lazy" width="400" height="400">
    </div>
  </div>

  <!-- TRUST BAR -->
  <div class="lp-trustbar">
    <div>Produk Original 100%</div>
    <div>Garansi Resmi</div>
    <div>Ready Stock</div>
    <div>Kirim Seluruh Indonesia</div>
    <div>Pembayaran Aman</div>
  </div>

  <!-- INTRO -->
  <div class="lp-section">
    {intro}
    {loc_html}
  </div>

  <!-- BENEFITS -->
  <div class="lp-section lp-benefits">
    <h2>Keunggulan {brand}</h2>
    <ul>
      {feat_html}
    </ul>
  </div>

  <!-- PRODUCTS -->
  <div class="lp-section">
    <h2>Produk Tersedia</h2>
    <p style="font-size:13px;color:var(--muted);margin-bottom:16px">Klik "Minta Penawaran via WA" untuk setiap produk. Kami akan merespon dalam 1x24 jam.</p>
    <div class="lp-table-wrap" style="overflow-x:auto">
      <table class="lp-table">
        <thead><tr><th>Produk</th><th>Spesifikasi</th><th style="width:180px">Aksi</th></tr></thead>
        <tbody>
{prod_rows}
        </tbody>
      </table>
    </div>
  </div>

  <!-- WHY US -->
  <div class="lp-section">
    <h2>Kenapa Beli di ProIndustri?</h2>
    <div class="lp-whyus">
      <div class="lp-whyus-item"><div class="icon">&#128737;</div><h3>Produk Original</h3><p>Kami hanya menjual produk asli dengan garansi resmi distributor.</p></div>
      <div class="lp-whyus-item"><div class="icon">&#128666;</div><h3>Pengiriman Cepat</h3><p>Kirim ke seluruh Indonesia via ekspedisi terpercaya dengan packing aman.</p></div>
      <div class="lp-whyus-item"><div class="icon">&#128179;</div><h3>Harga Bersaing</h3><p>Harga terbaik untuk produk berkualitas — cocok untuk budget Anda.</p></div>
      <div class="lp-whyus-item"><div class="icon">&#128222;</div><h3>Konsultasi Gratis</h3><p>Tim kami siap membantu memilih produk yang tepat untuk kebutuhan Anda.</p></div>
    </div>
  </div>

  <!-- FAQ -->
  <div class="lp-section lp-faq">
    <h2>Pertanyaan Umum (FAQ)</h2>
    {faq_html}
  </div>

  <!-- FINAL CTA + FORM -->
  <div class="lp-inquiry">
    <h2>Pesan Sekarang!</h2>
    <div class="sub">Isi form di bawah atau langsung chat WhatsApp. Kami akan merespon dalam 1x24 jam.</div>
    <div id="formFields">
      <div class="form-group"><label>Nama *</label><input type="text" id="inqName" placeholder="Nama Anda" required></div>
      <div class="form-group"><label>Kontak (HP/Email) *</label><input type="text" id="inqContact" placeholder="No. WhatsApp atau Email" required></div>
      <div class="form-group"><label>Produk yang diminati</label><input type="text" id="inqProduct" value="{h1}"></div>
      <div class="form-group"><label>Pesan tambahan</label><textarea id="inqMessage" placeholder="Spesifikasi, jumlah, atau pertanyaan Anda..."></textarea></div>
      <button class="btn" onclick="sendInquiry()">&#128172; Kirim ke WhatsApp</button>
    </div>
    <div id="inqSuccess" style="display:none;color:#25D366;font-weight:700;padding:20px 0;text-align:center">Terima kasih! Kami akan merespon pesan Anda segera.</div>
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
  var msg='Halo ProIndustri 👋\\n\\nSaya tertarik dengan:\\n*'+p+'*\\n\\nNama: '+n+'\\nKontak: '+c+(m?'\\nPesan: '+m:'')+'\\n\\nMohon informasinya.';
  window.open('https://wa.me/6281394191904?text='+encodeURIComponent(msg),'_blank');
  document.getElementById('formFields').style.display='none';
  document.getElementById('inqSuccess').style.display='block';
}}
</script>
{SPRITE}
<script src="/assets/site.js"></script>
</body>
</html>'''

# ============================================================
# MAIN GENERATOR
# ============================================================
# Baca Excel untuk daftar keyword + volume
wb = openpyxl.load_workbook('/home/ubuntu/.hermes/cache/documents/doc_0636ffcc7dfa_Keyword Pro Industri.xlsx', data_only=True)
ws = wb['Sheet1']
rows = []
for row in ws.iter_rows(min_row=2, values_only=True):
    if not row[0]: continue
    kw = str(row[0]).strip().lower()
    vol = 0
    for v in row[2:6]:
        if isinstance(v, (int,float)) and v > 0:
            vol = int(v); break
    url = str(row[6] or '').strip()
    rows.append((kw, vol, url))

# Dedupe by keyword
seen = {}
for kw, vol, url in rows:
    if kw not in seen or vol > seen[kw][0]:
        seen[kw] = (vol, url)

print(f'Total keyword unik: {len(seen)}')
os.makedirs('public', exist_ok=True)
generated = []
skipped = []

for kw, (vol, url) in sorted(seen.items(), key=lambda r: -r[1][0]):
    # Map keyword ke hub
    hub_name = None
    for pattern, h in KW_MAP.items():
        if pattern in kw or kw in pattern:
            hub_name = h
            break
    
    if not hub_name:
        # Coba partial match: jika keyword mengandung kata brand
        brand_kw = {'honeywell':'honeywell','mitutoyo':'mitutoyo','kyoritsu':'kyoritsu',
                    'bosch':'bosch','sanwa':'sanwa','skf':'skf','joinwit':'joinwit',
                    'sndway':'sndway','icom':'icom','hanna':'hanna','fluke':'fluke',
                    'amprobe':'amprobe','topcon':'topcon','riken':'riken','ruide':'ruide',
                    'yokogawa':'yokogawa','krisbow':'krisbow','htc':'htc','lutron':'lutron',
                    'sumitomo':'sumitomo','motorola':'motorola','garmin':'garmin',
                    'echo sounder':'echo-sounder','spectrum':'spectrum-analyzer',
                    'moisture':'moisture-meter','thermocouple':'smart-sensor',
                    'thermometer':'thermometer','temperature':'thermometer','termometer':'thermometer'}
        for word, h in brand_kw.items():
            if word in kw:
                hub_name = h
                break
    
    if not hub_name:
        skipped.append(kw)
        continue
    
    hub_data = HUBS.get(hub_name)
    if not hub_data:
        skipped.append(kw)
        continue
    
    # Deteksi location
    location = None
    geo_kota = ['surabaya','jakarta','batam','balikpapan','jogja','yogyakarta','palembang']
    for kota in geo_kota:
        if kota in kw:
            location = kota
            break
    
    html = gen_lp(kw, hub_name, hub_data, location)
    if html:
        slug = re.sub(r'[^a-z0-9-]', '', kw.replace(' ', '-'))
        path = f'public/{slug}.html'
        open(path, 'w', encoding='utf-8').write(html)
        generated.append((slug, kw, vol, hub_name))
    
print(f'Generated: {len(generated)} LPs')
print(f'Skipped: {len(skipped)}')
if skipped:
    print('Skipped keywords:', skipped[:10])
print()
print('=== Generated LPs (by volume) ===')
for slug, kw, vol, hub in sorted(generated, key=lambda r: -r[2]):
    print(f'  {vol:5,}  /jual/{slug}  — {kw[:50]}')
print(f'\nTotal: {len(generated)} landing pages')