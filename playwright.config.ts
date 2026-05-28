import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    timeout: 60000,
    reuseExistingServer: true,
  },
});
