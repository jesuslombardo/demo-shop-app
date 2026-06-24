import js from '@eslint/js'

export default [
  js.configs.recommended,

  // Server + tooling (ES modules running on Node)
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        URL: 'readonly',
      },
    },
  },

  // Browser UI scripts (classic scripts, browser globals)
  {
    files: ['public/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        document: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        atob: 'readonly',
        URLSearchParams: 'readonly',
        // Shared helpers defined on window by cart.js / session.js, loaded first.
        Cart: 'readonly',
        Session: 'readonly',
      },
    },
  },

  { ignores: ['node_modules/'] },
]
