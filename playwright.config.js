import { defineConfig } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT ?? '3219';
export default defineConfig({
  testDir: 'tests/e2e',
  workers: 1,
  timeout: 25_000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node src/server.js',
    url: `http://127.0.0.1:${port}/health`,
    env: { PORT: port, DB_FILE: ':memory:' },
    reuseExistingServer: false,
  },
});
