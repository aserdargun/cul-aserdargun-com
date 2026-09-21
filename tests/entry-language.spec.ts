import { test, expect } from '@playwright/test';

for (const language of ['en', 'tr']) {
  test(`portfolio entry opens directly in ${language}`, async ({ page }) => {
    await page.goto(`/?lang=${language}`);
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', language);
  });
}
