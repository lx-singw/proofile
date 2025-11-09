module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:security/recommended'
  ],
  plugins: ['security'],
  rules: {
    // Security rules
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    
    // Additional security-focused rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // React security
    'react/no-danger': 'error',
    'react/no-danger-with-children': 'error',
    
    // Next.js security
    '@next/next/no-html-link-for-pages': 'error'
  },
  env: {
    browser: true,
    node: true,
    es6: true
  }
};