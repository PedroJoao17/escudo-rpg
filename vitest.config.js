import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      { test: { name: 'domain-api', environment: 'node', include: ['packages/**/*.test.js', 'apps/api/test/*.test.js'] } },
      { test: { name: 'web', environment: 'jsdom', include: ['apps/web/test/*.test.jsx'], setupFiles: ['apps/web/test/setup.js'] } },
    ],
  },
});
