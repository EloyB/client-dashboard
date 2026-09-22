import {
  emailButton,
  emailDataRows,
  emailLayout,
  emailSoftBox,
  emailStyles,
  escapeHtml,
} from '@/emails/layout';

type TicketConfirmationInput = {
  clientName: string;
  projectName: string;
  ticketTitle: string;
  ticketReference: string;
  reportedAt: string;
  ticketUrl: string;
};

export function ticketConfirmationEmail({
  clientName: rawClientName,
  projectName: rawProjectName,
  ticketTitle: rawTicketTitle,
  ticketReference: rawTicketReference,
  reportedAt: rawReportedAt,
  ticketUrl: rawTicketUrl,
}: TicketConfirmationInput): string {
  const clientName = escapeHtml(rawClientName);
  const projectName = escapeHtml(rawProjectName);
  const ticketTitle = escapeHtml(rawTicketTitle);
  const ticketReference = escapeHtml(rawTicketReference);
  const reportedAt = escapeHtml(rawReportedAt);
  const ticketUrl = escapeHtml(rawTicketUrl);

  const cardHtml = `
    <h1 class="ink" style="${emailStyles.title}">We hebben uw melding ontvangen</h1>
    <p class="ink" style="${emailStyles.body}">Bedankt voor uw melding. Ze staat nu bij ons ingeboekt met de status <strong style="color:inherit;">Ontvangen</strong>. We bekijken ze en u krijgt een e-mail zodra de status verandert.</p>
    ${emailDataRows([
      { label: 'Ticketnummer', value: ticketReference },
      { label: 'Project', value: projectName },
      { label: 'Melding', value: ticketTitle },
      { label: 'Gemeld op', value: reportedAt },
      { label: 'Status', value: 'Ontvangen' },
    ])}
    ${emailButton(ticketUrl, 'Melding bekijken')}
    <p class="muted" style="${emailStyles.hint}">In het portaal volgt u de status en kunt u extra uitleg of schermafbeeldingen toevoegen.</p>
    ${emailSoftBox('Meldingen met hoge prioriteit bekijken we binnen één werkdag. Is het dringend? Bel dan 09 225 44 18.')}
  `;

  return emailLayout({
    title: `We hebben uw melding ontvangen — ${ticketReference}`,
    preheader: `${ticketReference} ${ticketTitle}. We bekijken uw melding en houden u op de hoogte.`,
    cardHtml,
    footerNote: `U krijgt deze e-mail omdat u een melding maakte in het projectportaal van ${clientName}.`,
  });
}

export function ticketConfirmationEmailText({
  clientName,
  projectName,
  ticketTitle,
  ticketReference,
  reportedAt,
  ticketUrl,
}: TicketConfirmationInput): string {
  return [
    'We hebben uw melding ontvangen',
    '',
    'Bedankt voor uw melding. Ze staat nu bij ons ingeboekt met de status Ontvangen.',
    'We bekijken ze en u krijgt een e-mail zodra de status verandert.',
    '',
    `Ticketnummer: ${ticketReference}`,
    `Project: ${projectName}`,
    `Melding: ${ticketTitle}`,
    `Gemeld op: ${reportedAt}`,
    'Status: Ontvangen',
    '',
    `Melding bekijken: ${ticketUrl}`,
    '',
    'Meldingen met hoge prioriteit bekijken we binnen één werkdag. Is het dringend? Bel dan 09 225 44 18.',
    '',
    `U krijgt deze e-mail omdat u een melding maakte in het projectportaal van ${clientName}.`,
  ].join('\n');
}
