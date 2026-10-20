import { addDays } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { db } from '@/db';
import {
  clients,
  documents,
  events,
  files,
  projects,
  tickets,
  user as userTable,
} from '@/db/schema';
import {
  combineBrusselsDateTime,
  formatDateOnly,
  parseDateOnly,
  todayInBrussels,
} from '@/lib/utils';
import { loginAsTempClient } from './helpers/auth';

async function findTempProject(clientName: string, projectName: string) {
  const [client] = await db.select().from(clients).where(eq(clients.name, clientName)).limit(1);
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.clientId, client.id), eq(projects.name, projectName)))
    .limit(1);
  return project;
}

test.describe('startscherm klantportaal (slice 9b)', () => {
  test('toont meldingen, projecten, agenda en documenten van de eigen klant, en de "alles bekijken"-links werken', async ({
    page,
  }, testInfo) => {
    const { clientName, projectNames, cleanup } = await loginAsTempClient(page.context(), 1);
    const project = await findTempProject(clientName, projectNames[0]);
    await db
      .update(projects)
      .set({ description: 'Wij werken aan uw nieuwe website.', status: 'active' })
      .where(eq(projects.id, project.id));

    const [clientUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.clientId, project.clientId))
      .limit(1);

    const today = todayInBrussels();
    const tomorrow = formatDateOnly(addDays(parseDateOnly(today)!, 1))!;

    const ticketTitle = `Zzz E2E Portaalstart melding ${Date.now()}-${crypto.randomUUID()}`;
    await db.insert(tickets).values({
      projectId: project.id,
      reportedById: clientUser.id,
      title: ticketTitle,
      status: 'in_progress',
      priority: 'high',
    });

    const eventTitle = `Zzz E2E Portaalstart agenda ${Date.now()}-${crypto.randomUUID()}`;
    await db.insert(events).values({
      projectId: project.id,
      title: eventTitle,
      description: 'U hoeft niets voor te bereiden.',
      type: 'meeting',
      startsAt: combineBrusselsDateTime(tomorrow, '10:00'),
      endsAt: combineBrusselsDateTime(tomorrow, '11:00'),
      visibleToClient: true,
    });

    const [file] = await db
      .insert(files)
      .values({
        storageKey: `test/${crypto.randomUUID()}.pdf`,
        filename: 'factuur.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedById: clientUser.id,
      })
      .returning();
    const documentTitle = `Zzz E2E Portaalstart document ${Date.now()}-${crypto.randomUUID()}`;
    await db.insert(documents).values({
      projectId: project.id,
      fileId: file.id,
      title: documentTitle,
      type: 'invoice',
      visibleToClient: true,
    });

    // An internal event and an invisible document must never appear.
    const internalEventTitle = `Zzz E2E Intern, niet zichtbaar ${Date.now()}`;
    await db.insert(events).values({
      projectId: project.id,
      title: internalEventTitle,
      type: 'meeting',
      startsAt: combineBrusselsDateTime(tomorrow, '14:00'),
      visibleToClient: false,
    });
    const internalDocumentTitle = `Zzz E2E Intern document ${Date.now()}`;
    await db.insert(documents).values({
      projectId: project.id,
      fileId: file.id,
      title: internalDocumentTitle,
      visibleToClient: false,
    });

    try {
      await page.goto('/portal');
      await expect(page.getByText('Ziet u iets dat niet werkt')).toBeVisible();

      await expect(page.getByText(ticketTitle)).toBeVisible();
      await expect(page.getByText(project.name).first()).toBeVisible();
      await expect(page.getByText('Wij werken aan uw nieuwe website.')).toBeVisible();
      await expect(page.getByText(eventTitle, { exact: true })).toBeVisible();
      await expect(page.getByText('U hoeft niets voor te bereiden.')).toBeVisible();
      await expect(page.getByText(documentTitle)).toBeVisible();

      await expect(page.getByText(internalEventTitle)).toHaveCount(0);
      await expect(page.getByText(internalDocumentTitle)).toHaveCount(0);

      await page.getByRole('link', { name: 'Alle meldingen' }).click();
      await expect(page).toHaveURL(/\/portal\/tickets$/);
      // The tickets table renders both a desktop and a mobile layout (CSS-toggled, DataTable pattern) — pick the one actually visible at this viewport.
      const ticketMatch = page.getByText(ticketTitle);
      await expect(
        testInfo.project.name === 'Mobile' ? ticketMatch.last() : ticketMatch.first(),
      ).toBeVisible();

      await page.goto('/portal');
      await page.getByRole('link', { name: 'Agenda', exact: true }).click();
      await expect(page).toHaveURL(/\/portal\/calendar/);

      await page.goto('/portal');
      await page.getByRole('link', { name: 'Alle documenten' }).click();
      await expect(page).toHaveURL(/\/portal\/documents/);
    } finally {
      await db.delete(tickets).where(eq(tickets.projectId, project.id));
      await db.delete(events).where(eq(events.projectId, project.id));
      await db.delete(documents).where(eq(documents.projectId, project.id));
      await db.delete(files).where(eq(files.id, file.id));
      await db.delete(projects).where(eq(projects.id, project.id));
      await cleanup();
    }
  });

  test('vriendelijke lege staten verschijnen voor een nieuwe klant zonder data', async ({
    page,
  }) => {
    const { cleanup } = await loginAsTempClient(page.context(), 0);

    try {
      await page.goto('/portal');
      await expect(page.getByText('Nog geen meldingen')).toBeVisible();
      await expect(page.getByText('Nog geen projecten')).toBeVisible();
      await expect(page.getByText('Niets gepland')).toBeVisible();
      await expect(page.getByText('Nog geen documenten')).toBeVisible();
    } finally {
      await cleanup();
    }
  });
});
