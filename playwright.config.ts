import { defineConfig, devices } from '@playwright/test';

/**
 * Runs against the local dev stack. Start PostgreSQL and the API first
 * (see ../GharKhata-api), then `npx playwright test` — this config starts
 * `ng serve` on :4495 which proxies /api to http://localhost:5495.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4495',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4495',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
