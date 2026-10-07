import js from '@eslint/js';
import globals from 'globals';
import next from 'eslint-config-next/core-web-vitals';

export default [
  { ignores: ['**/node_modules/**', '**/.next/**', 'coverage/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  { files: ['**/*.{js,mjs,jsx}'], languageOptions: { globals: { ...globals.node, ...globals.browser } }, rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } },
  ...next.map((config) => ({ ...config, files: ['apps/web/**/*.{js,mjs,jsx}'] })),
  { files: ['apps/web/**/*.{js,mjs,jsx}'], settings: { next: { rootDir: 'apps/web' } } },
];
