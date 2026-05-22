import security from 'eslint-plugin-security';

export default [
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**', 'dist/**'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module'
    },
    plugins: {
      security
    },
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-alert': 'warn',
      'security/detect-eval-with-expression': 'error',
      'security/detect-new-buffer': 'error'
    }
  }
];
