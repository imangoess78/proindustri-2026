#!/usr/bin/env python3
"""Query real product/artikel/kategori slugs for mapping."""
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
        return f'ERR: {r.stdout[:500]} {e}'

# Real product slugs - check those similar to the 404 ones
print('=== Products similar to 404 product slugs ===')
q = """SELECT slug, name, category FROM products WHERE active=1 AND (
  slug LIKE '%compressor%' OR slug LIKE '%total-station%' OR slug LIKE '%jangka%' 
  OR slug LIKE '%las%' OR slug LIKE '%mikrometer%' OR slug LIKE '%gerinda%'
  OR slug LIKE '%bor%' OR slug LIKE '%sarung-tangan%' OR slug LIKE '%safety%'
  OR slug LIKE '%sanwa%' OR slug LIKE '%lutron%' OR slug LIKE '%uni-t%' OR slug LIKE '%fluke%'
  OR slug LIKE '%mileseey%' OR slug LIKE '%kyoritsu%' OR slug LIKE '%cem-dt%' OR slug LIKE '%imex%' OR slug LIKE '%alpha-geo%'
)"""
rows = d1_query(q)
for r in rows:
    print(f"  {r['slug']} | {r.get('name','')[:50]} | {r.get('category','')}")
print(f"  total: {len(rows)}")

print()
print('=== Kategori slugs ===')
q2 = "SELECT slug, name FROM categories WHERE active=1"
rows2 = d1_query(q2)
for r in rows2:
    print(f"  {r['slug']} | {r.get('name','')[:40]}")
print(f"  total: {len(rows2)}")

print()
print('=== Artikel: check 404 artikel slugs ===')
q3 = "SELECT slug, title FROM articles"
rows3 = d1_query(q3)
art_slugs_404 = ['cara-memilih-power-tools-untuk-bisnis','perbedaan-mesin-bor-impact-dan-rotary-hammer','jual-cem-dt-172-temperature-humidity-hygrometer-data-logger','panduan-memilih-mesin-gerinda-untuk-industri']
print('All artikel slugs:')
for r in rows3:
    mark = ' <-- 404 target' if r['slug'] in art_slugs_404 else ''
    print(f"  {r['slug']}{mark}")
print(f"  total: {len(rows3)}")
