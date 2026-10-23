import { addDays } from 'date-fns';
import { eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { db } from '@/db';
import { clients, events, projects, tasks, tickets, user as userTable } from '@/db/schema';
import {
  combineBrusselsDateTime,
  formatDateOnly,
  parseDateOnly,
  todayInBrussels,
} from '@/lib/utils';
import { loginAsAdmin } from './helpers/auth';

// Desktop and Mobile run this file in parallel workers — Date.now() alone
// can collide between them in the same millisecond, so always pair it with
// a UUID (same fix as the earlier portal-calendar project-name collision).
function unique(): string {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

test.describe('admin-homepage (slice 9a)', () => {
  test.beforeEach(async ({ context }) => {
    await loginAsAdmin(context);
  });

  test('elke sectie toont de juiste items, en "alles bekijken"-links houden hun filters', async ({
    page,
  }, testInfo) => {
    const [client] = await db.select().from(clients).limit(1);
    const [clientUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.clientId, client.id))
      .limit(1);
    const [project] = await db
      .insert(projects)
      .values({ clientId: client.id, name: `Zzz E2E Dashboard ${unique()}`, status: 'active' })
      .returning();

    const today = todayInBrussels();
    const tomorrow = formatDateOnly(addDays(parseDateOnly(today)!, 1))!;

    const ticketTitle = `Zzz E2E Nieuw ticket ${unique()}`;
    const [ticket] = await db
      .insert(tickets)
      .values({
        projectId: project.id,
        reportedById: clientUser.id,
        title: ticketTitle,
        status: 'new',
        priority: 'high',
      })
      .returning();

    const overdueTitle = `Zzz E2E Achterstallige taak ${unique()}`;
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

    const eventTitle = `Zzz E2E Agenda-item ${unique()}`;
    const [event] = await db
      .insert(events)
      .values({
        projectId: project.id,
        title: eventTitle,
        type: 'meeting',
        startsAt: combineBrusselsDateTime(tomorrow, '10:00'),
        endsAt: combineBrusselsDateTime(tomorrow, '11:00'),
      })
      .returning();

    try {
      await page.goto('/app');

      await expect(page.getByText(ticketTitle)).toBeVisible();
      await expect(page.getByText(eventTitle)).toBeVisible();
      await expect(page.getByText(overdueTitle)).toBeVisible();
      await expect(page.getByText('Te laat', { exact: true })).toBeVisible();
      await expect(page.getByText(project.name).first()).toBeVisible();

      await page.getByRole('link', { name: 'Alle tickets' }).click();
      await expect(page).toHaveURL(/status=new/);
      // The tickets table renders both a desktop and a mobile layout (CSS-toggled, DataTable pattern) — pick the one actually visible at this viewport.
      const ticketMatch = page.getByText(ticketTitle);
      await expect(
        testInfo.project.name === 'Mobile' ? ticketMatch.last() : ticketMatch.first(),
      ).toBeVisible();

      await page.goto('/app');
      await page.getByRole('link', { name: 'Alle projecten' }).click();
      await expect(page).toHaveURL(/status=active/);

      await page.goto('/app');
      await page.getByRole('link', { name: 'Volledige agenda' }).click();
      await expect(page).toHaveURL(/\/app\/calendar/);
    } finally {
      await db.delete(tickets).where(eq(tickets.id, ticket.id));
      await db.delete(tasks).where(eq(tasks.id, overdueTask.id));
      await db.delete(events).where(eq(events.id, event.id));
      await db.delete(projects).where(eq(projects.id, project.id));
    }
  });

  test('"+ Taak" en "+ Agenda-item" openen het aanmaakformulier met projectkiezer', async ({
    page,
  }) => {
    await page.goto('/app');

    await page.getByRole('button', { name: 'Taak' }).click();
    await expect(page.getByRole('heading', { name: 'Taak toevoegen' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Project *' })).toBeVisible();
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Agenda-item' }).click();
    await expect(page.getByRole('heading', { name: 'Agenda-item toevoegen' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Project *' })).toBeVisible();
  });
});
