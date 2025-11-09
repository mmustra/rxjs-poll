import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import unusedImports from 'eslint-plugin-unused-imports';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import importPlugin from 'eslint-plugin-import';
import jestFormatting from 'eslint-plugin-jest-formatting';
import prettierConfig from 'eslint-config-prettier';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsparser,
      parserOptions: {
        tsconfigRootDir: resolve(__dirname, 'configs/ts'),
        project: 'tsconfig.eslint.json',
      },
      globals: {
        browser: true,
        node: true,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettier,
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort,
      import: importPlugin,
      'jest-formatting': jestFormatting,
    },
    rules: {
      // Prettier integration - must come before other formatting rules
      ...prettierConfig.rules,
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],

      // Jest formatting
      ...jestFormatting.configs.strict.rules,

      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': 'off', // Replaced with unused-imports plugin
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'no-type-imports' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',

      // Unused imports and variables
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Import organization and sorting
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/order': 'off', // Using simple-import-sort instead

      // Code quality and best practices
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Error handling
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',

      // Best practices
      'array-callback-return': 'error',
      'no-array-constructor': 'error',
      'no-iterator': 'error',
      'no-new-wrappers': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ForInStatement',
          message:
            'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
        },
      ],
      'no-return-await': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unused-expressions': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'prefer-arrow-callback': 'off',
      'prefer-const': 'error',
      'prefer-named-capture-group': 'error',
      'prefer-template': 'error',
      'require-await': 'off',
      yoda: 'error',

      // Variables
      'no-label-var': 'error',
      'no-shadow': 'off', // Handled by TypeScript
      'no-undef-init': 'error',
      'no-use-before-define': 'off', // TypeScript handles this

      // Style (keeping minimal, Prettier handles most)
      'no-multiple-empty-lines': [
        'error',
        {
          max: 1,
          maxBOF: 0,
          maxEOF: 0,
        },
      ],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],

      // Disabled rules (explicitly off for project needs)
      'no-warning-comments': 'off',
      'capitalized-comments': 'off',
      'prefer-object-spread': 'off',
      'max-nested-callbacks': 'off',
    },
  },
];
