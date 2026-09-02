// Test with an article that has <title> in content (simulating TiaraVib import)
import { renderPost } from './worker/pages.js';

const mockDB = {
  prepare(sql) {
    return {
      bind(...args) {
        return {
          first: async () => {
            if (sql.includes('FROM articles WHERE slug=?')) {
              if (args[0] === 'test-slug') {
                return {
                  id: 'test-1',
                  slug: 'test-slug',
                  title: 'Test Article',
                  category: 'Blog',
                  content: '<html><head><title>Test Article</title></head><body><p>This is a test article with <a href="/product/jual-imex-lar-32-auto-level">Imex</a> link.</p></body></html>',
                  image: '',
                  status: 'Published',
                  views: 0,
                  created_at: '2025-01-01',
                  updated_at: '2025-01-01',
                };
              }
              return null;
            }
            return null;
          },
          run: async () => ({ success: true }),
          all: async () => ({ results: [] }),
        };
      },
    };
  },
};
const env = { DB: mockDB };

try {
  const r = await renderPost(env, 'test-slug');
  if (r) {
    console.log('OK, html length:', r.html.length);
    // Check for <title> count
    const titleCount = (r.html.match(/<title>/g) || []).length;
    console.log('Title count:', titleCount);
    // Check for /product/ (should be rewritten)
    const productLinks = (r.html.match(/\/product\//g) || []).length;
    console.log('/product/ links:', productLinks);
    // Check for rewritten link
    const hasRewritten = r.html.includes('imex-lar-32-magnification-auto-level');
    console.log('Legacy slug rewritten:', hasRewritten);
  } else {
    console.log('null result');
  }
} catch (e) {
  console.error('ERROR:', e.message);
  console.error(e.stack.split('\n').slice(0, 10).join('\n'));
}