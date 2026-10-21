import { eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { db } from '@/db';
import { clients, projects } from '@/db/schema';
import { loginAsAdmin } from './helpers/auth';

test.describe('admin taken (slice 7a)', () => {
  test.beforeEach(async ({ context }) => {
    await loginAsAdmin(context);
  });

  test('aanmaken met validatiefouten, status inline wijzigen, bewerken, verwijderen', async ({
    page,
  }) => {
    const [client] = await db.select().from(clients).limit(1);
    const [project] = await db
      .insert(projects)
      .values({ clientId: client.id, name: `Zzz E2E Taken ${Date.now()}`, status: 'active' })
      .returning();
    const title = `Zzz E2E Taak ${Date.now()}`;
    const editedTitle = `${title} (bewerkt)`;

    try {
      await page.goto(`/app/projects/${project.id}/tasks`);

      // 1. Validation error: submitting without a title. (Both the header
      // button and the empty state's own button exist for a brand-new,
      // task-less project — either one opens the same create sheet.)
      await page.getByRole('button', { name: 'Taak toevoegen' }).first().click();
      await page.getByRole('button', { name: 'Opslaan' }).click();
      await expect(page.getByText('Titel is verplicht.')).toBeVisible();

      // Create it for real.
      await page.getByLabel('Titel').fill(title);
      await page.getByRole('button', { name: 'Opslaan' }).click();
      await expect(page.getByText('Taak aangemaakt')).toBeVisible();

      await expect(page.getByRole('button', { name: title })).toBeVisible();

      // 2. Change status inline from the list. (DataTable renders both the
      // desktop table and mobile card markup at once, hidden via CSS per
      // breakpoint — the :visible filter picks the one the viewport shows.)
      await page.locator('[aria-label="Status"]:visible').click();
      await page.getByRole('option', { name: 'Bezig' }).click();
      await expect(page.getByText('Status bijgewerkt')).toBeVisible();

      // 3. Edit the task via the "..." menu.
      await page.getByRole('button', { name: 'Meer acties' }).first().click();
      await page.getByRole('menuitem', { name: 'Bewerken' }).click();
      await expect(page.getByRole('heading', { name: 'Taak bewerken' })).toBeVisible();
      await page.getByLabel('Titel').fill(editedTitle);
      await page.getByRole('button', { name: 'Opslaan' }).click();
      await expect(page.getByText('Taak bijgewerkt')).toBeVisible();
      await expect(page.getByRole('button', { name: editedTitle })).toBeVisible();

      // 4. Delete via the confirmation dialog.
      await page.getByRole('button', { name: 'Meer acties' }).first().click();
      await page.getByRole('menuitem', { name: 'Verwijderen' }).click();
      const dialog = page.getByRole('alertdialog');
      await expect(dialog).toBeVisible();
      await dialog.getByLabel(`Typ ${editedTitle} om te bevestigen`).fill(editedTitle);
      await dialog.getByRole('button', { name: 'Verwijderen' }).click();
      await expect(page.getByText('Taak verwijderd')).toBeVisible();
      await expect(page.getByText(editedTitle)).toHaveCount(0);
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
    }
  });
});
