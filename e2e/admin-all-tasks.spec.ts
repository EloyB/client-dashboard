import { eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { db } from '@/db';
import { clients, projects, tasks } from '@/db/schema';
import { loginAsAdmin } from './helpers/auth';

test.describe('al mijn taken (slice 7e)', () => {
  test.beforeEach(async ({ context }) => {
    await loginAsAdmin(context);
  });

  test('status wijzigen vanuit het overzicht, filters blijven behouden, achterstallige taken bovenaan', async ({
    page,
  }) => {
    const [client] = await db.select().from(clients).limit(1);
    const [project] = await db
      .insert(projects)
      .values({
        clientId: client.id,
        name: `Zzz E2E Al Mijn Taken ${Date.now()}`,
        status: 'active',
      })
      .returning();
    const overdueTitle = `Zzz E2E Achterstallig ${Date.now()}`;
    const laterTitle = `Zzz E2E Later ${Date.now()}`;

    const [overdueTask] = await db
      .insert(tasks)
      .values({
        projectId: project.id,
        title: overdueTitle,
        status: 'todo',
        position: 'a0',
        dueDate: '2020-01-01',
      })
      .returning();
    await db.insert(tasks).values({
      projectId: project.id,
      title: laterTitle,
      status: 'todo',
      position: 'a1',
      dueDate: '2099-01-01',
    });

    try {
      await page.goto('/app/board');
      await expect(page.getByRole('heading', { name: 'Al mijn taken' })).toBeVisible();

      // Overdue group renders before the "later" group, at the top.
      await expect(page.getByRole('heading', { name: 'Achterstallig' })).toBeVisible();
      const headings = page.locator('h2');
      const firstGroupText = await headings.first().textContent();
      expect(firstGroupText).toContain('Achterstallig');
      await expect(page.getByText(overdueTitle)).toBeVisible();
      await expect(page.getByText(laterTitle)).toBeVisible();

      // Change status inline, directly from this overview.
      const row = page.getByTestId(`task-row-${overdueTask.id}`);
      await row.getByLabel('Status').click();
      await page.getByRole('option', { name: 'Bezig' }).click();
      await expect(page.getByText('Status bijgewerkt')).toBeVisible();

      // Filter by project, persisted across a reload.
      await page.getByLabel('Alle projecten').click();
      await page.getByRole('option', { name: project.name }).click();
      await expect(page).toHaveURL(new RegExp(`project=${project.id}`));
      await page.reload();
      await expect(page).toHaveURL(new RegExp(`project=${project.id}`));
      await expect(page.getByText(overdueTitle)).toBeVisible();
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
    }
  });
});
