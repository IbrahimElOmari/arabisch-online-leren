// eslint.config.js — SOFT profiel om lint te laten slagen
// Doel: CI/ontwikkeling deblokkeren. Later kun je dit weer aanscherpen.

import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Negeer build/artefacten
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

  // Standaard JS aanbevelingen
  js.configs.recommended,

  // TypeScript aanbevelingen (zonder project type-aware linting)
  ...tseslint.configs.recommended,

  // Projectregels — SOFT (alles wat blokkeert = warn of off)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
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
      // --- TypeScript STRICT MODE (Phase 4) ---
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-empty-object-type': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_', 
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      '@typescript-eslint/consistent-type-imports': ['error', { 
        prefer: 'type-imports', 
        fixStyle: 'inline-type-imports' 
      }],

      // --- Algemene STRICT ---
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-useless-escape': 'error',
      'no-case-declarations': 'error',

      // --- React Hooks STRICT (Phase 4) ---
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // --- Fast Refresh STRICT ---
      'react-refresh/only-export-components': ['warn', { 
        allowConstantExport: true 
      }],

      // --- Toegankelijkheid STRICT ---
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
    },
  },

  // Test- en config-bestanden nog losser
  {
    files: [
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      'vitest.config.*',
      'vite.config.*',
      'playwright.config.*',
      'e2e/**/*.ts',
    ],
    rules: {
      'no-console': 'off',
    },
  },
]
