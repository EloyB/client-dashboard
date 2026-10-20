import { eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { db } from '@/db';
import { clients, projects, tickets, user } from '@/db/schema';
import { loginAsAdmin } from './helpers/auth';

test.describe('ticket omzetten naar taak (slice 7d)', () => {
  test.beforeEach(async ({ context }) => {
    await loginAsAdmin(context);
  });

  test('omzetten maakt een gekoppelde taak, zichtbaar in beide richtingen', async ({ page }) => {
    const [client] = await db.select().from(clients).limit(1);
    const [project] = await db
      .insert(projects)
      .values({ clientId: client.id, name: `Zzz E2E Omzetten ${Date.now()}`, status: 'active' })
      .returning();
    const [admin] = await db.select().from(user).where(eq(user.role, 'admin')).limit(1);
    const title = `Zzz E2E Ticket ${Date.now()}`;
    const [ticket] = await db
      .insert(tickets)
      .values({
        projectId: project.id,
        reportedById: admin.id,
        title,
        description: 'Contactformulier geeft een foutmelding.',
        status: 'new',
        priority: 'medium',
      })
      .returning();

    try {
      await page.goto(`/app/tickets/${ticket.id}`);
      await expect(page.getByText('Nog geen taak gekoppeld')).toBeVisible();

      await page.getByRole('button', { name: 'Omzetten naar taak' }).click();
      await expect(page.getByRole('heading', { name: 'Omzetten naar taak' })).toBeVisible();
      await expect(page.getByLabel('Titel')).toHaveValue(title);
      await expect(page.getByLabel('Omschrijving')).toContainText('Contactformulier geeft');

      await page.getByRole('button', { name: 'Taak aanmaken' }).click();
      await expect(page.getByRole('heading', { name: 'Taak aangemaakt' })).toBeVisible();
      await expect(page.getByText(/TSK-.+ aangemaakt/)).toBeVisible();

      // The ticket itself is now "In behandeling" (the switch defaults to checked).
      await page.getByRole('link', { name: 'Naar de taak' }).click();
      await page.waitForURL(/\/tasks\?view=board&status=in_progress/);
      await expect(page.getByText(title).first()).toBeVisible();

      // Back on the ticket, the card now links to the task instead of offering a conversion.
      await page.goto(`/app/tickets/${ticket.id}`);
      await expect(page.getByText('Nog geen taak gekoppeld')).toHaveCount(0);
      await expect(page.getByText('Gekoppelde taak')).toBeVisible();
      await expect(page.getByText(title).first()).toBeVisible();
      await expect(page.getByText('In behandeling').first()).toBeVisible();

      // The task also links back to the ticket — the list view's own
      // ticket column shows it as a link (the kanban card shows the
      // reference as plain text, since it sits inside the draggable card).
      await page.goto(`/app/projects/${project.id}/tasks`);
      await page.getByRole('link', { name: /TCK-/ }).first().click();
      await page.waitForURL(`**/app/tickets/${ticket.id}`);
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
    }
  });
});
