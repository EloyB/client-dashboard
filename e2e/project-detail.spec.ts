import { eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { db } from '@/db';
import { clients, projects } from '@/db/schema';
import { loginAsAdmin } from './helpers/auth';

test.describe('project detail', () => {
  test.beforeEach(async ({ context }) => {
    await loginAsAdmin(context);
  });

  test('opening a project from the overview shows its detail page', async ({ page }) => {
    const [client] = await db.select().from(clients).limit(1);
    const [project] = await db
      .insert(projects)
      .values({
        clientId: client.id,
        name: `Zzz E2E Detail Overview ${Date.now()}`,
        status: 'active',
      })
      .returning();

    try {
      await page.goto(`/app/projects?q=${encodeURIComponent(project.name)}`);
      await page.getByRole('link', { name: project.name }).click();
      await page.waitForURL(`**/app/projects/${project.id}`);

      await expect(page.getByRole('heading', { name: project.name })).toBeVisible();
      await expect(page.getByText('Projectgegevens')).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Overzicht' })).toBeVisible();
      await expect(page.getByText('komt in een latere sessie')).toHaveCount(0);
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
    }
  });

  test('opening a project from client detail shows its detail page', async ({ page }) => {
    const [client] = await db.select().from(clients).limit(1);
    const [project] = await db
      .insert(projects)
      .values({
        clientId: client.id,
        name: `Zzz E2E Detail Client ${Date.now()}`,
        status: 'active',
      })
      .returning();

    try {
      await page.goto(`/app/clients/${client.id}`);
      await page.getByRole('link', { name: project.name }).click();
      await page.waitForURL(`**/app/projects/${project.id}`);

      await expect(page.getByRole('heading', { name: project.name })).toBeVisible();
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
    }
  });

  test('editing a project shows the change on the detail page', async ({ page }) => {
    const [client] = await db.select().from(clients).limit(1);
    const [project] = await db
      .insert(projects)
      .values({
        clientId: client.id,
        name: `Zzz E2E Detail Edit ${Date.now()}`,
        status: 'active',
        startDate: '2026-01-01',
        dueDate: '2026-06-01',
      })
      .returning();
    const newName = `Zzz E2E Detail Edit Bijgewerkt ${Date.now()}`;

    try {
      await page.goto(`/app/projects/${project.id}`);
      await page.getByRole('link', { name: 'Bewerken' }).click();
      await page.waitForURL(`**/app/projects/${project.id}/edit`);

      await page.getByLabel('Projectnaam').fill(newName);
      await page.getByRole('button', { name: 'Wijzigingen opslaan' }).click();
      await page.waitForURL(`**/app/projects/${project.id}`);

      await expect(page.getByRole('heading', { name: newName })).toBeVisible();
      await expect(page.getByText('Project bijgewerkt')).toBeVisible();
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
    }
  });

  test('the active tab persists across a reload', async ({ page }) => {
    const [client] = await db.select().from(clients).limit(1);
    const [project] = await db
      .insert(projects)
      .values({ clientId: client.id, name: `Zzz E2E Detail Tab ${Date.now()}`, status: 'active' })
      .returning();

    try {
      await page.goto(`/app/projects/${project.id}`);
      await page.getByRole('tab', { name: 'Documenten' }).click();
      await page.waitForURL(/tab=documenten/);

      await page.reload();
      await expect(page.getByRole('tab', { name: 'Documenten' })).toHaveAttribute(
        'data-state',
        'active',
      );
      await expect(page.getByText('Nog geen documenten')).toBeVisible();
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
    }
  });

  test('archiving from the detail page updates the badge without leaving the page', async ({
    page,
  }) => {
    const [client] = await db.select().from(clients).limit(1);
    const [project] = await db
      .insert(projects)
      .values({
        clientId: client.id,
        name: `Zzz E2E Detail Archive ${Date.now()}`,
        status: 'active',
      })
      .returning();

    try {
      await page.goto(`/app/projects/${project.id}`);
      await page.getByRole('button', { name: 'Meer acties' }).click();
      await page.getByRole('menuitem', { name: 'Archiveren' }).click();

      const dialog = page.getByRole('alertdialog');
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Archiveren' }).click();

      await expect(page.getByText('Project gearchiveerd', { exact: true })).toBeVisible();
      await expect(page.getByText('Gearchiveerd', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Meer acties' })).toHaveCount(0);
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
    }
  });

  test('a non-existent project id shows the 404 page', async ({ page }) => {
    await page.goto('/app/projects/00000000-0000-0000-0000-000000000000');
    await expect(page.getByText('Deze pagina bestaat niet')).toBeVisible();
  });

  test('an invalid (non-uuid) project id also shows the 404 page', async ({ page }) => {
    await page.goto('/app/projects/not-a-real-id');
    await expect(page.getByText('Deze pagina bestaat niet')).toBeVisible();
  });
});
