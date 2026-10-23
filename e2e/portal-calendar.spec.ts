import { addDays } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { db } from '@/db';
import { clients, events, projects } from '@/db/schema';
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

test.describe('agenda in het klantportaal (slice 8c)', () => {
  test('klant ziet een zichtbaar event, niet een intern event, en het verdwijnt zodra zichtbaarheid uitstaat', async ({
    page,
  }) => {
    const { clientName, projectNames, cleanup } = await loginAsTempClient(page.context(), 1);
    const project = await findTempProject(clientName, projectNames[0]);

    // Tomorrow, not today: a fixed clock time earlier in the day than the
    // actual run time would already count as "past" (see slice 8a's note).
    const tomorrow = formatDateOnly(addDays(parseDateOnly(todayInBrussels())!, 1))!;
    const visibleTitle = `Zzz E2E Portaal Zichtbaar ${Date.now()}`;
    const internalTitle = `Zzz E2E Portaal Intern ${Date.now()}`;

    const [visibleEvent] = await db
      .insert(events)
      .values({
        projectId: project.id,
        title: visibleTitle,
        description: 'Een duidelijke uitleg voor de klant.',
        type: 'meeting',
        startsAt: combineBrusselsDateTime(tomorrow, '14:00'),
        endsAt: combineBrusselsDateTime(tomorrow, '15:00'),
        location: 'Videocall',
        visibleToClient: true,
      })
      .returning();

    await db.insert(events).values({
      projectId: project.id,
      title: internalTitle,
      type: 'other',
      startsAt: combineBrusselsDateTime(tomorrow, '09:00'),
      visibleToClient: false,
    });

    try {
      await page.goto('/portal/calendar');
      await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();

      // Visible event shows with its plain-language type and explanatory text.
      await expect(page.getByText(visibleTitle)).toBeVisible();
      await expect(page.getByText('Een duidelijke uitleg voor de klant.')).toBeVisible();
      await expect(
        page.getByRole('tabpanel', { name: /Komende/ }).getByText('Overleg'),
      ).toBeVisible();

      // Internal (visibleToClient: false) event never appears.
      await expect(page.getByText(internalTitle)).toHaveCount(0);

      // Toggle visibility off from the admin side — it disappears from the portal.
      await db.update(events).set({ visibleToClient: false }).where(eq(events.id, visibleEvent.id));
      await page.reload();
      await expect(page.getByText(visibleTitle)).toHaveCount(0);
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
      await cleanup();
    }
  });

  test('voorbije items staan onder het Voorbij-tabblad, niet onder Komende', async ({ page }) => {
    const { clientName, projectNames, cleanup } = await loginAsTempClient(page.context(), 1);
    const project = await findTempProject(clientName, projectNames[0]);

    const pastTitle = `Zzz E2E Portaal Voorbij ${Date.now()}`;

    await db.insert(events).values({
      projectId: project.id,
      title: pastTitle,
      type: 'meeting',
      startsAt: combineBrusselsDateTime('2020-01-15', '10:00'),
      endsAt: combineBrusselsDateTime('2020-01-15', '11:00'),
      visibleToClient: true,
    });

    try {
      await page.goto('/portal/calendar');
      await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();
      await expect(page.getByText(pastTitle)).toHaveCount(0);

      await page.getByRole('tab', { name: 'Voorbij' }).click();
      await expect(page.getByText(pastTitle)).toBeVisible();
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
      await cleanup();
    }
  });
});
