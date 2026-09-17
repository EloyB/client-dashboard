import {
  emailButton,
  emailDataRows,
  emailLayout,
  emailSoftBox,
  emailStyles,
  escapeHtml,
} from '@/emails/layout';

export function inviteEmail({
  clientName: rawClientName,
  invitedByName: rawInvitedByName,
  recipientEmail: rawRecipientEmail,
  acceptUrl: rawAcceptUrl,
}: {
  clientName: string;
  invitedByName: string;
  recipientEmail: string;
  acceptUrl: string;
}): string {
  const clientName = escapeHtml(rawClientName);
  const invitedByName = escapeHtml(rawInvitedByName);
  const recipientEmail = escapeHtml(rawRecipientEmail);
  const acceptUrl = escapeHtml(rawAcceptUrl);

  const cardHtml = `
    <p class="muted" style="${emailStyles.eyebrow}">UITNODIGING</p>
    <h1 class="ink" style="${emailStyles.title}">Welkom in het portaal van ${clientName}</h1>
    <p class="ink" style="${emailStyles.body}">${invitedByName} van Studio heeft u uitgenodigd voor het projectportaal. Daar volgt u uw website-project: u ziet de planning, meldt problemen en vindt uw documenten terug.</p>
    ${emailButton(acceptUrl, 'Account activeren')}
    <p class="muted" style="${emailStyles.hint}">Deze uitnodiging blijft 7 dagen geldig. Daarna vraagt u eenvoudig een nieuwe aan via de link hieronder.</p>
    ${emailDataRows([
      { label: 'Bedrijf', value: clientName },
      { label: 'Uitgenodigd door', value: `${invitedByName}, Studio` },
      { label: 'Uw e-mailadres', value: recipientEmail },
    ])}
    ${emailSoftBox('<strong style="color:inherit;">Een wachtwoord hebt u niet nodig.</strong> Elke keer dat u wilt aanmelden, sturen we u een e-mail met één knop om binnen te geraken.')}
  `;

  return emailLayout({
    title: `Uitnodiging voor het projectportaal van ${clientName}`,
    preheader: `${invitedByName} nodigt u uit in het projectportaal van ${clientName}.`,
    cardHtml,
    footerNote: `U krijgt deze e-mail omdat Studio u toegang gaf tot het projectportaal. Werkt de knop niet? Kopieer deze link naar uw browser: <a href="${acceptUrl}" style="color:#0d3b33;">${acceptUrl}</a>`,
  });
}
