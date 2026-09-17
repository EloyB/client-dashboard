import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { db } from '@/db';
import { account, user as userTable } from '@/db/schema';
import { auth } from '@/lib/auth';
import { extractLink, mailpitHtml, waitForMailpitMessage } from './helpers/mailpit';

// Uses a dedicated, disposable admin account rather than the real seeded
// admin (see e2e/helpers/auth.ts's CLIENT_TEST_EMAIL for the same reasoning)
// so this test never changes the credentials used to actually run the app.
test.describe('admin forgot/reset password', () => {
  test('requesting and using a reset link signs in with the new password', async ({ page }) => {
    // Lowercase: Better Auth's internal adapter lowercases email before every
    // lookup, so a mixed-case stored address would silently never be found.
    const email = `e2e-reset-${Date.now()}-${test.info().project.name.toLowerCase()}@example.test`;
    const oldPassword = 'OudWachtwoord123!';
    const newPassword = 'NieuwWachtwoord123!';

    const [tempAdmin] = await db
      .insert(userTable)
      .values({ name: 'E2E Reset Admin', email, role: 'admin', emailVerified: true })
      .returning();
    await db.insert(account).values({
      accountId: tempAdmin.id,
      providerId: 'credential',
      userId: tempAdmin.id,
      password: await hashPassword(oldPassword),
    });

    try {
      await page.goto('/login/wachtwoord-vergeten');
      await page.getByLabel('E-mailadres').fill(email);
      await page.getByRole('button', { name: 'Stuur de link' }).click();
      await expect(page.getByText('Controleer uw mailbox')).toBeVisible();

      const message = await waitForMailpitMessage(email);
      const html = await mailpitHtml(message.ID);
      const resetLink = extractLink(html, '/reset-password/');

      await page.goto(resetLink);
      await expect(page).toHaveURL(/wachtwoord-resetten\?token=/);

      await page.locator('#password').fill(newPassword);
      await page.locator('#confirmPassword').fill(newPassword);
      await page.getByRole('button', { name: 'Wachtwoord instellen' }).click();
      await expect(page.getByText('Wachtwoord aangepast')).toBeVisible();

      // Verifies the new credentials directly against auth.api (in-process,
      // bypassing the HTTP router) instead of a second real browser sign-in —
      // that HTTP call would share the /sign-in/email rate-limit bucket with
      // e2e/auth.spec.ts's own login tests. See e2e/helpers/auth.ts for the
      // same pattern.
      await expect(
        auth.api.signInEmail({ body: { email, password: newPassword } }),
      ).resolves.toMatchObject({ user: { email } });
    } finally {
      await db.delete(userTable).where(eq(userTable.id, tempAdmin.id));
    }
  });

  test('an expired or invalid reset link shows the right screen', async ({ page }) => {
    await page.goto('/login/wachtwoord-resetten?error=INVALID_TOKEN');
    await expect(page.getByText('Deze link is niet meer geldig')).toBeVisible();
  });
});
