import { eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { db } from '@/db';
import { clients, user as userTable } from '@/db/schema';
import { inviteClientUser } from '@/features/clients/service';
import { extractLink, mailpitHtml, waitForMailpitMessage } from './helpers/mailpit';

const SEEDED_CLIENT_EMAIL = 'info@verlinden-zn.be';
const ADMIN_EMAIL = 'eloy@studioswyft.be';

// Better Auth's magic-link rate limit is keyed by IP + path, and Desktop and
// Mobile both run as plain Chromium on this same machine (same IP) — so a
// real HTTP hit against /sign-in/magic-link or /magic-link/verify counts
// against one shared budget across both projects. Desktop-only avoids
// exceeding it, same reasoning as e2e/auth.spec.ts's login-rate-limit tests.
function desktopOnly(testInfo: { project: { name: string } }) {
  test.skip(
    testInfo.project.name !== 'Desktop',
    'Shares the magic-link rate limit (keyed by IP) across projects; avoid doubling it',
  );
}

function uniqueEmail(prefix: string) {
  // Lowercase: Better Auth's internal adapter lowercases email before every
  // lookup, so a mixed-case stored address would silently never be found.
  return `${prefix}-${Date.now()}-${test.info().project.name.toLowerCase()}@example.test`;
}

test.describe('client invitation', () => {
  test('accepting an invitation signs the client in via the caught emails', async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo);

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.email, SEEDED_CLIENT_EMAIL))
      .limit(1);
    const [admin] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, ADMIN_EMAIL))
      .limit(1);
    const invitedEmail = uniqueEmail('e2e-invite');

    await inviteClientUser(
      { name: 'E2E Invite Test', email: invitedEmail, clientId: client.id },
      admin.id,
    );

    try {
      const inviteMessage = await waitForMailpitMessage(invitedEmail, 'Uitnodiging');
      const inviteHtml = await mailpitHtml(inviteMessage.ID);
      const inviteLink = extractLink(inviteHtml, '/uitnodiging/');

      await page.goto(inviteLink);
      await expect(page.getByText('Welkom in het portaal van')).toBeVisible();

      await page.getByRole('button', { name: 'Doorgaan' }).click();
      await expect(page.getByText('Kijk in uw mailbox')).toBeVisible();

      const magicLinkMessage = await waitForMailpitMessage(invitedEmail, 'aanmeldlink');
      const magicLinkHtml = await mailpitHtml(magicLinkMessage.ID);
      const magicLink = extractLink(magicLinkHtml, '/magic-link/verify');

      await page.goto(magicLink);
      await expect(page).toHaveURL(/\/portal$/);
    } finally {
      await db.delete(userTable).where(eq(userTable.email, invitedEmail));
    }
  });

  test('an unknown or already-used invitation link shows the expired screen', async ({ page }) => {
    await page.goto('/uitnodiging/this-token-does-not-exist');
    await expect(page.getByText('Deze uitnodiging is niet meer geldig')).toBeVisible();
  });
});

test.describe('client sign-in via magic link', () => {
  test('requesting a sign-in link and clicking it lands on the portal', async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo);

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.email, SEEDED_CLIENT_EMAIL))
      .limit(1);
    const email = uniqueEmail('e2e-signin');
    const [clientUser] = await db
      .insert(userTable)
      .values({
        name: 'E2E Sign-in Test',
        email,
        role: 'client',
        clientId: client.id,
        emailVerified: true,
      })
      .returning();

    try {
      await page.goto('/aanmelden');
      await page.getByLabel('E-mailadres').fill(email);
      await page.getByRole('button', { name: 'Stuur mij een aanmeldlink' }).click();
      await expect(page.getByText('Kijk in uw mailbox')).toBeVisible();

      const message = await waitForMailpitMessage(email, 'aanmeldlink');
      const html = await mailpitHtml(message.ID);
      const magicLink = extractLink(html, '/magic-link/verify');

      await page.goto(magicLink);
      await expect(page).toHaveURL(/\/portal$/);
    } finally {
      await db.delete(userTable).where(eq(userTable.id, clientUser.id));
    }
  });

  test('an expired or already-used sign-in link shows the right screen', async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo);

    await page.goto(
      '/api/auth/magic-link/verify?token=does-not-exist&callbackURL=%2Fportal&errorCallbackURL=%2Faanmelden',
    );
    await expect(page).toHaveURL(/\/aanmelden\?error=INVALID_TOKEN/);
    await expect(page.getByText('Deze link werkt niet meer')).toBeVisible();
  });
});
