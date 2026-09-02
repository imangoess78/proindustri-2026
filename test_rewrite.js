// Test rewriteContentLinks
const LEGACY_PRODUKT = {
  'compressor-angin-24l-1hp': '/kategori/mesin-tools',
  'total-station': '/kategori/alat-survey',
  'jual-imex-lar-32-auto-level': '/produk/imex-lar-32-magnification-auto-level',
  'jual-alpha-geo-r1-robotic-total-station': '/produk/alpha-geo-r1-robotic-total-station',
  'jual-sanwa-rd701-digital-multimeter': '/produk/sanwa-rd701-digital-multimeter-multitester',
};

function rewriteContentLinks(html) {
  if (!html) return html;
  let out = html.replace(/href="\/product\//gi, 'href="/produk/');
  out = out.replace(/href="\/produk\/([^"#?]+)"/gi, (m, slug) => {
    const target = LEGACY_PRODUKT[slug] || LEGACY_PRODUKT[slug.replace(/^jual-/, '')];
    return target ? `href="${target}"` : m;
  });
  return out;
}

const tests = [
  // Kelas A: generic slug → category
  ['<a href="/produk/compressor-angin-24l-1hp">compressor</a>',
   '<a href="/kategori/mesin-tools">compressor</a>'],
  // Kelas B: /product/ → /produk/ + alias
  ['<a href="/product/jual-imex-lar-32-auto-level">Imex</a>',
   '<a href="/produk/imex-lar-32-magnification-auto-level">Imex</a>'],
  // Legacy jual- inside /produk/
  ['<a href="/produk/jual-imex-lar-32-auto-level">Imex</a>',
   '<a href="/produk/imex-lar-32-magnification-auto-level">Imex</a>'],
  // Unchanged if not in map
  ['<a href="/produk/alpha-geo-r1-robotic-total-station">Alpha</a>',
   '<a href="/produk/alpha-geo-r1-robotic-total-station">Alpha</a>'],
  // Multiple links
  ['<a href="/product/jual-lutron-lx-108">Lutron</a> <a href="/produk/compressor-angin-24l-1hp">Comp</a>',
   '<a href="/produk/imex-lar-32-magnification-auto-level">Lutron</a> <a href="/kategori/mesin-tools">Comp</a>'],
];

let pass = 0, fail = 0;
for (const [input, expected] of tests) {
  const result = rewriteContentLinks(input);
  if (result === expected) {
    console.log('✓', input.slice(0, 60));
    pass++;
  } else {
    console.log('✗', input.slice(0, 60));
    console.log('  expected:', expected);
    console.log('  got:     ', result);
    fail++;
  }
}
console.log(`\n${pass}/${tests.length} passed`);