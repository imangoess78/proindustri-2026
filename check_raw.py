#!/usr/bin/env python3
"""Check raw versions API response."""
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
            return r.read().decode()[:2000]
    except urllib.error.HTTPError as e:
        return f'HTTP {e.code}: {e.read().decode()[:1000]}'

print('=== Deployments ===')
print(api_raw('GET', f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/proindustri/deployments'))
print()
print('=== Versions ===')
print(api_raw('GET', f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/proindustri/versions'))