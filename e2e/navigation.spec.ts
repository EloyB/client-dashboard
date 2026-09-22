import { expect, test } from '@playwright/test';

import { CLIENT_TEST_CLIENT_NAME, loginAsAdmin, loginAsClient } from './helpers/auth';

test.describe('unauthenticated access', () => {
  test('visiting /app redirects to /login with a next param (slice 1a middleware)', async ({
    page,
  }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/login\?next=%2Fapp$/);
  });

  test('visiting /portal redirects to /login', async ({ page }) => {
    await page.goto('/portal');
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('admin area', () => {
  test.beforeEach(async ({ context }) => {
    await loginAsAdmin(context);
  });

  test('wrong-role access to /portal redirects to /app', async ({ page }) => {
    await page.goto('/portal');
    await expect(page).toHaveURL(/\/app$/);
  });

  test('desktop sidebar shows all admin destinations with active highlighting', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop', 'Sidebar is desktop-only');

    await page.goto('/app/projects');

    const sidebar = page.locator('aside');
    const items: [string, string][] = [
      ['/app', 'Dashboard'],
      ['/app/clients', 'Klanten'],
      ['/app/projects', 'Projecten'],
      ['/app/board', 'Takenbord'],
      ['/app/tickets', 'Tickets'],
      ['/app/calendar', 'Agenda'],
      ['/app/documents', 'Documenten'],
    ];

    for (const [href, label] of items) {
      await expect(sidebar.getByRole('link', { name: label, exact: true })).toHaveAttribute(
        'href',
        href,
      );
    }

    await expect(sidebar.getByRole('link', { name: 'Projecten', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(sidebar.getByRole('link', { name: 'Dashboard', exact: true })).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('mobile tab bar shows 5 destinations and the overflow menu holds the rest', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile', 'Tab bar is mobile-only');

    await page.goto('/app');

    const tabBar = page.getByRole('navigation', { name: 'Hoofdnavigatie' });
    const tabItems: [string, string][] = [
      ['/app', 'Start'],
      ['/app/projects', 'Projecten'],
      ['/app/board', 'Taken'],
      ['/app/tickets', 'Tickets'],
      ['/app/calendar', 'Agenda'],
    ];

    for (const [href, label] of tabItems) {
      const link = tabBar.getByRole('link', { name: label, exact: true });
      await expect(link).toHaveAttribute('href', href);
      const box = await link.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }

    await page.getByRole('button', { name: 'Meer' }).click();
    const overflowSheet = page.getByRole('dialog');
    await expect(overflowSheet.getByRole('link', { name: 'Klanten' })).toHaveAttribute(
      'href',
      '/app/clients',
    );
    await expect(overflowSheet.getByRole('link', { name: 'Documenten' })).toHaveAttribute(
      'href',
      '/app/documents',
    );
  });

  test('no horizontal scroll at 375px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile', 'Only relevant at the 375px viewport');

    await page.goto('/app/documents');
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

test.describe('portal area', () => {
  test.beforeEach(async ({ context }) => {
    await loginAsClient(context);
  });

  test('wrong-role access to /app redirects to /portal', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/portal$/);
  });

  test('desktop sidebar shows all portal destinations, client block and bug-report action', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop', 'Sidebar is desktop-only');

    await page.goto('/portal/tickets');

    const sidebar = page.locator('aside');
    const items: [string, string][] = [
      ['/portal', 'Start'],
      ['/portal/projects', 'Projecten'],
      ['/portal/tickets', 'Tickets'],
      ['/portal/calendar', 'Agenda'],
      ['/portal/documents', 'Documenten'],
    ];

    for (const [href, label] of items) {
      await expect(sidebar.getByRole('link', { name: label, exact: true })).toHaveAttribute(
        'href',
        href,
      );
    }

    await expect(sidebar.getByRole('link', { name: 'Tickets', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(sidebar.getByText(CLIENT_TEST_CLIENT_NAME).first()).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Bug melden' })).toHaveAttribute(
      'href',
      '/portal/tickets/new',
    );
  });

  test('mobile tab bar shows 4 destinations and Start stays active on /portal/projects', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile', 'Tab bar is mobile-only');

    await page.goto('/portal/projects');

    const tabBar = page.getByRole('navigation', { name: 'Hoofdnavigatie' });
    const tabItems: [string, string][] = [
      ['/portal', 'Start'],
      ['/portal/tickets', 'Tickets'],
      ['/portal/calendar', 'Agenda'],
      ['/portal/documents', 'Documenten'],
    ];

    for (const [href, label] of tabItems) {
      const link = tabBar.getByRole('link', { name: label, exact: true });
      await expect(link).toHaveAttribute('href', href);
      const box = await link.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }

    await expect(tabBar.getByRole('link', { name: 'Start', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('no horizontal scroll at 375px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile', 'Only relevant at the 375px viewport');

    await page.goto('/portal/documents');
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
