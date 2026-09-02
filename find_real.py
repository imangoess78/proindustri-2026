#!/usr/bin/env python3
"""Find real product slugs for the broken article links."""
import json, subprocess

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

# broken /product/ links (jual- prefix) - find real products by keyword
queries = {
    'jual-imex-lar-32': "SELECT slug, name FROM products WHERE slug LIKE '%imex%lar%'",
    'jual-alpha-geo-r1': "SELECT slug, name FROM products WHERE slug LIKE '%alpha-geo-r1%'",
    'jual-sanwa-rd701': "SELECT slug, name FROM products WHERE slug LIKE '%sanwa%rd701%'",
    'jual-lutron-lx-108': "SELECT slug, name FROM products WHERE slug LIKE '%lutron-lx-108%'",
    'jual-uni-t-ut352': "SELECT slug, name FROM products WHERE slug LIKE '%ut352%'",
    'jual-kyoritsu-2009r': "SELECT slug, name FROM products WHERE slug LIKE '%2009r%'",
    'jual-fluke-62-max': "SELECT slug, name FROM products WHERE slug LIKE '%fluke-62-max%'",
    'jual-cem-dt-172': "SELECT slug, name FROM products WHERE slug LIKE '%cem-dt-172%'",
    'jual-mileseey-mc998': "SELECT slug, name FROM products WHERE slug LIKE '%mc998%'",
    # generic /produk/ links
    'compressor-angin-24l': "SELECT slug, name FROM products WHERE slug LIKE '%compressor%' AND slug LIKE '%24l%'",
    'total-station': "SELECT slug, name FROM products WHERE slug LIKE '%total-station%' LIMIT 3",
    'jangka-sorong': "SELECT slug, name FROM products WHERE slug LIKE '%caliper%' LIMIT 3",
    'mesin-las-mma-200': "SELECT slug, name FROM products WHERE slug LIKE '%welding%' OR slug LIKE '%mma%' LIMIT 3",
    'mikrometer': "SELECT slug, name FROM products WHERE slug LIKE '%micrometer%' LIMIT 3",
    'gerinda-850w': "SELECT slug, name FROM products WHERE slug LIKE '%grinder%' LIMIT 3",
    'bor-tangan': "SELECT slug, name FROM products WHERE slug LIKE '%drill%' LIMIT 3",
    'bor-impact-18v': "SELECT slug, name FROM products WHERE slug LIKE '%impact%drill%' LIMIT 3",
}

for label, sql in queries.items():
    rows = d1_query(sql)
    print(f'=== {label} ===')
    if isinstance(rows, str):
        print('  ', rows)
    else:
        for r in rows[:3]:
            print(f"  {r['slug']} | {r['name'][:60]}")
        if not rows:
            print('   (none)')
