#!/bin/bash
TOKEN=*** '^oauth_token' ~/.wrangler/config/default.toml | sed 's/oauth_token = "//;s/"$//')
echo "=== Accounts ==="
curl -s -H "Authorization: Bearer *** \
  "https://api.cloudflare.com/client/v4/accounts" > /tmp/accounts.json
python3 -c "
import json
d = json.load(open('/tmp/accounts.json'))
for a in d.get('result', []):
    print(f'ACCOUNT: {a[\"id\"]} {a[\"name\"]}')
"
ACCOUNT_ID=*** -c "import json; print(json.load(open('/tmp/accounts.json'))['result'][0]['id'])" 2>/dev/null)
echo "ACCOUNT_ID=$ACCOUNT_ID"
echo ""
echo "=== Worker versions ==="
curl -s -H "Authorization: Bearer *** \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/proindustri/versions" > /tmp/versions.json
python3 -c "
import json
d = json.load(open('/tmp/versions.json'))
print('success:', d.get('success'))
for v in d.get('result', {}).get('versions', [])[:3]:
    print(f'  version_id={v.get(\"id\")} created={v.get(\"created_on\")}')
"
echo ""
echo "=== Try purge cache via API (cache_purge scope needed) ==="
ZONE_ID="2a62de8d1e33b21d8e5922d301c667e6"
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer *** \
  -H "Content-Type: application/json" \
  -d '{"purge_everything":true}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('purge success:', d.get('success'), '| errors:', d.get('errors',[]))"