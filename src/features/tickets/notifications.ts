import { eq } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { clients, tickets, user as userTable } from '@/db/schema';
import {
  newTicketNotificationEmail,
  newTicketNotificationEmailText,
} from '@/emails/ticket-notification';
import { ticketConfirmationEmail, ticketConfirmationEmailText } from '@/emails/ticket-confirmation';
import { sanitizeSubjectPart } from '@/emails/layout';
import { env } from '@/lib/env';
import { sendEmail } from '@/lib/email';
import { adminTicketUrl, portalTicketUrl, ticketReference } from '@/lib/ticket-links';
import { formatDateTime } from '@/lib/utils';

/**
 * Sends both slice-5b emails for a just-created ticket — never throws, so
 * it's always safe to call from `after()` without risking the (already
 * successful) ticket creation. Errors are logged with the ticket id only,
 * never the message content or links.
 */
export async function notifyNewTicket(
  {
    ticket,
    projectName,
    clientId,
    attachmentCount,
  }: {
    ticket: typeof tickets.$inferSelect;
    projectName: string;
    clientId: string;
    attachmentCount: number;
  },
  database: Database = db,
): Promise<void> {
  try {
    const [client] = await database
      .select({ name: clients.name })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);
    const [reporter] = await database
      .select({ name: userTable.name, email: userTable.email })
      .from(userTable)
      .where(eq(userTable.id, ticket.reportedById))
      .limit(1);
    if (!client || !reporter) {
      throw new Error('Client or reporter not found for notification emails.');
    }

    const reference = ticketReference(ticket.id);
    const reportedAt = formatDateTime(ticket.createdAt);

    const confirmationInput = {
      clientName: client.name,
      projectName,
      ticketTitle: ticket.title,
      ticketReference: reference,
      reportedAt,
      ticketUrl: portalTicketUrl(ticket.id),
    };

    const notificationInput = {
      clientName: client.name,
      projectName,
      ticketTitle: ticket.title,
      ticketReference: reference,
      priority: ticket.priority,
      reporterName: reporter.name,
      reportedAt,
      description: ticket.description ?? '',
      attachmentCount,
      ticketUrl: adminTicketUrl(ticket.id),
    };

    await Promise.all([
      sendEmail({
        to: reporter.email,
        subject: `We hebben uw melding ontvangen — ${reference}`,
        html: ticketConfirmationEmail(confirmationInput),
        text: ticketConfirmationEmailText(confirmationInput),
        replyTo: env.ADMIN_NOTIFICATION_EMAIL,
        context: { ticketId: ticket.id },
      }),
      sendEmail({
        to: env.ADMIN_NOTIFICATION_EMAIL,
        subject: `Nieuw ticket · ${sanitizeSubjectPart(client.name)} · ${reference}`,
        html: newTicketNotificationEmail(notificationInput),
        text: newTicketNotificationEmailText(notificationInput),
        replyTo: reporter.email,
        context: { ticketId: ticket.id },
      }),
    ]);
  } catch (error) {
    console.error('Failed to send new-ticket notification emails', {
      ticketId: ticket.id,
      error: error instanceof Error ? error.message : error,
    });
  }
}
