import { expect, test } from '@playwright/test';

import { loginAsAdmin, loginAsClient } from './helpers/auth';

test.describe('clients overview and detail', () => {
  test.beforeEach(async ({ context }) => {
    await loginAsAdmin(context);
  });

  // Client names sit inside a link's accessible name (avatar initials + name +
  // email), and DataTable renders both the desktop table and the mobile card
  // markup at once (hidden via CSS per breakpoint) — getByRole naturally
  // excludes the display:none half, unlike getByText, so it stays a single,
  // breakpoint-safe match without needing .first().
  test('shows the seeded clients', async ({ page }) => {
    await page.goto('/app/clients');
    await expect(page.getByRole('link', { name: 'Kapsalon Haarwerk' })).toBeVisible();
  });

  test('a search query persists across a reload and filters the list', async ({ page }) => {
    await page.goto('/app/clients?q=Kapsalon');
    await expect(page.getByRole('link', { name: 'Kapsalon Haarwerk' })).toBeVisible();
    await expect(page.getByText('Advocatenkantoor Peeters')).toHaveCount(0);

    await page.reload();
    await expect(page.getByPlaceholder('Zoek op naam of e-mailadres')).toHaveValue('Kapsalon');
    await expect(page.getByRole('link', { name: 'Kapsalon Haarwerk' })).toBeVisible();
  });

  test('the current page persists across a reload', async ({ page }) => {
    await page.goto('/app/clients?page=2');
    await expect(page.getByRole('link', { name: 'Meubelmakerij Verlinden' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('link', { name: 'Meubelmakerij Verlinden' })).toBeVisible();
  });

  test('opening a client shows its projects, users and company details', async ({ page }) => {
    await page.goto('/app/clients');
    await page.getByRole('link', { name: 'Kapsalon Haarwerk' }).click();
    await page.waitForURL(/\/app\/clients\/.+/);

    await expect(page.getByRole('heading', { name: 'Kapsalon Haarwerk' })).toBeVisible();
    await expect(page.getByText('ann@kapsalonhaarwerk.be')).toBeVisible();
    await expect(page.getByText('Nieuwe website')).toBeVisible();
    await expect(page.getByText('info@kapsalonhaarwerk.be')).toBeVisible();
  });

  test('a non-existent client id shows the 404 page', async ({ page }) => {
    await page.goto('/app/clients/00000000-0000-0000-0000-000000000000');
    await expect(page.getByText('Deze pagina bestaat niet')).toBeVisible();
  });

  test('an invalid (non-uuid) client id also shows the 404 page', async ({ page }) => {
    await page.goto('/app/clients/not-a-real-id');
    await expect(page.getByText('Deze pagina bestaat niet')).toBeVisible();
  });
});

test.describe('client user access', () => {
  test('a client user is redirected away from /app/clients', async ({ context, page }) => {
    await loginAsClient(context);
    await page.goto('/app/clients');
    await expect(page).toHaveURL(/\/portal$/);
  });
});
