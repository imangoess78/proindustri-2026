#!/usr/bin/env python3
"""Find which articles reference broken product/artikel slugs, and full default articles list."""
import json, re, subprocess

def d1_query(sql):
    r = subprocess.run(
        ['npx','wrangler','d1','execute','proindustri-db','--remote','--json','--command',sql],
        capture_output=True, text=True, timeout=120, cwd='/home/ubuntu/proindustri-2026'
    )
    try:
        data = json.loads(r.stdout.strip())
        return data[0].get('results', []) if isinstance(data, list) and data else []
    except Exception as e:
        return f'ERR: {r.stdout[:300]} {e}'

broken_produk = ['compressor-angin-24l-1hp','total-station','jangka-sorong-digital','mesin-las-listrik-mma-200a-inverter','mikrometer-digital','mesin-gerinda-tangan-4-850w','mesin-bor-tangan-industri-800w','mesin-bor-impact-18v-cordless','safety-helmet-industri-proyek-earplug-set','sarung-tangan-las-kulit-welding-gloves']
broken_artikel = ['cara-memilih-power-tools-untuk-bisnis','perbedaan-mesin-bor-impact-dan-rotary-hammer','power-tools-cordless-vs-kabel-mana-lebih-hemat','panduan-memilih-mesin-gerinda-untuk-industri']

rows = d1_query("SELECT slug, title FROM articles")
print('=== Artikel yang mereferensikan produk slug broken ===')
for r in rows:
    hits = []
    content = d1_query(f"SELECT content FROM articles WHERE slug='{r['slug']}'")
    c = content[0]['content'] if content and content[0].get('content') else ''
    for p in broken_produk:
        if p in c:
            hits.append(p)
    for a in broken_artikel:
        if ('/artikel/' + a) in c:
            hits.append('ART:' + a)
    if hits:
        print(f"  {r['slug']} -> {hits}")

print()
print('=== Cek produk real untuk generic slug: safety-helmet, sarung-tangan las, total-station ===')
q = "SELECT slug, name FROM products WHERE slug LIKE '%helmet%' OR slug LIKE '%gloves%' OR slug LIKE '%welding%' OR slug LIKE '%safety%' LIMIT 10"
for r in d1_query(q):
    print(f"  {r['slug']} | {r['name'][:50]}")
