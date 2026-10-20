import { eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { db } from '@/db';
import { clients, events, projects } from '@/db/schema';
import { loginAsAdmin } from './helpers/auth';

test.describe('agenda-items per project (slice 8a)', () => {
  test.beforeEach(async ({ context }) => {
    await loginAsAdmin(context);
  });

  test('aanmaken met validatiefouten, zichtbaarheid wijzigen, verwijderen', async ({ page }) => {
    const [client] = await db.select().from(clients).limit(1);
    const [project] = await db
      .insert(projects)
      .values({ clientId: client.id, name: `Zzz E2E Agenda ${Date.now()}`, status: 'active' })
      .returning();
    const title = `Zzz E2E Overleg ${Date.now()}`;

    try {
      await page.goto(`/app/projects/${project.id}`);

      // 1. Validation error: submitting without a title or a start date.
      await page.getByRole('button', { name: 'Item toevoegen' }).first().click();
      await page.getByRole('button', { name: 'Opslaan' }).click();
      await expect(page.getByText('Titel is verplicht.')).toBeVisible();

      // Fill the rest, leaving visibleToClient on its default (checked).
      await page.getByLabel('Titel').fill(title);
      await page.getByText('Kies een datum').first().click();
      // Tomorrow, not today — picking a 10:00 slot for "today" would land in
      // the past (and so in the collapsed "voorbije items" section) whenever
      // this test happens to run after 10:00. The calendar's day buttons
      // carry a locale-formatted `data-day` attribute (e.g. "21-10-2026") —
      // computed in the browser itself so it matches exactly.
      const tomorrowDataDay = await page.evaluate(() => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        return date.toLocaleDateString('nl');
      });
      await page.locator(`[data-day="${tomorrowDataDay}"]`).click();
      await page.getByLabel('Tijdstip').first().click();
      await page.getByRole('option', { name: '14:00', exact: true }).click();
      await page.getByRole('button', { name: 'Opslaan' }).click();
      await expect(page.getByText('Agenda-item aangemaakt')).toBeVisible();
      await expect(page.getByText(title)).toBeVisible();

      const [event] = await db.select().from(events).where(eq(events.title, title)).limit(1);
      const row = page.getByTestId(`event-row-${event.id}`);

      // 2. Change visibility by editing the item.
      await row.getByText(title).click();
      await expect(page.getByRole('heading', { name: 'Agenda-item bewerken' })).toBeVisible();
      await page.getByLabel('Zichtbaar voor klant').click();
      await page.getByRole('button', { name: 'Opslaan' }).click();
      await expect(page.getByText('Agenda-item bijgewerkt')).toBeVisible();
      await expect(row.getByText('Intern')).toBeVisible();

      // 3. Delete via the confirmation dialog (typing the title).
      await row.getByRole('button', { name: 'Meer acties' }).click();
      await page.getByRole('menuitem', { name: 'Verwijderen' }).click();
      const dialog = page.getByRole('alertdialog');
      await expect(dialog).toBeVisible();
      await dialog.getByLabel(`Typ ${title} om te bevestigen`).fill(title);
      await dialog.getByRole('button', { name: 'Verwijderen' }).click();
      await expect(page.getByText('Agenda-item verwijderd')).toBeVisible();
      await expect(page.getByText(title)).toHaveCount(0);
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
    }
  });
});
