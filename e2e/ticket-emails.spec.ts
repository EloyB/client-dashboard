import { expect, test } from '@playwright/test';

import { env } from '@/lib/env';
import { loginAsTempClient } from './helpers/auth';
import { mailpitHtml, waitForMailpitMessage } from './helpers/mailpit';

test.describe('nieuw-ticket e-mails (slice 5b)', () => {
  test('bug melden verstuurt een bevestiging naar de klant en een melding naar de admin', async ({
    page,
    context,
  }, testInfo) => {
    testInfo.setTimeout(60000);
    const { clientName, userEmail, projectNames, cleanup } = await loginAsTempClient(context, 1);
    const ticketTitle = 'Contactformulier verzendt niet';

    try {
      await page.goto('/portal/tickets/new');
      await page.getByLabel('Titel').fill(ticketTitle);
      await page.getByRole('button', { name: 'Melding versturen' }).click();
      await expect(page.getByText('Uw melding is verstuurd')).toBeVisible();

      const confirmationMail = await waitForMailpitMessage(
        userEmail,
        'We hebben uw melding ontvangen',
      );
      const notificationMail = await waitForMailpitMessage(
        env.ADMIN_NOTIFICATION_EMAIL,
        clientName,
      );

      const confirmationHtml = await mailpitHtml(confirmationMail.ID);
      expect(confirmationHtml).toContain(projectNames[0]);
      expect(confirmationHtml).toContain(ticketTitle);
      expect(confirmationHtml).toContain('Ontvangen');
      expect(confirmationHtml).toContain('/portal/tickets/');
      // The generic "hoge prioriteit" SLA sentence is expected copy — the
      // ticket's own priority must never appear as a labeled value.
      expect(confirmationHtml).not.toMatch(/>Prioriteit<\/td>/);

      const notificationHtml = await mailpitHtml(notificationMail.ID);
      expect(notificationHtml).toContain(clientName);
      expect(notificationHtml).toContain(projectNames[0]);
      expect(notificationHtml).toContain(ticketTitle);
      expect(notificationHtml).toContain('Prioriteit: middel');
      expect(notificationHtml).toContain('/app/tickets/');
    } finally {
      await cleanup();
    }
  });
});
