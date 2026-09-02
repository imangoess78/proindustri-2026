// Test: load worker and call renderPost with mock env
import { renderPost } from './worker/pages.js';

// Mock D1
const mockRows = {};
const mockDB = {
  prepare(sql) {
    return {
      bind(...args) {
        return {
          first: async () => {
            if (sql.includes('FROM articles WHERE slug=?')) {
              const slug = args[0];
              return mockRows[slug] || null;
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
  console.log('OK, html length:', r ? r.html.length : 'null');
} catch (e) {
  console.error('ERROR:', e.message);
  console.error(e.stack.split('\n').slice(0, 8).join('\n'));
}
