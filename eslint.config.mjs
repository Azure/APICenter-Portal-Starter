import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixupConfigRules, fixupPluginRules, includeIgnoreFile } from '@eslint/compat';
import _import from 'eslint-plugin-import';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import jsxA11Y from 'eslint-plugin-jsx-a11y';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...fixupConfigRules(
    compat.extends(
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:storybook/recommended'
    )
  ),
  includeIgnoreFile(path.resolve(__dirname, '.gitignore')),
  {
    plugins: {
      import: fixupPluginRules(_import),
      react: fixupPluginRules(react),
      prettier,
      'jsx-a11y': jsxA11Y,
      '@stylistic': stylistic,
    },

    settings: { react: { version: 'detect' } },

    rules: {
      'prettier/prettier': ['error', {}, { usePrettierrc: true }],
      'import/order': [
        'error',
        {
          pathGroups: [
            {
              pattern: '@/**',
              group: 'parent',
            },
          ],

          groups: ['builtin', 'external', 'parent', 'sibling', 'index'],
        },
      ],

      'react/hook-use-state': 'error',
      'react/jsx-first-prop-new-line': ['error', 'multiline-multiprop'],
      'react/jsx-indent': ['error', 2],
      'react/jsx-indent-props': ['error', 2],
      'react/jsx-closing-bracket-location': ['error', 'tag-aligned'],

      'react/jsx-max-props-per-line': [
        'error',
        {
          maximum: 1,
          when: 'multiline',
        },
      ],

      'react/jsx-no-bind': 'off',

      'react/jsx-one-expression-per-line': ['error', { allow: 'single-child' }],

      'react/jsx-pascal-case': 'error',

      'react/jsx-sort-props': [
        'error',
        {
          reservedFirst: true,
          callbacksLast: true,
          shorthandLast: true,
          noSortAlphabetically: true,
        },
      ],

      'react/sort-prop-types': [
        'error',
        {
          requiredFirst: true,
          callbacksLast: true,
          noSortAlphabetically: true,
        },
      ],

      'react/jsx-curly-brace-presence': [
        'error',
        {
          props: 'never',
          children: 'ignore',
        },
      ],

      'react/jsx-uses-react': 'error',
      'react/no-access-state-in-setstate': 'error',
      'react/no-multi-comp': 'error',
      'react/react-in-jsx-scope': 'error',
      'react/void-dom-elements-no-children': 'error',

      'react/jsx-wrap-multilines': [
        'error',
        {
          declaration: 'parens-new-line',
          assignment: 'parens-new-line',
          return: 'parens-new-line',
          arrow: 'parens-new-line',
          condition: 'parens-new-line',
          logical: 'parens-new-line',
          prop: 'parens-new-line',
        },
      ],

      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'array-simple',
          readonly: 'array-simple',
        },
      ],
    },
  },
  prettierRecommended,
];
