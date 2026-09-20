import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const scenarioNames = [
  'Kararlı arayüz',
  'Değişen yerleşim',
  'Belirsiz hedef',
  'Engellenmiş etkileşim',
  'Belirsiz sonuç',
  'Onay sınırı',
];
async function choose(page: Page, i: number, strategy = 'Koordinat') {
  await page.getByRole('button', { name: new RegExp(`0${i + 1} ${scenarioNames[i]}`) }).click();
  await page.getByRole('button', { name: strategy, exact: true }).click();
}
async function download(page: Page) {
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON indir', exact: true }).click();
  const file = await event;
  return JSON.parse(readFileSync((await file.path())!, 'utf8'));
}
async function steps(page: Page, n: number) {
  for (let i = 0; i < n; i++)
    await page.getByRole('button', { name: 'Adımla', exact: true }).click();
}
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Gözlemle. Eyleme geç. Doğrula.' })).toBeVisible();
});
for (const strategy of ['Koordinat', 'Anlamsal'])
  for (let i = 0; i < 6; i++)
    test(`${scenarioNames[i]} / ${strategy}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (e) => {
        if (e.type() === 'error') errors.push(e.text());
      });
      await choose(page, i, strategy);
      await page.getByRole('button', { name: 'Oynat', exact: true }).click();
      if (i === 5) {
        await expect(page.getByTestId('run-status')).toHaveText('Onay bekliyor');
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Arşivlemeyi uygula' })).toBeDisabled();
        await page.getByRole('button', { name: 'Onayla', exact: true }).click();
      }
      await expect(page.getByTestId('run-status')).toHaveText('Tamamlandı');
      if (i < 5) {
        await expect(page.getByRole('textbox', { name: 'Not', exact: true })).toHaveValue(
          'İncelendi',
        );
        await expect(page.getByTestId('writes')).toHaveText('1');
      } else
        await expect(
          page.getByTestId('stage').getByText('Arşivlendi', { exact: true }),
        ).toBeVisible();
      const data = await download(page);
      expect(data.schemaVersion).toBe('1.0');
      expect(data.verification.passed).toBe(true);
      expect(data.events.length).toBeGreaterThan(10);
      expect(data.initialState.records[0].value).toBe('draft');
      if (i === 1 && strategy === 'Koordinat')
        expect(data.events.some((e: { code: string }) => e.code === 'stale')).toBe(true);
      if (i === 2)
        expect(data.events.some((e: { code: string }) => e.code === 'ambiguous')).toBe(true);
      if (i === 3) expect(data.retries).toBe(2);
      if (i === 4) {
        await expect(
          page.getByText('Başarı bildirimi gösterilmedi', { exact: true }),
        ).toBeVisible();
        await page.getByRole('button', { name: 'Kör tekrarı dene (+1 yazma)' }).click();
        await expect(page.getByTestId('writes')).toHaveText('2');
        expect((await download(page)).verification.duplicate).toBe(true);
      }
      expect(errors).toEqual([]);
    });
test('start, pause, reset, step and inspect history without applying actions', async ({ page }) => {
  await page.getByRole('button', { name: 'İlk deneyi başlat' }).click();
  await page.getByRole('button', { name: 'Duraklat', exact: true }).click();
  const paused = await download(page);
  await page.waitForTimeout(650);
  expect((await download(page)).steps).toBe(paused.steps);
  await page.getByRole('button', { name: 'Oynat', exact: true }).click();
  await page.getByRole('button', { name: 'Sıfırla', exact: true }).click();
  await page.waitForTimeout(650);
  await expect(page.getByTestId('run-status')).toHaveText('Hazır');
  expect((await download(page)).events).toHaveLength(0);
  await steps(page, 3);
  await expect(page.getByTestId('run-status')).toContainText('Eyleme hazır');
  const before = await download(page);
  await page.getByRole('button', { name: /Olayı incele 1:/ }).click();
  await expect(page.getByText('Geçmiş incelemesi — eylemler yeniden uygulanmaz')).toBeVisible();
  expect((await download(page)).environment).toEqual(before.environment);
  await expect(page.getByRole('button', { name: 'Adımla', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Canlı ize dön' }).click();
  await expect(page.getByRole('button', { name: 'Adımla', exact: true })).toBeEnabled();
});
test('interventions stale the observation, overlay blocks, filters and manual form work', async ({
  page,
}) => {
  await steps(page, 2);
  await page.getByRole('button', { name: 'Sırayı değiştir' }).click();
  await expect(page.getByText('Gözlem eskidi', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Katman aç / kapat' }).click();
  await expect(page.getByRole('heading', { name: 'Bu katman hedefi kapatıyor' })).toBeVisible();
  await page.getByRole('button', { name: 'Kapat', exact: true }).click();
  await page.getByRole('textbox', { name: 'Kayıt ara (kod veya başlık)' }).fill('Spektrum');
  await expect(page.getByRole('button', { name: /Aç: Spektrum/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Aç: Yörünge/ })).toHaveCount(0);
  await page.getByRole('button', { name: /Aç: Spektrum/ }).click();
  await page.getByRole('textbox', { name: 'Not', exact: true }).fill('Elle değiştirildi');
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  await expect(page.getByTestId('writes')).toHaveText('1');
  await page.getByRole('button', { name: 'Listeye dön' }).click();
  await page.getByRole('combobox', { name: 'Kayıt filtresi' }).selectOption('archived');
  await expect(
    page.getByText('Eşleşen kayıt yok. Filtreyi veya aramayı değiştirin.'),
  ).toBeVisible();
});
test('approval edit refreshes proposal and rejection leaves record intact', async ({ page }) => {
  await choose(page, 5);
  await page.getByRole('button', { name: 'Oynat', exact: true }).click();
  await expect(page.getByTestId('run-status')).toHaveText('Onay bekliyor');
  await page.getByRole('textbox', { name: 'Onaya bağlanan içerik' }).fill('Yeni arşiv gerekçesi');
  await expect(page.getByTestId('run-status')).toContainText('Gözlemliyor');
  await page.getByRole('button', { name: 'Oynat', exact: true }).click();
  await expect(page.getByTestId('run-status')).toHaveText('Onay bekliyor');
  await expect(page.locator('.inspector .approval-box')).toContainText('Yeni arşiv gerekçesi');
  await page.getByRole('button', { name: 'Reddet', exact: true }).click();
  await expect(page.getByTestId('run-status')).toHaveText('Engellendi');
  expect((await download(page)).environment.records[0].archived).toBe(false);
});
test('switching language preserves semantic proposal and run', async ({ page }) => {
  await choose(page, 0, 'Anlamsal');
  await steps(page, 3);
  const before = await download(page);
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Observe. Act. Verify.' })).toBeVisible();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByTestId('run-status')).toHaveText('Completed');
  await expect(page.getByRole('textbox', { name: 'Note', exact: true })).toHaveValue('Reviewed');
  await page.getByRole('button', { name: 'TR', exact: true }).click();
  const after = await download(page);
  expect(after.id).toBe(before.id);
  expect(after.events.find((e: { code: string }) => e.code === 'target-selected').action).toEqual(
    before.proposal,
  );
});
test('comparison executes every scenario from identical initial states', async ({ page }) => {
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Karşılaştırma', exact: true })
    .click();
  for (let i = 0; i < 6; i++) {
    await page
      .getByRole('combobox', { name: 'Deney kütüphanesi' })
      .selectOption({ label: scenarioNames[i] });
    await page.getByRole('button', { name: 'İki stratejiyi çalıştır' }).click();
    await expect(page.locator('.comparison-result')).toHaveCount(2);
    if (i === 5) {
      await page.getByRole('button', { name: 'Onayla', exact: true }).first().click();
      await page.getByRole('button', { name: 'Reddet', exact: true }).click();
      await expect(page.locator('.comparison-result').first()).toContainText('Tamamlandı');
      await expect(page.locator('.comparison-result').last()).toContainText('Engellendi');
    } else
      for (const result of await page.locator('.comparison-result').all())
        await expect(result).toContainText('Tamamlandı');
  }
});
for (const width of [320, 390, 768, 1440])
  test(`responsive ${width}, keyboard, zoom and scroll targeting`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'İçeriğe geç' })).toBeFocused();
    await page.keyboard.press('Enter');
    await page
      .getByRole('combobox', { name: 'Mantıksal ortam: 640 × 480 · Ölçek' })
      .selectOption('1.15');
    await page.getByRole('button', { name: 'Sırayı değiştir' }).click();
    await page.getByRole('button', { name: 'Oynat', exact: true }).click();
    await expect(page.getByTestId('run-status')).toHaveText('Tamamlandı');
    await expect(page.getByTestId('writes')).toHaveText('1');
    expect((await download(page)).environment.selected).toBe('CUL-104');
    await page.getByRole('button', { name: 'Sıfırla', exact: true }).click();
    await page
      .getByRole('combobox', { name: 'Mantıksal ortam: 640 × 480 · Ölçek' })
      .selectOption('1');
    await steps(page, 3);
    const rect = await page.locator('.target-outline').boundingBox();
    expect(rect?.width).toBeCloseTo(600, 0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: `/tmp/cul-${width}.png`, fullPage: true });
    await page.getByRole('navigation').getByRole('button', { name: 'Kavramlar ve yöntem' }).click();
    await expect(page.getByRole('heading', { name: 'Deney döngüsü' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.getByRole('link', { name: 'Locators' })).toHaveAttribute(
      'href',
      'https://playwright.dev/docs/locators',
    );
  });
test('permanent blocker and missing label are visible handoffs', async ({ page }) => {
  await choose(page, 3, 'Anlamsal');
  await page.getByText('Hata koşulları', { exact: true }).click();
  await page.getByRole('checkbox', { name: 'Kalıcı engel / zaman aşımı' }).check();
  await page.getByRole('button', { name: 'Oynat', exact: true }).click();
  await expect(page.getByTestId('run-status')).toHaveText('Kullanıcıya devredildi');
  await expect(page.getByTestId('writes')).toHaveText('0');
  const r = await download(page);
  expect(r.retries).toBe(3);
  await choose(page, 0, 'Anlamsal');
  await page.getByRole('checkbox', { name: 'Not alanının etiketi eksik' }).check();
  await page.getByRole('button', { name: 'Oynat', exact: true }).click();
  await expect(page.getByTestId('run-status')).toHaveText('Kullanıcıya devredildi');
});
test('keyboard editing works and cold load has no external dependency or console errors', async ({
  page,
}) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (e) => {
    if (e.type() === 'error') errors.push(e.text());
  });
  page.on('request', (r) => {
    if (!r.url().startsWith(new URL(page.url()).origin + '/') && !r.url().startsWith('data:'))
      external.push(r.url());
  });
  await page.reload();
  await page
    .getByRole('button', { name: 'Aç: Yörünge notları · Astronomi', exact: true })
    .press('Enter');
  await page.getByRole('textbox', { name: 'Not', exact: true }).fill('Klavye notu');
  await page.getByRole('textbox', { name: 'Not', exact: true }).press('Tab');
  await expect(page.getByRole('button', { name: 'Kaydet', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('writes')).toHaveText('1');
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
test('scaled click point and bounds align with actual rendered row after scrolling', async ({
  page,
}) => {
  await page
    .getByRole('combobox', { name: 'Mantıksal ortam: 640 × 480 · Ölçek' })
    .selectOption('1.15');
  await page.getByRole('button', { name: 'Sırayı değiştir' }).click();
  await page.locator('.record-list').hover();
  await page.mouse.wheel(0, 240);
  await expect
    .poll(async () => await page.locator('.record-list').evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
  await steps(page, 3);
  const actual = await page
    .getByRole('button', { name: 'Aç: Yörünge notları · Astronomi', exact: true })
    .boundingBox();
  const target = await page.locator('.target-outline').boundingBox();
  expect(actual).not.toBeNull();
  expect(target).not.toBeNull();
  expect(target!.width).toBeCloseTo(690, 0);
  expect(target!.x).toBeCloseTo(actual!.x, 0);
  expect(target!.y).toBeCloseTo(actual!.y, 0);
  expect(target!.height).toBeCloseTo(actual!.height, 0);
  await page.getByRole('button', { name: 'Oynat', exact: true }).click();
  await expect(page.getByTestId('run-status')).toHaveText('Tamamlandı');
  await expect(page.getByTestId('writes')).toHaveText('1');
});
