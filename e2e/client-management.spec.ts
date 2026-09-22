import { eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { db } from '@/db';
import { clients, user as userTable } from '@/db/schema';
import { loginAsAdmin } from './helpers/auth';
import { extractLink, mailpitHtml, waitForMailpitMessage } from './helpers/mailpit';

function unique(prefix: string, testInfo: { project: { name: string } }) {
  return `${prefix}-${Date.now()}-${testInfo.project.name.toLowerCase()}@example.test`;
}

test.describe('client management', () => {
  test.beforeEach(async ({ context }) => {
    await loginAsAdmin(context);
  });

  test('creating and editing a client shows validation errors before succeeding', async ({
    page,
  }, testInfo) => {
    const email = unique('e2e-client', testInfo);

    await page.goto('/app/clients/new');
    await page.getByRole('button', { name: 'Klant opslaan' }).click();
    await expect(page.getByText('Bedrijfsnaam is verplicht')).toBeVisible();

    // "Zzz" keeps this ahead of every seeded client alphabetically, so it
    // can't land on the same paginated page as a seeded client another spec
    // file asserts on when specs run in parallel.
    await page.getByLabel('Bedrijfsnaam').fill('Zzz E2E Testklant');
    await page.getByLabel('Algemeen e-mailadres').fill(email);
    await page.getByRole('button', { name: 'Klant opslaan' }).click();
    await page.waitForURL(/\/app\/clients\/[0-9a-f-]+$/);
    await expect(page.getByText('Klant aangemaakt')).toBeVisible();

    const clientId = page.url().split('/').pop() ?? '';

    try {
      await page.getByRole('link', { name: 'Bewerken' }).click();
      await page.waitForURL(/\/edit$/);

      await page.getByLabel('Bedrijfsnaam').fill('');
      await page.getByRole('button', { name: 'Wijzigingen opslaan' }).click();
      await expect(page.getByText('Bedrijfsnaam is verplicht')).toBeVisible();

      await page.getByLabel('Bedrijfsnaam').fill('Zzz E2E Testklant Bijgewerkt');
      await page.getByRole('button', { name: 'Wijzigingen opslaan' }).click();
      await page.waitForURL(new RegExp(`/app/clients/${clientId}$`));
      await expect(page.getByText('Klant bijgewerkt', { exact: true })).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Zzz E2E Testklant Bijgewerkt' }),
      ).toBeVisible();
    } finally {
      await db.delete(clients).where(eq(clients.id, clientId));
    }
  });

  test('inviting a user sends a real email, and resending it works', async ({ page }, testInfo) => {
    const clientEmail = unique('e2e-invite-client', testInfo);
    const invitedEmail = unique('e2e-invited', testInfo);
    const [client] = await db
      .insert(clients)
      // "Zzz" keeps this ahead of every seeded client alphabetically, so it
      // can't land on the same paginated page as a seeded client another
      // spec file asserts on when specs run in parallel.
      .values({ name: `Zzz E2E Invite Client ${Date.now()}`, email: clientEmail })
      .returning();

    try {
      await page.goto(`/app/clients/${client.id}`);
      await page.getByRole('button', { name: 'Gebruiker uitnodigen' }).click();
      await page.getByLabel('Naam').fill('E2E Genodigde');
      await page.getByLabel('E-mailadres').fill(invitedEmail);
      await page.getByRole('button', { name: 'Uitnodiging versturen' }).click();
      await expect(page.getByText('Uitnodiging verstuurd')).toBeVisible();
      await expect(page.getByText('E2E Genodigde', { exact: true })).toBeVisible();
      await expect(page.getByText('Uitgenodigd')).toBeVisible();

      const message = await waitForMailpitMessage(invitedEmail, 'Uitnodiging');
      const html = await mailpitHtml(message.ID);
      expect(extractLink(html, '/uitnodiging/')).toBeTruthy();

      await page.getByRole('button', { name: 'Opnieuw uitnodigen' }).click();
      await expect(page.getByText('Uitnodiging opnieuw verstuurd')).toBeVisible();
    } finally {
      await db.delete(userTable).where(eq(userTable.email, invitedEmail));
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  test('revoking access removes the user after confirmation', async ({ page }, testInfo) => {
    const clientEmail = unique('e2e-revoke-client', testInfo);
    const userEmail = unique('e2e-revoke-user', testInfo);
    const [client] = await db
      .insert(clients)
      .values({ name: `Zzz E2E Revoke Client ${Date.now()}`, email: clientEmail })
      .returning();
    const [clientUser] = await db
      .insert(userTable)
      .values({
        name: 'E2E Revoke Target',
        email: userEmail,
        role: 'client',
        clientId: client.id,
        emailVerified: true,
      })
      .returning();

    try {
      await page.goto(`/app/clients/${client.id}`);
      await expect(page.getByText('E2E Revoke Target')).toBeVisible();

      await page.getByRole('button', { name: 'Toegang intrekken' }).click();
      const dialog = page.getByRole('alertdialog');
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Toegang intrekken' }).click();

      await expect(page.getByText('Toegang ingetrokken')).toBeVisible();
      await expect(page.getByText('E2E Revoke Target')).toHaveCount(0);
    } finally {
      await db.delete(userTable).where(eq(userTable.id, clientUser.id));
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });
});
