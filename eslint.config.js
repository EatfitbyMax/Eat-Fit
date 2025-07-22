
module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'build/**',
      '*.generated.*',
      '.next/**',
      'server/node_modules/**'
    ]
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: ['expo'],
    rules: {
      // Règles relaxées pour le build de production
      '@typescript-eslint/no-unused-vars': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': 'off', // Gardé pour le debugging
      'prefer-const': 'warn'
    },
    env: {
      node: true,
      es6: true,
      'react-native/react-native': true
    }
  }
];
