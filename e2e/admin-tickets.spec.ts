import { expect, test } from '@playwright/test';

import { loginAsAdmin, loginAsTempClient } from './helpers/auth';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

test.describe('admin tickets (slice 5d)', () => {
  test('een gemelde bug staat in het admin-overzicht, de screenshot vergroot, en een statuswijziging is zichtbaar in het portaal', async ({
    page,
    context,
  }) => {
    const { cleanup } = await loginAsTempClient(context, 1);
    const title = `Zzz E2E admin-ticket ${Date.now()}`;

    const adminContext = await context.browser()!.newContext();
    const adminPage = await adminContext.newPage();

    try {
      // 1. Client reports a bug with a screenshot.
      await page.goto('/portal/tickets/new');
      await page.getByLabel('Titel').fill(title);
      const input = page.locator('input[type="file"]').first();
      await input.setInputFiles({
        name: 'screenshot.png',
        mimeType: 'image/png',
        buffer: TINY_PNG,
      });
      await page.getByText('geüpload').waitFor({ state: 'visible' });
      await page.getByRole('button', { name: 'Melding versturen' }).click();
      await expect(page.getByText('Uw melding is verstuurd')).toBeVisible();

      // Navigate to the ticket's own detail page so the later reload actually
      // re-fetches the ticket, instead of reloading the confirmation state.
      await page.goto('/portal/tickets');
      await page.getByRole('link', { name: title }).click();
      await expect(page.getByRole('heading', { name: title })).toBeVisible();

      // 2. The admin finds it in the overview and opens the detail.
      await loginAsAdmin(adminContext);
      await adminPage.goto('/app/tickets');
      const ticketLink = adminPage.getByRole('link', { name: title });
      await expect(ticketLink).toBeVisible();
      await ticketLink.click();
      await expect(adminPage.getByRole('heading', { name: title })).toBeVisible();

      // 3. The screenshot enlarges in a lightbox.
      await adminPage.getByRole('button', { name: /screenshot\.png/ }).click();
      const dialog = adminPage.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await adminPage.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();

      // 4. The admin changes the status.
      await adminPage.getByLabel('Status').click();
      await adminPage.getByRole('option', { name: 'In behandeling' }).click();
      await expect(adminPage.getByText('Status bijgewerkt')).toBeVisible();

      // 5. The client sees the new status and its explanation in the portal.
      await page.reload();
      await expect(page.getByText('We zijn ermee bezig').first()).toBeVisible();
    } finally {
      await adminPage.close();
      await adminContext.close();
      await cleanup();
    }
  });

  test('filters op het admin-ticketoverzicht blijven behouden na herladen', async ({
    page,
    context,
  }) => {
    await loginAsAdmin(context);

    await page.goto('/app/tickets');
    await page.getByRole('button', { name: /^Nieuw \d/ }).click();
    await expect(page).toHaveURL(/status=new/);

    await page.reload();
    await expect(page).toHaveURL(/status=new/);
    await expect(page.getByRole('button', { name: /^Nieuw \d/ })).toBeVisible();
  });
});
