import { eq } from 'drizzle-orm';
import { expect, test, type Page } from '@playwright/test';

import { db } from '@/db';
import { clients, projects } from '@/db/schema';
import { loginAsAdmin } from './helpers/auth';

test.describe('admin kanbanbord (slice 7b)', () => {
  test.beforeEach(async ({ context }) => {
    await loginAsAdmin(context);
  });

  async function dragTo(page: Page, sourceName: string, targetColumn: string) {
    const source = page.getByRole('button', { name: new RegExp(sourceName) });
    const target = page.getByText(targetColumn, { exact: true });
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();
    if (!sourceBox || !targetBox) throw new Error('Could not measure drag source/target');

    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(sourceBox.x + sourceBox.width / 2 + 20, sourceBox.y + 10, { steps: 5 });
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 80, { steps: 10 });
    await page.mouse.up();
  }

  test('bord/lijst-schakelaar, slepen tussen kolommen, taak aanmaken vanuit een kolom', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop', 'Het bord is pas op mobiel bruikbaar vanaf 7c');

    const [client] = await db.select().from(clients).limit(1);
    const [project] = await db
      .insert(projects)
      .values({ clientId: client.id, name: `Zzz E2E Kanban ${Date.now()}`, status: 'active' })
      .returning();
    const title = `Zzz E2E Kanban Taak ${Date.now()}`;

    try {
      await page.goto(`/app/projects/${project.id}/tasks`);

      // 1. Create a task via the list first (todo by default).
      await page.getByRole('button', { name: 'Taak toevoegen' }).first().click();
      await page.getByLabel('Titel').fill(title);
      await page.getByRole('button', { name: 'Opslaan' }).click();
      await expect(page.getByText('Taak aangemaakt')).toBeVisible();

      // 2. Switch to the board — the choice lands in the URL.
      await page.getByRole('button', { name: 'Bord' }).click();
      await expect(page).toHaveURL(/view=board/);
      await expect(page.getByRole('button', { name: new RegExp(title) })).toBeVisible();

      // 3. Drag the card from "Te doen" to "Bezig".
      await dragTo(page, title, 'Bezig');
      await expect(page.getByText('Taak verplaatst')).toBeVisible();
      await page.waitForTimeout(500);

      // Persisted after a reload: the card now opens showing status "Bezig".
      await page.reload();
      await expect(page).toHaveURL(/view=board/);
      await page.getByRole('button', { name: new RegExp(title) }).click();
      await expect(page.getByRole('heading', { name: 'Taak bewerken' })).toBeVisible();
      await expect(page.getByLabel('Status')).toHaveText('Bezig');
      await page.keyboard.press('Escape');

      // 4. Create a task directly from the "Review" column's "+" button.
      const reviewTitle = `Zzz E2E Kanban Review ${Date.now()}`;
      await page.getByRole('button', { name: 'Taak toevoegen in Review' }).click();
      await page.getByLabel('Titel').fill(reviewTitle);
      await page.getByRole('button', { name: 'Opslaan' }).click();
      await expect(page.getByText('Taak aangemaakt')).toBeVisible();
      await page.getByRole('button', { name: new RegExp(reviewTitle) }).click();
      await expect(page.getByLabel('Status')).toHaveText('Review');
      await page.keyboard.press('Escape');

      // 5. View choice survives a reload after switching back to the list.
      await page.getByRole('button', { name: 'Lijst' }).click();
      await expect(page).not.toHaveURL(/view=board/);
      await page.reload();
      await expect(page.getByRole('table')).toBeVisible();
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
    }
  });
});
