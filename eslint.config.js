import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  js.configs.recommended,
  // Main process files (Node.js environment)
  {
    files: ['app/main/**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.node,
        ...globals.es2020,
        NodeJS: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      ...typescript.configs.recommended.rules,
      // Disable some rules that are too strict for this project
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // Allow empty catch blocks for cleanup code
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Allow console statements for debugging in Node.js
      'no-console': 'off',
      // Prefer const over let
      'prefer-const': 'error',
      // No var declarations
      'no-var': 'error',
      // Allow lexical declarations in case blocks
      'no-case-declarations': 'off'
    }
  },
  // Renderer process files (Browser environment)
  {
    files: ['app/renderer/**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
        process: 'readonly',
        NodeJS: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      ...typescript.configs.recommended.rules,
      // Disable some rules that are too strict for this project
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // Allow empty catch blocks for cleanup code
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Allow console statements for debugging
      'no-console': 'warn',
      // Prefer const over let
      'prefer-const': 'error',
      // No var declarations
      'no-var': 'error',
      // Allow redeclare for type definitions
      'no-redeclare': 'off'
    }
  },
  // Test files (Node.js environment with Jest globals)
  {
    files: ['tests/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.es2020
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-console': 'off', // Allow console in tests
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },
  {
    ignores: [
      'dist/**',
      'dist-packages/**',
      'node_modules/**',
      'coverage/**',
      '*.js', // Ignore JS files in root (like this config)
      'app/renderer/vite-env.d.ts'
    ]
  }
];
