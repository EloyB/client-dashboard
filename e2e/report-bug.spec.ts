import { eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { db } from '@/db';
import { activityLog, tickets } from '@/db/schema';
import { loginAsClient, loginAsTempClient } from './helpers/auth';

/**
 * Deletes a ticket created against the shared, long-lived Verlinden fixture
 * client (which can't itself be torn down between tests) — the activity log
 * entry is deleted explicitly first since it only gets ticketId set to null,
 * not removed, when the ticket goes; the resulting unattached file is left
 * for the slice-4 orphan-cleanup script, same as elsewhere in this project.
 */
async function cleanupTicketsTitled(title: string) {
  const matching = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.title, title));
  for (const ticket of matching) {
    await db.delete(activityLog).where(eq(activityLog.ticketId, ticket.id));
  }
  await db.delete(tickets).where(eq(tickets.title, title));
}

test.describe('bug melden (portaal)', () => {
  test('toont validatiefouten wanneer verplichte velden ontbreken', async ({ page, context }) => {
    await loginAsClient(context);
    await page.goto('/portal/tickets/new');

    await page.getByRole('button', { name: 'Melding versturen' }).click();

    await expect(page.getByText('Kies een project.')).toBeVisible();
    await expect(page.getByText('Titel is verplicht.')).toBeVisible();
  });

  test('melden met een screenshot toont de bevestigingsstaat', async ({ page, context }) => {
    const title = `Zzz E2E screenshot-melding ${Date.now()}`;
    await loginAsClient(context);

    try {
      await page.goto('/portal/tickets/new');

      await page.getByLabel('Project').click();
      await page.getByRole('option').first().click();
      await page.getByLabel('Titel').fill(title);

      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles({
        name: 'screenshot.png',
        mimeType: 'image/png',
        buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      });
      await expect(page.getByText('geüpload')).toBeVisible();

      await page.getByRole('button', { name: 'Melding versturen' }).click();

      await expect(page.getByText('Uw melding is verstuurd')).toBeVisible();
      await expect(page.getByText('Ontvangen')).toBeVisible();
      await expect(page.getByText('1 schermafbeelding')).toBeVisible();

      await page.getByRole('button', { name: 'Nog een melding maken' }).click();
      await expect(page.getByLabel('Titel')).toBeVisible();
      await expect(page.getByLabel('Titel')).toHaveValue('');
    } finally {
      await cleanupTicketsTitled(title);
    }
  });

  test('vult het project vooraf in wanneer een klant maar één actief project heeft', async ({
    page,
    context,
  }) => {
    const { projectNames, cleanup } = await loginAsTempClient(context, 1);

    try {
      await page.goto('/portal/tickets/new');
      await expect(page.getByLabel('Project')).toHaveText(projectNames[0]);
    } finally {
      await cleanup();
    }
  });

  test('toont een lege staat wanneer een klant geen actieve projecten heeft', async ({
    page,
    context,
  }) => {
    const { cleanup } = await loginAsTempClient(context, 0);

    try {
      await page.goto('/portal/tickets/new');
      await expect(page.getByText('Geen actieve projecten', { exact: true })).toBeVisible();
    } finally {
      await cleanup();
    }
  });
});
