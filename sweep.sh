#!/bin/bash
for u in "/" "/artikel" "/tentang-kami" "/faq" "/kontak" "/sitemap" "/shop" "/produk"; do
  echo "=== $u ==="
  h2=$(curl -s "https://proindustri.com$u" | grep -o "<h2[^>]*>" | wc -l)
  sec=$(curl -sI "https://proindustri.com$u" | grep -c "strict-transport-security")
  echo "  H2: $h2 | SEC: $sec"
done