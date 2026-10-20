import { eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { db } from '@/db';
import { clients, projects } from '@/db/schema';
import { loginAsAdmin, loginAsTempClient } from './helpers/auth';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

async function uploadDocument(
  adminPage: import('@playwright/test').Page,
  projectId: string,
  title: string,
  type: string,
  visible: boolean,
) {
  await adminPage.goto(`/app/projects/${projectId}`);
  await adminPage.getByRole('tab', { name: 'Documenten' }).click();
  // Empty state shows "Document uploaden"; once there's at least one
  // document the header shows "Uploaden" instead — .or() auto-waits for
  // whichever actually renders instead of racing a synchronous .count().
  await adminPage
    .getByRole('button', { name: 'Document uploaden' })
    .or(adminPage.getByRole('button', { name: 'Uploaden', exact: true }))
    .click();
  const input = adminPage.locator('input[type="file"]').first();
  await input.setInputFiles({ name: `${title}.png`, mimeType: 'image/png', buffer: TINY_PNG });
  await expect(adminPage.getByText('geüpload')).toBeVisible();
  await adminPage.getByLabel('Titel').fill(title);
  await adminPage.getByLabel('Soort').click();
  await adminPage.getByRole('option', { name: type }).click();
  if (!visible) {
    await adminPage.getByLabel('Zichtbaar voor klant').click();
  }
  await adminPage.getByRole('button', { name: 'Document opslaan' }).click();
  await expect(adminPage.getByText('Document toegevoegd').first()).toBeVisible();
}

test.describe('portaal documenten (slice 6b)', () => {
  test('een gedeeld document is zichtbaar en downloadbaar, een intern document niet, filters blijven behouden', async ({
    page,
    context,
  }) => {
    const { clientName, cleanup } = await loginAsTempClient(context, 1);
    const [client] = await db.select().from(clients).where(eq(clients.name, clientName));
    const [project] = await db.select().from(projects).where(eq(projects.clientId, client.id));

    const adminContext = await context.browser()!.newContext();
    const adminPage = await adminContext.newPage();
    const sharedTitle = `Zzz E2E portaaldoc gedeeld ${Date.now()}`;
    const internalTitle = `Zzz E2E portaaldoc intern ${Date.now()}`;

    try {
      await loginAsAdmin(adminContext);
      await uploadDocument(adminPage, project.id, sharedTitle, 'Factuur', true);
      await uploadDocument(adminPage, project.id, internalTitle, 'Andere', false);

      // 1. The client sees the shared document, not the internal one.
      await page.goto('/portal/documents');
      await expect(page.locator(`text="${sharedTitle}" >> visible=true`)).toBeVisible();
      await expect(page.getByText(internalTitle)).toHaveCount(0);

      // 2. Downloading opens a new tab with a working URL.
      const [newTab] = await Promise.all([
        page.context().waitForEvent('page'),
        page.getByRole('button', { name: 'Downloaden' }).first().click(),
      ]);
      await newTab.waitForLoadState();
      expect(newTab.url()).toContain('http');
      await newTab.close();

      // 3. A type filter persists across a reload.
      await page.getByRole('button', { name: 'Factuur', exact: true }).click();
      await expect(page).toHaveURL(/type=invoice/);
      await page.reload();
      await expect(page).toHaveURL(/type=invoice/);
      await expect(page.locator(`text="${sharedTitle}" >> visible=true`)).toBeVisible();

      // 4. Turning off visibility makes the document disappear for the client.
      await page.goto('/portal/documents');
      await adminPage.goto(`/app/projects/${project.id}/documents`);
      await adminPage.getByRole('button', { name: 'Gedeeld' }).first().click();
      await expect(adminPage.getByText('Niet langer gedeeld')).toBeVisible();
      await page.reload();
      await expect(page.getByText(sharedTitle)).toHaveCount(0);
    } finally {
      await adminPage.close();
      await adminContext.close();
      await cleanup();
    }
  });
});
