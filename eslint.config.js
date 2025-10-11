// eslint.config.js — Flat config voor ESLint v9 + TypeScript + React + Vite
// Volledig te plakken bestand (werkt met het meta-pakket `typescript-eslint`).

import js from '@eslint/js'
import globals from 'globals'

// Meta-pakket met kant-en-klare flat configs
import tseslint from 'typescript-eslint'

// Extra plugins
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Negeer build- en artefact-mappen
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'node_modules/**',
      'pnpm-lock.yaml',
    ],
  },

  // Standaard JS rules
  js.configs.recommended,

  // TypeScript basisregels (zonder project-typechecking om setup simpel te houden)
  ...tseslint.configs.recommended,

  // Projectspecifieke TS/React regels
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        // Wil je type-aware linting later? Zet hier `project: './tsconfig.json'`.
        project: false,
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Vite React Fast Refresh
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Toegankelijkheid (basis)
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',

      // Algemeen
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
    },
  },

  // Tests en config files mogen wat losser met console
  {
    files: [
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      'vitest.config.*',
      'vite.config.*',
      'playwright.config.*'
    ],
    rules: {
      'no-console': 'off',
    },
  },
]
