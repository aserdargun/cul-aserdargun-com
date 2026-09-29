import { test, expect } from '@playwright/test';

for (const language of ['en', 'tr']) {
  test(`portfolio entry opens directly in ${language}`, async ({ page }) => {
    await page.goto(`/?lang=${language}`);
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', language);
  });
}

test('the entry point opens in English without a parameter', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
