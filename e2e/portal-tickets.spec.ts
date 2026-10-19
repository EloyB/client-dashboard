import { eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { db } from '@/db';
import { tickets } from '@/db/schema';
import { loginAsTempClient } from './helpers/auth';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

test.describe('portaal ticketoverzicht en -detail (slice 5c)', () => {
  test('een gemelde bug staat meteen in het overzicht en het detail toont alles', async ({
    page,
    context,
  }) => {
    const { cleanup } = await loginAsTempClient(context, 1);
    const title = `Zzz E2E ticketdetail ${Date.now()}`;

    try {
      await page.goto('/portal/tickets/new');
      await page.getByLabel('Titel').fill(title);
      await page.getByLabel('Pagina-URL').fill('example.com/contact');
      const input = page.locator('input[type="file"]').first();
      await input.setInputFiles({
        name: 'screenshot.png',
        mimeType: 'image/png',
        buffer: TINY_PNG,
      });
      await page.getByText('geüpload').waitFor({ state: 'visible' });
      await page.getByRole('button', { name: 'Melding versturen' }).click();
      await expect(page.getByText('Uw melding is verstuurd')).toBeVisible();

      await page.goto('/portal/tickets');
      const ticketLink = page.getByRole('link', { name: title });
      await expect(ticketLink).toBeVisible();

      await ticketLink.click();
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
      await expect(page.getByText('Ontvangen').first()).toBeVisible();
      await expect(page.getByText('https://example.com/contact')).toBeVisible();
      await expect(page.getByText('Wat betekent de status?')).toBeVisible();

      await page.getByRole('button', { name: /screenshot\.png/ }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText('Downloaden')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    } finally {
      await cleanup();
    }
  });

  test('het statusfilter blijft behouden na herladen', async ({ page, context }) => {
    const { cleanup } = await loginAsTempClient(context, 1);
    const title = `Zzz E2E filter ${Date.now()}`;

    try {
      await page.goto('/portal/tickets/new');
      await page.getByLabel('Titel').fill(title);
      await page.getByRole('button', { name: 'Melding versturen' }).click();
      await expect(page.getByText('Uw melding is verstuurd')).toBeVisible();

      await page.goto('/portal/tickets');
      await page.getByRole('button', { name: /^Nieuw \d/ }).click();
      await expect(page).toHaveURL(/status=new/);
      await expect(page.getByRole('link', { name: title })).toBeVisible();

      await page.reload();
      await expect(page).toHaveURL(/status=new/);
      await expect(page.getByRole('link', { name: title })).toBeVisible();
    } finally {
      await cleanup();
    }
  });

  test('een ticket van een andere klant geeft de 404-pagina', async ({ page, context }) => {
    const owner = await loginAsTempClient(context, 1);
    // A fresh context/session so this test isn't logged in as `owner`.
    const outsiderContext = await context.browser()!.newContext();
    const outsider = await loginAsTempClient(outsiderContext, 1);
    const outsiderPage = await outsiderContext.newPage();

    try {
      await page.goto('/portal/tickets/new');
      await page.getByLabel('Titel').fill('Ticket van eigenaar');
      await page.getByRole('button', { name: 'Melding versturen' }).click();
      await expect(page.getByText('Uw melding is verstuurd')).toBeVisible();

      const [ownerTicket] = await db
        .select({ id: tickets.id })
        .from(tickets)
        .where(eq(tickets.title, 'Ticket van eigenaar'));

      await outsiderPage.goto(`/portal/tickets/${ownerTicket.id}`);
      await expect(outsiderPage.getByText('Deze pagina bestaat niet')).toBeVisible();
    } finally {
      await outsiderPage.close();
      await outsiderContext.close();
      await owner.cleanup();
      await outsider.cleanup();
    }
  });
});
