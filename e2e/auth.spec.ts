import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './helpers/auth';

const ADMIN_EMAIL = 'eloy@studioswyft.be';
const ADMIN_PASSWORD = 'AdminWachtwoord123!';

test.describe('unauthenticated access', () => {
  test('visiting a protected page redirects to /login with a next param', async ({ page }) => {
    await page.goto('/app/clients');
    await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fclients/);
  });
});

// Real form submissions go through the actual HTTP route and are subject to
// the "/sign-in/email" rate limit (3 per 30s). Desktop-only avoids doubling
// that budget for behaviour that isn't viewport-specific to begin with.
test.describe('login form (desktop only, real HTTP sign-in)', () => {
  test('signing in returns to the originally requested page', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'Desktop',
      'Not viewport-specific; avoids doubling rate-limited requests',
    );

    await page.goto('/login?next=/app/clients');
    await page.getByLabel(/^E-mailadres/).fill(ADMIN_EMAIL);
    await page.getByLabel(/^Wachtwoord/).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Aanmelden' }).click();

    await expect(page).toHaveURL(/\/app\/clients$/, { timeout: 15000 });
  });

  test('an external next URL is ignored, landing on /app instead', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'Desktop',
      'Not viewport-specific; avoids doubling rate-limited requests',
    );

    await page.goto('/login?next=https://evil.example.com');
    await page.getByLabel(/^E-mailadres/).fill(ADMIN_EMAIL);
    await page.getByLabel(/^Wachtwoord/).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Aanmelden' }).click();

    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/app\/?$/, { timeout: 15000 });
  });
});

test.describe('logout', () => {
  test.beforeEach(async ({ context }) => {
    await loginAsAdmin(context);
  });

  test('signing out from the user menu ends the session', async ({ page }, testInfo) => {
    await page.goto('/app');

    if (testInfo.project.name === 'Mobile') {
      await page.getByRole('button', { name: 'Meer' }).click();
      await page.getByRole('button', { name: 'Afmelden' }).click();
    } else {
      await page.getByRole('button', { name: /Eloy Boone/ }).click();
      await page.getByRole('menuitem', { name: 'Afmelden' }).click();
    }

    await expect(page).toHaveURL(/\/login$/);

    // The session is really gone server-side, not just a client-side redirect.
    await page.goto('/app');
    await expect(page).toHaveURL(/\/login\?next=%2Fapp/);
  });
});
