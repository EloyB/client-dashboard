import type { Priority } from '@/db/schema';
import {
  emailButton,
  emailDataRows,
  emailLayout,
  emailStyles,
  escapeHtml,
  sanitizeSubjectPart,
  truncate,
} from '@/emails/layout';

const DESCRIPTION_MAX_LENGTH = 300;

// Email clients don't support CSS custom properties, so these are the same
// hex values as globals.css's priority tokens, hardcoded — same approach as
// emailButton's bg color.
const PRIORITY_STYLE: Record<Priority, { label: string; background: string; color: string }> = {
  low: { label: 'Laag', background: '#f4f4ef', color: '#55554f' },
  medium: { label: 'Middel', background: '#fbf0e2', color: '#8a4008' },
  high: { label: 'Hoog', background: '#fdecec', color: '#a01818' },
};

type TicketNotificationInput = {
  clientName: string;
  projectName: string;
  ticketTitle: string;
  ticketReference: string;
  priority: Priority;
  reporterName: string;
  reportedAt: string;
  description: string;
  attachmentCount: number;
  ticketUrl: string;
};

function attachmentLabel(count: number): string {
  if (count === 0) return 'Geen';
  return count === 1 ? '1 schermafbeelding' : `${count} schermafbeeldingen`;
}

export function newTicketNotificationEmail({
  clientName: rawClientName,
  projectName: rawProjectName,
  ticketTitle: rawTicketTitle,
  ticketReference: rawTicketReference,
  priority,
  reporterName: rawReporterName,
  reportedAt: rawReportedAt,
  description: rawDescription,
  attachmentCount,
  ticketUrl: rawTicketUrl,
}: TicketNotificationInput): string {
  const clientName = escapeHtml(rawClientName);
  const projectName = escapeHtml(rawProjectName);
  const ticketTitle = escapeHtml(rawTicketTitle);
  const ticketReference = escapeHtml(rawTicketReference);
  const reporterName = escapeHtml(rawReporterName);
  const reportedAt = escapeHtml(rawReportedAt);
  const ticketUrl = escapeHtml(rawTicketUrl);
  const description = truncate(rawDescription, DESCRIPTION_MAX_LENGTH);
  const priorityStyle = PRIORITY_STYLE[priority];

  const descriptionHtml = description
    ? `<p class="ink" style="${emailStyles.body}">“${escapeHtml(description)}”</p>`
    : '';

  const cardHtml = `
    <p class="muted" style="${emailStyles.eyebrow}">NIEUW TICKET</p>
    <h1 class="ink" style="${emailStyles.title}">${ticketTitle}</h1>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0;">
      <tr>
        <td bgcolor="${priorityStyle.background}" style="border-radius:999px; padding:5px 12px; font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size:13px; line-height:18px; mso-line-height-rule:exactly; color:${priorityStyle.color}; font-weight:bold;">Prioriteit: ${priorityStyle.label.toLowerCase()}</td>
      </tr>
    </table>
    ${emailDataRows([
      { label: 'Klant', value: clientName },
      { label: 'Project', value: projectName },
      { label: 'Ticket', value: ticketReference },
      { label: 'Gemeld door', value: reporterName },
      { label: 'Gemeld op', value: reportedAt },
      { label: 'Bijlagen', value: attachmentLabel(attachmentCount) },
    ])}
    ${descriptionHtml}
    ${emailButton(ticketUrl, 'Ticket openen')}
  `;

  return emailLayout({
    title: `Nieuw ticket · ${sanitizeSubjectPart(rawClientName)} · ${rawTicketReference}`,
    preheader: `${priorityStyle.label} · ${clientName} · ${ticketTitle} (${ticketReference}).`,
    cardHtml,
    footerNote: 'Interne melding uit het projectbeheer.',
  });
}

export function newTicketNotificationEmailText({
  clientName,
  projectName,
  ticketTitle,
  ticketReference,
  priority,
  reporterName,
  reportedAt,
  description,
  attachmentCount,
  ticketUrl,
}: TicketNotificationInput): string {
  const truncatedDescription = truncate(description, DESCRIPTION_MAX_LENGTH);
  const lines = [
    'Nieuw ticket',
    '',
    ticketTitle,
    `Prioriteit: ${PRIORITY_STYLE[priority].label.toLowerCase()}`,
    '',
    `Klant: ${clientName}`,
    `Project: ${projectName}`,
    `Ticket: ${ticketReference}`,
    `Gemeld door: ${reporterName}`,
    `Gemeld op: ${reportedAt}`,
    `Bijlagen: ${attachmentLabel(attachmentCount)}`,
  ];
  if (truncatedDescription) {
    lines.push('', `"${truncatedDescription}"`);
  }
  lines.push('', `Ticket openen: ${ticketUrl}`);
  return lines.join('\n');
}
