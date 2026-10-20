import { eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { db } from '@/db';
import { clients, events, projects } from '@/db/schema';
import { combineBrusselsDateTime, todayInBrussels } from '@/lib/utils';
import { loginAsAdmin } from './helpers/auth';

test.describe('globale kalender (slice 8b)', () => {
  test.beforeEach(async ({ context }) => {
    await loginAsAdmin(context);
  });

  test('maand navigeren, event bewerken via popover, event aanmaken vanuit een datum, periode blijft behouden', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop', 'Maand/weekraster is enkel op desktop.');

    const [client] = await db.select().from(clients).limit(1);
    const [project] = await db
      .insert(projects)
      .values({ clientId: client.id, name: `Zzz E2E Kalender ${Date.now()}`, status: 'active' })
      .returning();
    const title = `Zzz E2E Overleg ${Date.now()}`;
    const today = todayInBrussels();

    await db.insert(events).values({
      projectId: project.id,
      title,
      type: 'meeting',
      startsAt: combineBrusselsDateTime(today, '10:00'),
      endsAt: combineBrusselsDateTime(today, '11:00'),
    });

    try {
      await page.goto('/app/calendar');
      await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();
      await expect(page.getByTestId(`month-cell-${today}`).getByText(title)).toBeVisible();

      // Navigate forward and back a month — the period label updates, the
      // current month's event is no longer on screen while away.
      const monthLabel = page.getByText(/^[a-zéû]+ \d{4}$/i);
      const initialLabel = await monthLabel.textContent();
      await page.getByRole('button', { name: 'Volgende' }).click();
      await expect(monthLabel).not.toHaveText(initialLabel ?? '');
      await expect(page.getByText(title)).toHaveCount(0);
      await page.getByRole('button', { name: 'Vorige' }).click();
      await expect(monthLabel).toHaveText(initialLabel ?? '');
      await expect(page.getByTestId(`month-cell-${today}`).getByText(title)).toBeVisible();

      // Open the popover and edit from there.
      await page.getByTestId(`month-cell-${today}`).getByText(title).click();
      await expect(page.getByText('Wanneer')).toBeVisible();
      await page.getByRole('button', { name: 'Bewerken' }).click();
      await expect(page.getByRole('heading', { name: 'Agenda-item bewerken' })).toBeVisible();
      const newTitle = `${title} (bewerkt)`;
      await page.getByLabel('Titel').fill(newTitle);
      await page.getByRole('button', { name: 'Opslaan' }).click();
      await expect(page.getByText('Agenda-item bijgewerkt')).toBeVisible();
      await expect(page.getByTestId(`month-cell-${today}`).getByText(newTitle)).toBeVisible();

      // Create an event from a clicked date — its start date is pre-filled.
      await page
        .getByTestId(`month-cell-${today}`)
        .getByRole('button', { name: `Item toevoegen op ${today}` })
        .click();
      await expect(page.getByRole('heading', { name: 'Agenda-item toevoegen' })).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'Project *' })).toBeVisible();
      const newEventTitle = `Zzz E2E Nieuw ${Date.now()}`;
      await page.getByRole('combobox', { name: 'Project *' }).click();
      await page.getByRole('option', { name: project.name }).click();
      await page.getByLabel('Titel').fill(newEventTitle);
      await page.getByLabel('Hele dag').click();
      // The end date keeps its placeholder — only start is pre-filled from the clicked day.
      await expect(page.getByText('Kies een datum')).toHaveCount(1);
      await page.getByRole('button', { name: 'Opslaan' }).click();
      await expect(page.getByText('Agenda-item aangemaakt')).toBeVisible();
      await expect(page.getByTestId(`month-cell-${today}`).getByText(newEventTitle)).toBeVisible();

      // Switch to week view — the choice survives a reload.
      await page.getByRole('button', { name: 'Week', exact: true }).click();
      await expect(page).toHaveURL(/view=week/);
      await page.reload();
      await expect(page).toHaveURL(/view=week/);
      await expect(page.getByRole('button', { name: 'Week', exact: true })).toHaveAttribute(
        'data-variant',
        'default',
      );
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
    }
  });

  test('agendalijst op 375px toont events per dag zonder horizontaal scrollen', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile', 'Enkel relevant op de 375px-breedte.');

    const [client] = await db.select().from(clients).limit(1);
    const [project] = await db
      .insert(projects)
      .values({
        clientId: client.id,
        name: `Zzz E2E Kalender Mobiel ${Date.now()}`,
        status: 'active',
      })
      .returning();
    const title = `Zzz E2E Mobiel Event ${Date.now()}`;
    const today = todayInBrussels();

    await db.insert(events).values({
      projectId: project.id,
      title,
      type: 'meeting',
      startsAt: combineBrusselsDateTime(today, '10:00'),
      endsAt: combineBrusselsDateTime(today, '11:00'),
    });

    try {
      await page.goto('/app/calendar');
      await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();
      await expect(page.getByTestId(`agenda-day-${today}`).getByText(title)).toBeVisible();

      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalScroll).toBe(false);

      // Tapping the event opens the detail sheet.
      await page.getByTestId(`agenda-day-${today}`).getByText(title).click();
      await expect(page.getByText('Naar project')).toBeVisible();
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
    }
  });
});
