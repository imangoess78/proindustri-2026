# SEO Audit — Honeywell Gas Detection / XNX Topical Cluster

## Current State

| Item | Status |
|------|--------|
| Framework | CF Worker + D1 + R2 + ASSETS |
| Articles | 38 published (Indonesian, mostly Alat Survey / Panduan Produk) |
| Products | 1,121 in DB (no Honeywell XNX products) |
| Existing XNX LPs | 3 root-level typo LPs (~890 words, keyword-stuffed titles) |
| Sitemap | Auto-generated from DB articles + categories |
| Robots.txt | Clean, AI bots allowed, sitemap referenced |
| Schema | Article + FAQPage auto (renderPost), Product auto (only if price present) |
| Canonical | Auto-set per page |
| Internal linking | Article → related articles (auto), product links (manual in content) |

## Problems Found

### 1. Existing XNX Typo LPs (thin content)
- `/xnnx-honeywell-analytics-xnx-gas-detector-calibration-machine` — 892 words, keyword-stuffed
- `/xnx-xnx-honeywell-detector` — 876 words, keyword-stuffed
- `/xnx-xnx-honeywell-analysis` — not checked but likely similar
- These are typo keyword pages (xnnx, xnx xnx) that the prompt explicitly forbids creating
- **Fix**: 301 redirect to canonical cluster pages

### 2. No Honeywell XNX Content
- Zero articles about XNX, gas detection, calibration, or Honeywell products
- Missed topical authority opportunity for "Gas Detection" keywords

### 3. /produk/ Cannot Serve XNX Pages
- `/produk/{slug}` route requires D1 product lookup → 301 redirect if not found
- Cannot use `/produk/` path for non-DB product pages
- Solution: `/artikel/{slug}` for all 6 cluster pages (consistent with existing article architecture)

### 4. No Category for Gas Detection
- Articles use existing categories: "Panduan Produk", "Gas Detection" (new)
- Adding "Gas Detection" category for all 6 articles enables related article grouping

### 5. Image Gap
- No Honeywell XNX product images in R2
- Use own gas-detector product images from catalog (Bosean, AZ Instrument, etc.) as illustrative

### 6. No Internal Linking Cluster
- No existing articles link to each other or to home/produk
- Fix: cross-link all 6 cluster pages + link to /produk/ + /shop?q=gas+detector

## Cannibalization Risks

| URL | Primary Keyword | Risk |
|-----|----------------|------|
| /xnnx-honeywell-analytics-xnx-gas-detector-calibration-machine | xnnx honeywell (typo) | HIGH — redirect to /artikel/xnx-honeywell-gas-detector-calibration/ |
| /xnx-xnx-honeywell-detector | xnx xnx honeywell (typo) | HIGH — redirect to /artikel/honeywell-xnx-gas-detector/ |
| /cari/xnx-honeywell-gas-detector | xnx honeywell gas detector | LOW — generic LP, will redirect to /shop?q= if product exists; no product exists so serves generic LP |

## GEO / AEO Gaps

- No Quick Answer blocks in existing articles
- No Key Takeaways sections
- No FAQPage schema (auto-generated from h3+p, but no existing articles use this pattern)
- No entity definitions at top of articles
- No contextual relationship mapping

## Recommended Fixes

1. ✅ Create 6 cluster articles at `/artikel/...` (2000+ words each, English, with Quick Answer + Key Takeaways + FAQ)
2. ✅ 301 redirect existing typo LPs to cluster articles
3. ✅ Add "Gas Detection" category
4. ✅ Cross-link all cluster pages
5. ✅ Update homepage to link to cluster
6. ✅ Verify sitemap includes all new articles