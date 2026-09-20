import { defineConfig } from '@playwright/test';
const preview = process.env.CUL_PREVIEW === '1';
const baseURL = `http://127.0.0.1:${preview ? 8037 : 8036}`;
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 45000,
  expect: { timeout: 15000 },
  fullyParallel: true,
  workers: 3,
  reporter: 'list',
  use: {
    baseURL,
    viewport: { width: 1440, height: 1024 },
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: preview ? 'npm run preview' : 'npm run dev',
    url: baseURL,
    reuseExistingServer: !preview,
  },
});
