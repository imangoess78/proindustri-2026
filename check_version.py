#!/usr/bin/env python3
"""Check version details: what worker code is actually live."""
import json, re, urllib.request, urllib.error

cfg = open('/home/ubuntu/.wrangler/config/default.toml').read()
token = re.search(r'oauth_token\s*=\s*"([^"]+)"', cfg).group(1)
ACCOUNT_ID = '42a938ce4908ae486303fcdc63b09fd2'

def api_raw(method, url, data=None):
    req = urllib.request.Request(url, method=method)
    req.add_header('Authorization', 'Bearer ' + token)
    req.add_header('Content-Type', 'application/json')
    body = json.dumps(data).encode() if data is not None else None
    try:
        with urllib.request.urlopen(req, body) as r:
            return r.read().decode()[:3000]
    except urllib.error.HTTPError as e:
        return f'HTTP {e.code}: {e.read().decode()[:1000]}'

# Check the live version
print('=== Version b6d34f55 (live) ===')
print(api_raw('GET', f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/proindustri/versions/b6d34f55-1055-4951-8bdb-1577841e10fa'))

print()
print('=== Version 8a73ad68 (previous) ===')
print(api_raw('GET', f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/proindustri/versions/8a73ad68-b59d-4be0-a47f-0f9b774d3c49'))