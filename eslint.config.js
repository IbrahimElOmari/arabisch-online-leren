// eslint.config.js — Flat config voor ESLint v9 + TypeScript + React + Vite
// Volledig te plakken bestand.

import js from '@eslint/js'
import globals from 'globals'

// Typescript ESLint (optioneel maar aanbevolen voor TS-projecten)
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

// Plugins
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Basis JS/TS omgeving
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'node_modules/**',
      // lockfiles en build artefacten negeren
      'pnpm-lock.yaml',
    ],
  },

  // Standaard JS rules
  js.configs.recommended,

  // TypeScript in src/
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsparser,
      parserOptions: {
        // als je tsconfig anders heet/verplaatst is, pas hier aan
        project: false, // zet op true + tsconfigRootDir als je project-based rules wil
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      // TypeScript best practices (lichtgewicht set)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Fast Refresh (Vite)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Toegankelijkheid
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',

      // Algemeen strakker
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
    },
  },

  // Toestaan van importeren van .tsx in tests en tooling
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', 'vitest.config.*', 'vite.config.*'],
    rules: {
      'no-console': 'off',
    },
  },
]
