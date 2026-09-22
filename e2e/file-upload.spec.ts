import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './helpers/auth';

test.describe('design-check — bestandsupload', () => {
  test.beforeEach(async ({ context }) => {
    await loginAsAdmin(context);
  });

  function uploadSection(page: import('@playwright/test').Page) {
    return page.locator('section', {
      has: page.getByRole('heading', { name: '15 · Bestandsupload' }),
    });
  }

  test('uploaden van een screenshot toont voortgang en daarna een bevestigde rij', async ({
    page,
  }) => {
    await page.goto('/design-check');
    const section = uploadSection(page);
    await expect(section.getByText('Ticket-screenshot').first()).toBeVisible();

    const input = section.locator('input[type="file"]').first();
    await input.setInputFiles({
      name: 'screenshot.png',
      mimeType: 'image/png',
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    });

    await expect(section.getByText('geüpload')).toBeVisible();
    await expect(section.getByText('bevestigd')).toBeVisible();
    await expect(section.getByRole('button', { name: 'Downloaden' })).toBeVisible();
  });

  test('een te groot bestand toont een foutmelding', async ({ page }) => {
    await page.goto('/design-check');
    const section = uploadSection(page);
    await expect(section.getByText('Ticket-screenshot').first()).toBeVisible();

    const input = section.locator('input[type="file"]').first();
    await input.setInputFiles({
      name: 'te-groot.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(11 * 1024 * 1024),
    });

    await expect(section.getByText(/te groot/)).toBeVisible();
  });

  test('het bevestigde bestand kan gedownload worden via een presigned URL', async ({ page }) => {
    await page.goto('/design-check');
    const section = uploadSection(page);
    await expect(section.getByText('Ticket-screenshot').first()).toBeVisible();

    const input = section.locator('input[type="file"]').first();
    await input.setInputFiles({
      name: 'screenshot.png',
      mimeType: 'image/png',
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    });
    await expect(section.getByText('bevestigd')).toBeVisible();

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      section.getByRole('button', { name: 'Downloaden' }).click(),
    ]);
    await popup.waitForLoadState();
    expect(popup.url()).toContain('localhost:9000');
  });
});
