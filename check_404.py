#!/usr/bin/env python3
"""Check which 404 slugs exist in the D1 DB."""
import json, re, subprocess, urllib.request, urllib.error

cfg = open('/home/ubuntu/.wrangler/config/default.toml').read()
token = re.search(r'oauth_token\s*=\s*"([^"]+)"', cfg).group(1)
ACCOUNT_ID = '42a938ce4908ae486303fcdc63b09fd2'
DB_ID = 'f126ad23-5f75-4f96-850a-d25a0b564bb9'

def api(method, url, data=None):
    req = urllib.request.Request(url, method=method)
    req.add_header('Authorization', 'Bearer ' + token)
    req.add_header('Content-Type', 'application/json')
    body = json.dumps(data).encode() if data is not None else None
    try:
        with urllib.request.urlopen(req, body) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

# Query products with these slugs
product_slugs = ['compressor-angin-24l-1hp','total-station','jangka-sorong-digital','mesin-las-listrik-mma-200a-inverter','mikrometer-digital','mesin-gerinda-tangan-4-850w','mesin-bor-tangan-industri-800w','mesin-bor-impact-18v-cordless']
artikel_slugs = ['cara-memilih-power-tools-untuk-bisnis','perbedaan-mesin-bor-impact-dan-rotary-hammer','jual-cem-dt-172-temperature-humidity-hygrometer-data-logger']
kategori_slugs = ['mesin-industri','equipment','alat-bengkel','power-tools']

# Use wrangler d1 execute for queries
def d1_query(sql):
    try:
        r = subprocess.run(
            ['npx','wrangler','d1','execute','proindustri-db','--remote','--json','--command',sql],
            capture_output=True, text=True, timeout=120, cwd='/home/ubuntu/proindustri-2026'
        )
        out = r.stdout.strip()
        # parse JSON array
        data = json.loads(out)
        return data
    except Exception as e:
        return f'ERR: {e}'

print('=== PRODUCTS with those slugs ===')
q = "SELECT slug, name, active FROM products WHERE slug IN ('" + "','".join(product_slugs) + "')"
print(json.dumps(d1_query(q), indent=1)[:3000])
