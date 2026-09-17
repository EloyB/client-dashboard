import { emailButton, emailLayout, emailSoftBox, emailStyles, escapeHtml } from '@/emails/layout';

// Not in the design handoff (docs/design/INDEX.md flags this as a known
// gap) — written in the same voice and shell as the other two emails.
export function passwordResetEmail({
  name: rawName,
  resetUrl: rawResetUrl,
}: {
  name: string;
  resetUrl: string;
}): string {
  const name = escapeHtml(rawName);
  const resetUrl = escapeHtml(rawResetUrl);

  const cardHtml = `
    <h1 class="ink" style="${emailStyles.title}">Wachtwoord opnieuw instellen</h1>
    <p class="ink" style="${emailStyles.body}">Hallo ${name}, u vroeg een nieuw wachtwoord aan voor uw Studio-account. Klik op de knop hieronder om een nieuw wachtwoord in te stellen.</p>
    ${emailButton(resetUrl, 'Nieuw wachtwoord instellen')}
    <p class="muted" style="${emailStyles.hint}">Deze link blijft <strong style="color:inherit;">1 uur</strong> geldig en werkt één keer.</p>
    ${emailSoftBox('Hebt u dit zelf niet aangevraagd? Dan mag u deze e-mail negeren. Uw wachtwoord blijft ongewijzigd zolang u niet op de knop klikt.')}
  `;

  return emailLayout({
    title: 'Wachtwoord opnieuw instellen',
    preheader:
      'Klik op de knop om een nieuw wachtwoord in te stellen. De link blijft 1 uur geldig.',
    cardHtml,
    footerNote: `Werkt de knop niet? Kopieer deze link naar uw browser: <a href="${resetUrl}" style="color:#0d3b33;">${resetUrl}</a>`,
  });
}
