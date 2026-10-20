import { eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { db } from '@/db';
import { clients, projects } from '@/db/schema';
import { loginAsAdmin } from './helpers/auth';

test.describe('admin kanbanbord op mobiel (slice 7c)', () => {
  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile', 'Only relevant at the 375px viewport');
    await loginAsAdmin(context);
  });

  test('kolom wisselen, status wijzigen via select, actieve kolom blijft behouden, geen horizontale scroll', async ({
    page,
  }) => {
    const [client] = await db.select().from(clients).limit(1);
    const [project] = await db
      .insert(projects)
      .values({
        clientId: client.id,
        name: `Zzz E2E Kanban Mobiel ${Date.now()}`,
        status: 'active',
      })
      .returning();
    const title = `Zzz E2E Kanban Mobiel Taak ${Date.now()}`;

    try {
      await page.goto(`/app/projects/${project.id}/tasks?view=board`);

      // 1. A brand-new project has no tasks anywhere yet, so the generic
      // empty state shows first — create the first task through its button.
      await page.getByRole('button', { name: 'Taak toevoegen' }).first().click();
      await page.getByLabel('Titel').fill(title);
      await page.getByRole('button', { name: 'Opslaan' }).click();
      await expect(page.getByText('Taak aangemaakt')).toBeVisible();
      await expect(page.getByText(title)).toBeVisible();

      // 2. Switch columns via the pill switcher — the new one is empty.
      await page.getByRole('button', { name: /^Bezig/ }).click();
      await expect(page).toHaveURL(/status=in_progress/);
      await expect(page.getByText('Geen taken in deze kolom')).toBeVisible();
      await expect(page.getByText(title)).toHaveCount(0);

      // 3. Back to "Te doen", change status via the card's own select — no drag.
      await page.getByRole('button', { name: /^Te doen/ }).click();
      await expect(page).toHaveURL(/status=todo/);
      await page.getByLabel('Status').click();
      await page.getByRole('option', { name: 'Review' }).click();
      await expect(page.getByText('Status bijgewerkt')).toBeVisible();
      await expect(page.getByText(title)).toHaveCount(0);

      // 4. The task now shows up under "Review".
      await page.getByRole('button', { name: /^Review/ }).click();
      await expect(page).toHaveURL(/status=review/);
      await expect(page.getByText(title)).toBeVisible();

      // 5. The active column survives a reload.
      await page.reload();
      await expect(page).toHaveURL(/status=review/);
      await expect(page.getByText(title)).toBeVisible();

      // 6. No horizontal page scroll at 375px.
      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalScroll).toBe(false);
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
    }
  });
});
