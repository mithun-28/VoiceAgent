import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // JavaScript files
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.browser,
        LivekitClient: 'readonly',
      },
    },
  },

  // TypeScript files
  {
    files: ['**/*.{ts,mts,cts}'],
    languageOptions: {
      globals: globals.node,
    },
    extends: tseslint.configs.recommended,
  },
]);
