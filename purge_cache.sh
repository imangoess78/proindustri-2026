#!/bin/bash
# Purge Cloudflare cache for proindustri.com
TOKEN=$(grep '^oauth_token' ~/.wrangler/config/default.toml | sed 's/oauth_token = "//;s/"$//')
ZONE_ID="2a62de8d1e33b21d8e5922d301c667e6"

echo "token length: ${#TOKEN}, prefix: ${TOKEN:0:6}"

# Verify zone access
echo "=== Zone check ==="
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID" | python3 -c "import sys,json; d=json.load(sys.stdin); print('success:', d['success'], '| name:', d['result'][0]['name'] if d.get('result') else d.get('errors'))"

# Purge entire cache
echo "=== Purge cache ==="
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything":true}' | python3 -m json.tool
