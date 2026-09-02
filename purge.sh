#!/bin/bash
# Fetch token from wrangler config - use grep to avoid shell interpolation issues
TOKEN=*** 'oauth_token' ~/.wrangler/config/default.toml | sed 's/oauth_token = "//;s/"$//')
ZONE_ID="2a62de8d1e33b21d8e5922d301c667e6"

echo "=== Zone check ==="
curl -s -H "Authorization: Bearer *** \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('success:', d.get('success'))
if d.get('result'):
    print('zone:', d['result'][0]['name'])
"

echo ""
echo "=== Purge cache ==="
RESULT=*** -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer *** \
  -H "Content-Type: application/json" \
  -d '{"purge_everything":true}')

echo "Response: $RESULT"
echo "$RESULT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('success:', d.get('success'))
if d.get('errors'):
    print('errors:', d['errors'])
"