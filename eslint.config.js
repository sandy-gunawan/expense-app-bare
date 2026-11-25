import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['.worktrees/', 'coverage/', 'test-results/', 'playwright-report/', 'audit/', 'site/assets/vendor/'] },
  js.configs.recommended,
  { languageOptions: { globals: globals.node } },
  { files: ['src/public/**/*.js', 'site/js/**/*.js'], languageOptions: { globals: globals.browser } },
];
