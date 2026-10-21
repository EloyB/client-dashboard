import { eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { db } from '@/db';
import { clients, projects } from '@/db/schema';
import { loginAsAdmin } from './helpers/auth';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

test.describe('admin documents (slice 6a)', () => {
  test.beforeEach(async ({ context }) => {
    await loginAsAdmin(context);
  });

  test('uploaden, terugvinden, zichtbaarheid wijzigen, openen en verwijderen', async ({ page }) => {
    const [client] = await db.select().from(clients).limit(1);
    const [project] = await db
      .insert(projects)
      .values({ clientId: client.id, name: `Zzz E2E Documenten ${Date.now()}`, status: 'active' })
      .returning();
    const title = `Zzz E2E Document ${Date.now()}`;

    try {
      // 1. Upload via the compact section on the project detail page.
      await page.goto(`/app/projects/${project.id}`);
      await page.getByRole('tab', { name: 'Documenten' }).click();
      await page.getByRole('button', { name: 'Document uploaden' }).click();

      const input = page.locator('input[type="file"]').first();
      await input.setInputFiles({ name: 'factuur.png', mimeType: 'image/png', buffer: TINY_PNG });
      await expect(page.getByText('geüpload')).toBeVisible();

      await page.getByLabel('Titel').fill(title);
      await page.getByLabel('Soort').click();
      await page.getByRole('option', { name: 'Factuur' }).click();
      await page.getByRole('button', { name: 'Document opslaan' }).click();
      await expect(page.getByText('Document toegevoegd')).toBeVisible();
      await page.keyboard.press('Escape');

      // 2. It shows up in the compact section — this is a real DataTable
      // too now (desktop table + mobile card rendered at once, CSS-toggled
      // per breakpoint), same as the full list below.
      await expect(page.locator(`text="${title}" >> visible=true`)).toBeVisible();

      // 3. The full list, filtered to this project, shows it too.
      await page.getByRole('link', { name: 'Alle documenten' }).click();
      await page.waitForURL(`**/app/projects/${project.id}/documents`);
      // DataTable renders both the desktop table and mobile card markup at
      // once (hidden via CSS per breakpoint); "visible=true" picks whichever
      // one the current viewport actually shows (see clients.spec.ts for the
      // getByRole alternative — not available here, these rows don't link anywhere).
      await expect(page.locator(`text="${title}" >> visible=true`)).toBeVisible();

      // 4. Change visibility from the "…" menu (the table has no standalone
      // toggle button anymore — visibility lives in the same menu as delete).
      await page.locator('[aria-label="Meer acties"] >> visible=true').click();
      await page.getByRole('menuitem', { name: 'Niet langer delen' }).click();
      await expect(page.getByText('Niet langer gedeeld')).toBeVisible();

      // 5. Open the document by clicking the row/card itself — the whole row
      // is clickable now, there's no separate "Openen" button.
      const [newTab] = await Promise.all([
        page.context().waitForEvent('page'),
        page.locator(`text="${title}" >> visible=true`).click(),
      ]);
      await newTab.waitForLoadState();
      expect(newTab.url()).toContain('http');
      await newTab.close();

      // 6. Delete via the confirmation dialog (typing the title).
      await page.locator('[aria-label="Meer acties"] >> visible=true').click();
      await page.getByRole('menuitem', { name: 'Verwijderen' }).click();
      const dialog = page.getByRole('alertdialog');
      await expect(dialog).toBeVisible();
      await dialog.getByLabel(`Typ ${title} om te bevestigen`).fill(title);
      await dialog.getByRole('button', { name: 'Verwijderen' }).click();
      await expect(page.getByText('Document verwijderd')).toBeVisible();
      await expect(page.getByText(title)).toHaveCount(0);
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
    }
  });
});
