#!/usr/bin/env python3
"""Full picture: all 404 artikel URLs & whether they exist in DB, + which articles link to broken produk URLs."""
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
        return f'ERR: {r.stdout[:400]} {e}'

# 1. Check which artikel slugs from audit exist
art_slugs = [
 'cara-memilih-power-tools-untuk-bisnis',
 'perbedaan-mesin-bor-impact-dan-rotary-hammer',
 'jual-cem-dt-172-temperature-humidity-hygrometer-data-logger',
 'compressor-angin-jenis-fungsi-cara-memilih',
 'panduan-memilih-mesin-bor-industri-yang-tepat',
 'power-tools-cordless-vs-kabel-mana-lebih-hemat',
 'panduan-memilih-mesin-gerinda-untuk-industri',
 'jenis-alat-ukur-industri-fungsi',
]
print('=== Artikel slug check (semua artikel di DB) ===')
rows = d1_query("SELECT slug FROM articles")
db_slugs = {r['slug'] for r in rows}
print('Total artikel di DB:', len(db_slugs))
for s in art_slugs:
    print(f"  {'EXISTS' if s in db_slugs else 'MISSING'} | {s}")

# 2. Cari artikel yang kontennya mengandung link ke /produk/ dan /product/ yang mungkin broken
print()
print('=== Artikel yang mengandung link /product/ (legacy prefix) ===')
rows2 = d1_query("SELECT slug, title FROM articles WHERE content LIKE '%/product/%' LIMIT 20")
for r in rows2:
    print(f"  {r['slug']}")
print('total:', len(rows2))

print()
print('=== Artikel yang mengandung link /produk/ ===')
rows3 = d1_query("SELECT slug FROM articles WHERE content LIKE '%/produk/%' LIMIT 40")
for r in rows3:
    print(f"  {r['slug']}")
print('total:', len(rows3))
