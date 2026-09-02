#!/usr/bin/env python3
"""Debug: dump raw content sample from an article with /product/ links."""
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

rows = d1_query("SELECT slug FROM articles WHERE content LIKE '%/product/%' OR content LIKE '%compressor-angin-24l%'")
print('found articles:', [r['slug'] for r in rows])

res = d1_query("SELECT content FROM articles WHERE slug='panduan-lengkap-alat-survey-konstruksi'")
if res:
    c = res[0]['content']
    print('LEN:', len(c))
    idx = c.find('/product/')
    print('first /product/ at:', idx)
    if idx > 0:
        print('--- CONTEXT ---')
        print(repr(c[max(0,idx-100):idx+200]))
else:
    print('article not found')
