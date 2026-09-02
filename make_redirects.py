#!/usr/bin/env python3
import os

# Generate 68 redirect files in public/jual/ → root
slugs = sorted([f[:-5] for f in os.listdir('public') if f.endswith('.html')
                and not f.startswith('jual')
                and f not in ('index.html','shop.html','produk.html','artikel.html','tentang-kami.html',
                              'kontak.html','faq.html','admin.html','akun.html','cart.html','checkout.html',
                              'offline.html','icon-sprite.html','sitemap.html')])

os.makedirs('public/jual', exist_ok=True)

# Legacy alias: old slug → new slug (root)
legacy = {
    'honeywell-xnx-gas-detector': 'xnx-xnx-honeywell-analysis',
    'mitutoyo': 'mitutoyo-indonesia',
    'alat-laboratorium': 'toko-laboratorium',
    'bosch': 'distributor-bosch',
    'kyoritsu': 'kyoritsu',
    'skf-bearing': 'skf-bearing',
    'total-station': 'jual-total-station',
    'alat-ukur': 'distributor-alat-ukur',
    'az-instrument': 'az-instrument-indonesia',
    'sanwa-multimeter': 'sanwa-digital-multimeter-cd800a',
}

def write_redirect(path, target):
    html = f'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ProIndustri</title>
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://proindustri.com/{target}">
<meta http-equiv="refresh" content="0; url=https://proindustri.com/{target}">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230F1B2D'/><text x='50' y='68' font-size='50' font-weight='900' fill='white' text-anchor='middle'>P</text></svg>">
</head>
<body style="margin:0;font-family:sans-serif;background:#f8f9fa;display:flex;align-items:center;justify-content:center;min-height:100vh">
<div style="text-align:center;padding:40px">
<h1 style="font-size:22px;color:#0F1B2D">Halaman dipindahkan</h1>
<p style="color:#666">Anda akan dialihkan ke halaman terbaru secara otomatis...</p>
<p style="margin-top:24px"><a href="https://proindustri.com/{target}" style="display:inline-block;background:#25D366;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700">Lanjut ke halaman baru →</a></p>
</div>
<script>window.location.replace("https://proindustri.com/{target}");</script>
</body>
</html>'''
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)

# 1. Redirect untuk semua 68 slug di /jual/ → root
for s in slugs:
    write_redirect(f'public/jual/{s}.html', s)

# 2. Legacy alias: update to redirect to root
for old, new in legacy.items():
    write_redirect(f'public/jual/{old}.html', new)

print(f'Generated {len(slugs)} redirect files in public/jual/')
print(f'Updated {len(legacy)} legacy alias files')
print(f'Total: {len(slugs)} slugs in root, {len(slugs)} redirects in jual/')
