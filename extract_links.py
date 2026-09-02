#!/usr/bin/env python3
"""Extract all /product/ and /produk/ links from article content to build rewrite map."""
import json, re, subprocess
from collections import Counter

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

rows = d1_query("SELECT slug, content FROM articles")
links = Counter()
for r in rows:
    content = r.get('content','')
    for m in re.finditer(r'href="(/product/[^"]+|/produk/[^"]+)"', content):
        links[m.group(1)] += 1

print("=== Semua link /product/ dan /produk/ di konten artikel (URL | count) ===")
for url, c in sorted(links.items()):
    print(f"  {url} | {c}")
