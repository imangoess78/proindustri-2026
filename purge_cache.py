#!/usr/bin/env python3
"""Purge Cloudflare cache for proindustri.com using wrangler OAuth token."""
import json, re, subprocess, urllib.request

# Read token from wrangler config
cfg = open('/home/ubuntu/.wrangler/config/default.toml').read()
m = re.search(r'oauth_token\s*=\s*"([^"]+)"', cfg)
token = m.group(1)
ZONE_ID = '2a62de8d1e33b21d8e5922d301c667e6'

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

# 1. Zone check
z = api('GET', f'https://api.cloudflare.com/client/v4/zones/{ZONE_ID}')
rz = z.get('result') or {}
print('Zone check success:', z.get('success'), '|', rz.get('name', z.get('errors')))

# 2. Purge everything
p = api('POST', f'https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/purge_cache', {'purge_everything': True})
print('Purge success:', p.get('success'))
print('Errors:', p.get('errors'))
print('Messages:', p.get('messages'))
