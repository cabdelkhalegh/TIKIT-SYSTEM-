import js from '@eslint/js';

// Simple ESLint configuration for Next.js App Router
export default [
  js.configs.recommended,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      '.vercel/**',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Node.js globals
        process: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        // React globals
        React: 'readonly',
      },
    },
    rules: {
      // Relax some rules for Next.js/React patterns
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];
