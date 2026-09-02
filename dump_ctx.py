#!/usr/bin/env python3
"""Dump exact /product/ and broken /produk/ link contexts from articles."""
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

broken = ['/product/','/produk/compressor-angin-24l-1hp','/produk/total-station','/produk/jangka-sorong-digital','/produk/mesin-las-listrik-mma-200a-inverter','/produk/mikrometer-digital','/produk/mesin-gerinda-tangan-4-850w','/produk/mesin-bor-tangan-industri-800w','/produk/mesin-bor-impact-18v-cordless','/produk/safety-helmet-industri-proyek-earplug-set','/produk/sarung-tangan-las-kulit-welding-gloves']

rows = d1_query("SELECT slug FROM articles")
for r in rows:
    slug = r['slug']
    res = d1_query(f"SELECT content FROM articles WHERE slug='{slug}'")
    c = res[0]['content'] if res and res[0].get('content') else ''
    for pat in broken:
        for m in re.finditer(re.escape(pat) + r'[^"\s]*', c):
            full = m.group(0)
            # find surrounding context (the <a ...>...</a>)
            start = max(0, c.rfind('<a ', 0, m.start()))
            end = c.find('</a>', m.end())
            ctx = c[start:end+4] if start >= 0 and end > 0 else full
            print(f"{slug}\n  {ctx[:200]}")
