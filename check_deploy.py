#!/usr/bin/env python3
"""Check live worker deployment & versions via API (fixed)."""
import json, re, urllib.request, urllib.error

cfg = open('/home/ubuntu/.wrangler/config/default.toml').read()
token = re.search(r'oauth_token\s*=\s*"([^"]+)"', cfg).group(1)
ACCOUNT_ID = '42a938ce4908ae486303fcdc63b09fd2'

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

# List all versions
vd = api('GET', f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/proindustri/versions')
print('Versions success:', vd.get('success'))
vs = (vd.get('result') or {}).get('versions', [])
for v in vs[:5]:
    print('---')
    print('id:', v.get('id'))
    print('created:', v.get('created_on'))
    meta = v.get('metadata', {})
    print('has assets binding:', bool(meta.get('assets')))
    if meta.get('assets'):
        print('  assets config:', json.dumps(meta['assets'])[:200])
    print('bindings:', [b.get('name') for b in meta.get('bindings', []) if b.get('name')])
