#!/usr/bin/env python3
"""
ProIndustri — Local AliExpress Scraper
======================================
Jalankan di PC/laptop Indonesia (IP residential — lolos anti-bot Akamai).

Cara pakai:
  python3 scrape_proindustri.py                      # proses semua URL pending di antrian
  python3 scrape_proindustri.py <URL_aliexpress>     # scrape 1 URL langsung + upload
  python3 scrape_proindustri.py --urls file.txt      # proses daftar URL dari file

Alur:
  1. Ambil URL dari antrian website (atau argumen CLI)
  2. Scrape judul, harga, gambar, deskripsi dari halaman AliExpress
  3. Upload gambar ke R2 via API
  4. Simpan produk ke D1 via API
  5. Tandai antrian selesai

Dependency: pip install requests beautifulsoup4
"""
import argparse
import json
import re
import sys
import time
import urllib.parse

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("ERROR: install dulu dependency:\n  pip install requests beautifulsoup4")
    sys.exit(1)

# ═══ KONFIGURASI ═══
API_BASE = "https://proindustri.imangoess78.workers.dev/api"
ADMIN_TOKEN = "GAN" + "TI_DE" + "NGAN_PIN"  # GANTI: sama dengan ADMIN_PIN di wrangler (wrangler secret put ADMIN_PIN)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Referer": "https://www.aliexpress.com/",
}

RUPIAH_PER_USD = 16000  # kurs konversi harga (bisa disesuaikan)


def fetch_html(url, timeout=30):
    """Fetch halaman AliExpress. Di local residential IP biasanya lolos."""
    for attempt in range(3):
        try:
            r = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
            if r.status_code == 200 and len(r.text) > 10000:
                return r.text
            # Anti-bot page — coba dengan cookie/tunggu
            time.sleep(3)
        except Exception as e:
            print(f"  [retry {attempt+1}] {e}")
            time.sleep(2)
    return None


def extract_product(html, url):
    """Ekstrak data produk dari HTML AliExpress."""
    soup = BeautifulSoup(html, "html.parser")

    # ── Judul ──
    title = None
    # Try meta og:title
    og = soup.find("meta", {"property": "og:title"})
    if og and og.get("content"):
        title = og["content"].strip()
    if not title:
        t = soup.find("h1")
        if t:
            title = t.get_text(strip=True)
    if not title:
        # JSON-LD
        for s in soup.find_all("script", {"type": "application/ld+json"}):
            try:
                data = json.loads(s.string or "")
                if data.get("name"):
                    title = data["name"]
                    break
            except Exception:
                pass
    if not title:
        mt = soup.find("title")
        title = mt.get_text(strip=True) if mt else "Produk tanpa judul"
    # Bersihkan suffix AliExpress
    title = re.sub(r"\s*-\s*AliExpress\s*$", "", title).strip()

    # ── Harga ──
    price = None
    # JSON-LD price
    for s in soup.find_all("script", {"type": "application/ld+json"}):
        try:
            data = json.loads(s.string or "")
            if isinstance(data, dict) and data.get("offers", {}).get("price"):
                price = data["offers"]["price"]
                break
        except Exception:
            pass
    if not price:
        # Regex dari window.runParams / _init_data_
        m = re.search(r'"formattedPrice"\s*:\s*"([\d,.]+)"', html)
        if m:
            price = m.group(1).replace(",", "")
        else:
            m2 = re.search(r'\"price\"\s*:\s*\"?([\d.]+)', html)
            if m2:
                price = m2.group(1)

    # ── Gambar utama ──
    image = None
    og_img = soup.find("meta", {"property": "og:image"})
    if og_img and og_img.get("content"):
        image = og_img["content"].split("//")[-1]  # buang protocol
        if not image.startswith("http"):
            image = "https://" + image
    if not image:
        m = re.search(r'"(https?://[^"]*aliexpress[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"', html)
        if m:
            image = m.group(1)
    if image and "ae01.alicdn.com" in image or image and "alicdn.com" in image:
        # Tinggikan kualitas gambar
        image = re.sub(r'_\d+x\d+[^.]*', '_640x640Q100', image) if "_" in image else image

    # ── Deskripsi ──
    desc = ""
    for s in soup.find_all("script", {"type": "application/ld+json"}):
        try:
            data = json.loads(s.string or "")
            if isinstance(data, dict) and data.get("description"):
                desc = data["description"][:3000]
                break
        except Exception:
            pass
    if not desc:
        d = soup.find("div", {"class": re.compile(r"detail|description", re.I)})
        if d:
            desc = d.get_text(" ", strip=True)[:3000]

    return {"title": title, "price_usd": price, "image_url": image, "description": desc}


def upload_image(image_url):
    """Download gambar dari CDN AliExpress lalu upload ke R2 via API."""
    if not image_url:
        return None
    try:
        r = requests.get(image_url, headers={"User-Agent": HEADERS["User-Agent"]}, timeout=30)
        if r.status_code != 200:
            print(f"  ⚠ gambar gagal di-download: HTTP {r.status_code}")
            return None
        ext = "jpg"
        ct = r.headers.get("Content-Type", "")
        if "png" in ct: ext = "png"
        elif "webp" in ct: ext = "webp"
        fname = f"prod-{int(time.time())}.{ext}"
        files = {"image": (fname, r.content, f"image/{ext}")}
        resp = requests.post(
            f"{API_BASE}/images/upload",
            files=files,
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
            timeout=60,
        )
        if resp.status_code == 200:
            return resp.json().get("url")
        print(f"  ⚠ upload gagal: {resp.status_code} {resp.text[:100]}")
    except Exception as e:
        print(f"  ⚠ upload error: {e}")
    return None


def create_product(data):
    """Simpan produk ke D1 via API."""
    price_rp = 0
    if data.get("price_usd"):
        try:
            price_rp = int(float(str(data["price_usd"]).replace(",", "")) * RUPIAH_PER_USD)
        except Exception:
            price_rp = 0
    payload = {
        "title": data["title"],
        "description": data.get("description", ""),
        "price": price_rp,
        "image_url": data.get("image_url", ""),
        "source_url": data.get("source_url", ""),
        "category_id": 5,  # default "Lainnya"
        "stock": 0,
    }
    resp = requests.post(
        f"{API_BASE}/products",
        json=payload,
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
        timeout=30,
    )
    if resp.status_code == 200:
        return resp.json()
    print(f"  ⚠ simpan produk gagal: {resp.status_code} {resp.text[:150]}")
    return None


def process_url(url):
    """Proses 1 URL: scrape → upload → simpan."""
    print(f"\n🔍 Scraping: {url}")
    html = fetch_html(url)
    if not html:
        print("  ✗ Gagal fetch (anti-bot?). Coba buka URL di browser dulu, atau run lagi.")
        return False

    data = extract_product(html, url)
    print(f"  ✓ Judul: {data['title'][:80]}")
    print(f"  ✓ Harga USD: {data['price_usd']}")
    if data["image_url"]:
        print(f"  ✓ Gambar: {data['image_url'][:80]}")
        img = upload_image(data["image_url"])
        if img:
            data["image_url"] = img
            print(f"  ✓ Upload gambar OK")
    else:
        print("  ⚠ Tidak ada gambar ditemukan")

    data["source_url"] = url
    result = create_product(data)
    if result:
        print(f"  ✅ Produk tersimpan! /produk/{result['slug']}")
        return True
    return False


def main():
    parser = argparse.ArgumentParser(description="ProIndustri AliExpress scraper")
    parser.add_argument("url", nargs="?", help="URL produk AliExpress")
    parser.add_argument("--urls", help="File berisi daftar URL (1 per baris)")
    parser.add_argument("--token", default=None, help="Admin token")
    args = parser.parse_args()
    global ADMIN_TOKEN
    if args.token:
        ADMIN_TOKEN = args.token

    urls = []
    if args.url:
        urls.append(args.url)
    elif args.urls:
        with open(args.urls) as f:
            urls = [l.strip() for l in f if l.strip()]

    # Jika tidak ada argumen → ambil dari antrian website
    if not urls:
        print("📥 Ambil URL pending dari antrian website...")
        resp = requests.get(f"{API_BASE}/scrape-queue", headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}, timeout=30)
        if resp.status_code != 200:
            print(f"  ✗ Gagal ambil antrian: {resp.status_code}")
            sys.exit(1)
        tasks = resp.json().get("tasks", [])
        if not tasks:
            print("  (antrian kosong — tidak ada URL pending)")
            return
        ok = 0
        for task in tasks:
            if process_url(task["source_url"]):
                ok += 1
                requests.put(
                    f"{API_BASE}/scrape-queue/{task['id']}",
                    json={"status": "done"},
                    headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
                    timeout=15,
                )
        print(f"\n🏁 Selesai: {ok}/{len(tasks)} produk berhasil di-scrape.")
        return

    # Mode 1 URL langsung
    for u in urls:
        process_url(u)


if __name__ == "__main__":
    main()
