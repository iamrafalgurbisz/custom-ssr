import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
    ],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
      ],
    },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    settings: { react: { version: 'detect' } },
  },
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
]);
