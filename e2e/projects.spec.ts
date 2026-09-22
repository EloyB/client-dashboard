import { eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { db } from '@/db';
import { clients, projects } from '@/db/schema';
import { loginAsAdmin } from './helpers/auth';

test.describe('projects overview and form', () => {
  test.beforeEach(async ({ context }) => {
    await loginAsAdmin(context);
  });

  test('creating a project shows validation errors before succeeding', async ({
    page,
  }, testInfo) => {
    const [client] = await db.select().from(clients).limit(1);
    const projectName = `Zzz E2E Project ${Date.now()}-${testInfo.project.name}`;

    await page.goto('/app/projects/new');
    await page.getByRole('button', { name: 'Project opslaan' }).click();

    await expect(page.getByText('Kies een klant.')).toBeVisible();
    await expect(page.getByText('Projectnaam is verplicht')).toBeVisible();
    await expect(page.getByText('Startdatum is verplicht.')).toBeVisible();

    await page.getByRole('combobox', { name: 'Klant' }).click();
    await page.getByRole('option', { name: client.name }).click();
    await page.getByLabel('Projectnaam').fill(projectName);

    await page.getByText('Kies een datum').first().click();
    await page.locator('[role="gridcell"] button:not([disabled])').first().click();
    await page.getByText('Kies een datum').first().click();
    await page.locator('[role="gridcell"] button:not([disabled])').first().click();

    await page.getByRole('button', { name: 'Project opslaan' }).click();
    await page.waitForURL(/\/app\/projects\/[0-9a-f-]+$/);
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible();

    const projectId = page.url().split('/').pop() ?? '';
    await db.delete(projects).where(eq(projects.id, projectId));
  });

  test('filters and search persist across a reload', async ({ page }) => {
    const [client] = await db.select().from(clients).limit(1);
    const shared = `Zzz E2E Filter ${Date.now()}`;
    const [activeProject] = await db
      .insert(projects)
      .values({ clientId: client.id, name: `${shared} actief`, status: 'active' })
      .returning();
    const [plannedProject] = await db
      .insert(projects)
      .values({ clientId: client.id, name: `${shared} gepland`, status: 'planned' })
      .returning();

    try {
      await page.goto(`/app/projects?q=${encodeURIComponent(shared)}&status=active`);
      await expect(page.getByRole('link', { name: `${shared} actief` })).toBeVisible();
      await expect(page.getByRole('link', { name: `${shared} gepland` })).toHaveCount(0);

      await page.reload();
      await expect(page.getByPlaceholder('Zoek op projectnaam')).toHaveValue(shared);
      await expect(page.getByRole('link', { name: `${shared} actief` })).toBeVisible();
      await expect(page.getByRole('link', { name: `${shared} gepland` })).toHaveCount(0);
    } finally {
      await db.delete(projects).where(eq(projects.id, activeProject.id));
      await db.delete(projects).where(eq(projects.id, plannedProject.id));
    }
  });

  test('creating a project from client detail prefills the client', async ({ page }) => {
    const [client] = await db.select().from(clients).limit(1);

    await page.goto(`/app/clients/${client.id}`);
    await page.getByRole('link', { name: 'Nieuw project' }).click();
    await page.waitForURL(/\/app\/projects\/new\?clientId=/);

    await expect(page.getByRole('combobox', { name: 'Klant' })).toHaveText(client.name);
  });

  test('archiving a project works via the confirmation dialog', async ({ page }) => {
    const [client] = await db.select().from(clients).limit(1);
    const [project] = await db
      .insert(projects)
      .values({
        clientId: client.id,
        name: `Zzz E2E Archive ${Date.now()}`,
        status: 'active',
        startDate: '2026-01-01',
        dueDate: '2026-06-01',
      })
      .returning();

    try {
      await page.goto(`/app/projects/${project.id}/edit`);
      await page.getByRole('button', { name: 'Meer acties' }).click();
      await page.getByRole('menuitem', { name: 'Archiveren' }).click();

      const dialog = page.getByRole('alertdialog');
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Archiveren' }).click();

      await expect(page.getByText('Project gearchiveerd', { exact: true })).toBeVisible();
      await page.waitForURL(new RegExp(`/app/projects/${project.id}$`));
      await expect(page.getByText('Gearchiveerd', { exact: true })).toBeVisible();
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
    }
  });
});
