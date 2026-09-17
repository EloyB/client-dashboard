import { emailButton, emailLayout, emailSoftBox, emailStyles, escapeHtml } from '@/emails/layout';

export function magicLinkEmail({
  clientName: rawClientName,
  signInUrl: rawSignInUrl,
}: {
  clientName: string;
  signInUrl: string;
}): string {
  const clientName = escapeHtml(rawClientName);
  const signInUrl = escapeHtml(rawSignInUrl);

  const cardHtml = `
    <h1 class="ink" style="${emailStyles.title}">Uw aanmeldlink</h1>
    <p class="ink" style="${emailStyles.body}">Klik op de knop hieronder om aan te melden bij het projectportaal van ${clientName}. Een wachtwoord hebt u niet nodig.</p>
    ${emailButton(signInUrl, 'Inloggen')}
    <p class="muted" style="${emailStyles.hint}">Deze link blijft <strong style="color:inherit;">15 minuten</strong> geldig en werkt één keer. Daarna vraagt u gewoon een nieuwe link aan.</p>
    ${emailSoftBox('Hebt u zelf geen aanmeldlink gevraagd? Dan mag u deze e-mail negeren of verwijderen. Zonder de knop aan te klikken gebeurt er niets, en niemand anders kan met dit bericht bij uw gegevens.')}
  `;

  return emailLayout({
    title: 'Uw aanmeldlink voor het projectportaal',
    preheader: 'Klik op Inloggen om aan te melden. De link blijft 15 minuten geldig.',
    cardHtml,
    footerNote: `Werkt de knop niet? Kopieer deze link naar uw browser: <a href="${signInUrl}" style="color:#0d3b33;">${signInUrl}</a>`,
  });
}
