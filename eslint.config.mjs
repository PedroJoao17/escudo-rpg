import js from '@eslint/js';
import globals from 'globals';
import next from 'eslint-config-next/core-web-vitals';

export default [
  { ignores: ['**/node_modules/**', '**/.next/**', 'coverage/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  { files: ['**/*.{js,mjs,jsx}'], languageOptions: { globals: { ...globals.node, ...globals.browser } }, rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } },
  ...next.map((config) => ({ ...config, files: ['apps/web/**/*.{js,mjs,jsx}'] })),
  { files: ['apps/web/**/*.{js,mjs,jsx}'], settings: { next: { rootDir: 'apps/web' } } },
  {
    files: ['apps/web/src/components/battle-hub.jsx'],
    rules: {
      // O estado transitório do combate é restaurado do localStorage ao trocar de personagem.
      // A persistência será movida para uma camada própria quando o backend transacional for implementado.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['apps/web/src/components/player-screen.jsx'],
    rules: {
      // Estes blocos são helpers de renderização do shell atual, sem estado próprio.
      // Mantemos a exceção restrita ao arquivo até a extração definitiva dos hubs.
      'react-hooks/static-components': 'off',
    },
  },
];