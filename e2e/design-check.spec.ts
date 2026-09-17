import { expect, test } from '@playwright/test';

// react-day-picker's day buttons use a full Dutch date as their aria-label
// (e.g. "maandag 5 september 2026"), not the bare day number, so tests pick
// a day via its stable `data-day` attribute (`d-M-yyyy`, no leading zeros)
// instead — computed against "today" so this keeps working every month.
function dataDayFor(dayOfMonth: number): string {
  const today = new Date();
  return `${dayOfMonth}-${today.getMonth() + 1}-${today.getFullYear()}`;
}

test.describe('design-check — DataTable', () => {
  test('desktop shows a real table with sortable headers and pagination', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop', 'Table vs. card view is desktop-only');

    await page.goto('/design-check');
    const tableSection = page.locator('section', {
      has: page.getByRole('heading', { name: '8 · Tabel' }),
    });

    await expect(tableSection.locator('table')).toBeVisible();
    await expect(tableSection.getByText('Pagina 1 van 2')).toBeVisible();
  });

  test('mobile shows the same rows as cards with a "Meer laden" button, no table', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile', 'Table vs. card view is mobile-only');

    await page.goto('/design-check');
    const tableSection = page.locator('section', {
      has: page.getByRole('heading', { name: '8 · Tabel' }),
    });
    const mobileCards = tableSection.locator('[class*="md:hidden"]').first();

    await expect(tableSection.locator('table')).not.toBeVisible();
    await expect(mobileCards.getByText('Cookiemelding blijft terugkomen')).toBeVisible();
    await expect(tableSection.getByRole('button', { name: 'Meer laden' })).toBeVisible();
  });

  test('filtering, searching and sorting update the URL and the visible rows', async ({
    page,
  }, testInfo) => {
    await page.goto('/design-check');
    const tableSection = page.locator('section', {
      has: page.getByRole('heading', { name: '8 · Tabel' }),
    });
    const visibleRows =
      testInfo.project.name === 'Mobile'
        ? tableSection.locator('[class*="md:hidden"]').first()
        : tableSection.locator('table');

    await tableSection.getByRole('button', { name: /^Nieuw \d/ }).click();
    await expect(page).toHaveURL(/status=new/);
    await expect(visibleRows.getByText('Cookiemelding blijft terugkomen')).not.toBeVisible();
    await expect(visibleRows.getByText('Contactformulier verzendt niet')).toBeVisible();

    await tableSection.getByPlaceholder('Zoek op titel of klant').fill('webshop');
    await expect(page).toHaveURL(/q=webshop/);
    await expect(visibleRows.getByText('Contactformulier verzendt niet')).not.toBeVisible();
    await expect(visibleRows.getByText('Webshop toont verkeerde voorraad')).toBeVisible();
  });

  test('an empty result shows the filtered empty state with a way to clear filters', async ({
    page,
  }) => {
    await page.goto('/design-check');
    const tableSection = page.locator('section', {
      has: page.getByRole('heading', { name: '8 · Tabel' }),
    });

    await tableSection.getByPlaceholder('Zoek op titel of klant').fill('geen-enkel-resultaat');
    const emptySection = page.locator('section', {
      has: page.getByRole('heading', { name: '9 · Lege staat' }),
    });
    await expect(emptySection.getByText('Geen tickets met deze filters')).toBeVisible();
  });
});

test.describe('design-check — formulierpatroon', () => {
  test('the sheet shows client-side validation errors before any server call', async ({ page }) => {
    await page.goto('/design-check');
    await page.getByRole('button', { name: 'Nieuw project (sheet)' }).click();

    const sheet = page.getByRole('dialog', { name: 'Nieuw project' });
    await expect(sheet).toBeVisible();

    await sheet.getByRole('button', { name: 'Project opslaan' }).click();
    await expect(sheet.getByText('Projectnaam is verplicht')).toBeVisible();
    await expect(sheet.getByText('Kies een klant')).toBeVisible();
  });

  test('an opleverdatum before the startdatum is rejected client-side', async ({ page }) => {
    await page.goto('/design-check');
    await page.getByRole('button', { name: 'Nieuw project (sheet)' }).click();
    const sheet = page.getByRole('dialog', { name: 'Nieuw project' });

    await sheet.getByLabel('Projectnaam').fill('Voorbeeldproject');
    await sheet.getByLabel(/^Klant/).click();
    await page.getByRole('option', { name: 'Verlinden & Zn' }).click();

    await sheet.getByLabel('Startdatum').click();
    await page.locator(`[data-day="${dataDayFor(20)}"]`).click();

    await sheet.getByLabel('Opleverdatum').click();
    await page.locator(`[data-day="${dataDayFor(10)}"]`).click();

    await sheet.getByRole('button', { name: 'Project opslaan' }).click();
    await expect(sheet.getByText('Opleverdatum moet na de startdatum vallen')).toBeVisible();
  });

  test('a valid submission shows a success toast and closes the sheet', async ({ page }) => {
    await page.goto('/design-check');
    await page.getByRole('button', { name: 'Nieuw project (sheet)' }).click();
    const sheet = page.getByRole('dialog', { name: 'Nieuw project' });

    await sheet.getByLabel('Projectnaam').fill('Voorbeeldproject');
    await sheet.getByLabel(/^Klant/).click();
    await page.getByRole('option', { name: 'Verlinden & Zn' }).click();

    await sheet.getByLabel('Startdatum').click();
    await page.locator(`[data-day="${dataDayFor(5)}"]`).click();
    await sheet.getByLabel('Opleverdatum').click();
    await page.locator(`[data-day="${dataDayFor(20)}"]`).click();

    await sheet.getByRole('button', { name: 'Project opslaan' }).click();
    await expect(page.getByText('Project opgeslagen')).toBeVisible();
    await expect(sheet).not.toBeVisible();
  });

  test('the rename dialog validates a required field', async ({ page }) => {
    await page.goto('/design-check');
    await page.getByRole('button', { name: 'Project hernoemen (dialoog)' }).click();

    const dialog = page.getByRole('dialog', { name: 'Project hernoemen' });
    await dialog.getByLabel('Naam').fill('');
    await dialog.getByRole('button', { name: 'Opslaan' }).click();
    await expect(dialog.getByText('Naam is verplicht')).toBeVisible();
  });
});

test.describe('design-check — feedback', () => {
  test('toast buttons show a success and an error toast', async ({ page }) => {
    await page.goto('/design-check');

    await page.getByRole('button', { name: 'Succes tonen' }).click();
    await expect(page.getByText('Ticket opgeslagen')).toBeVisible();

    await page.getByRole('button', { name: 'Fout tonen' }).click();
    await expect(page.getByText('Opslaan mislukt')).toBeVisible();
  });

  test('the destructive confirm dialog requires typing the exact name', async ({ page }) => {
    await page.goto('/design-check');
    await page.getByRole('button', { name: 'Project verwijderen' }).click();

    const dialog = page.getByRole('alertdialog');
    const confirmButton = dialog.getByRole('button', { name: 'Definitief verwijderen' });
    await expect(confirmButton).toBeDisabled();

    await dialog.getByLabel(/Typ .* om te bevestigen/).fill('verkeerde naam');
    await expect(confirmButton).toBeDisabled();

    await dialog.getByLabel(/Typ .* om te bevestigen/).fill('Herbouw website Verlinden & Zn');
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();
    await expect(page.getByText('Project verwijderd')).toBeVisible();
  });

  test('the non-destructive confirm dialog has no confirmation field and is enabled immediately', async ({
    page,
  }) => {
    await page.goto('/design-check');
    await page.getByRole('button', { name: 'Project archiveren' }).click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog.getByLabel(/Typ .* om te bevestigen/)).not.toBeVisible();
    const confirmButton = dialog.getByRole('button', { name: 'Archiveren' });
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();
    await expect(page.getByText('Project gearchiveerd')).toBeVisible();
  });
});

test.describe('design-check — mobile layout', () => {
  test('no horizontal scroll at 375px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile', 'Only relevant at the 375px viewport');

    await page.goto('/design-check');
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
