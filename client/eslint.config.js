import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

const jsConfig = js.configs.recommended ?? {}
const hooksConfig = reactHooks.configs['recommended-latest'] ?? {}
const refreshConfig = reactRefresh.configs.vite ?? {}

export default [
  {
    ignores: ['build'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ...(jsConfig.languageOptions || {}),
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ...((jsConfig.languageOptions && jsConfig.languageOptions.parserOptions) || {}),
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      ...(jsConfig.plugins || {}),
      ...(hooksConfig.plugins || { 'react-hooks': reactHooks }),
      ...(refreshConfig.plugins || { 'react-refresh': reactRefresh }),
    },
    rules: {
      ...(jsConfig.rules || {}),
      ...(hooksConfig.rules || {}),
      ...(refreshConfig.rules || {}),
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
]
