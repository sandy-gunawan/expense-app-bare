import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
    coverage: { include: ['src/**/*.js'], exclude: ['src/public/**'], reporter: ['text', 'json-summary', 'html'] },
  },
});
