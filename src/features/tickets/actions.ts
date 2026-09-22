'use server';

import { and, eq, gt } from 'drizzle-orm';
import { headers } from 'next/headers';

import { db } from '@/db';
import { activityLog, documents, files, ticketAttachments, tickets } from '@/db/schema';
import { createTicketSchema } from '@/features/tickets/schemas';
import { assertProjectAccess, requireClientUser } from '@/lib/access';
import { createFormAction } from '@/lib/form-action';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const RATE_LIMIT_MAX_TICKETS_PER_HOUR = 10;
const DUPLICATE_WINDOW_SECONDS = 30;

async function assertNotRateLimited(userId: string): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentTickets = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(and(eq(tickets.reportedById, userId), gt(tickets.createdAt, oneHourAgo)));

  if (recentTickets.length >= RATE_LIMIT_MAX_TICKETS_PER_HOUR) {
    throw new Error('Te veel meldingen kort na elkaar. Probeer het later opnieuw.');
  }
}

/** A near-identical resubmission within a short window returns the existing ticket instead of creating a duplicate. */
async function findRecentDuplicate(userId: string, projectId: string, title: string) {
  const windowStart = new Date(Date.now() - DUPLICATE_WINDOW_SECONDS * 1000);
  const [existing] = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(
      and(
        eq(tickets.reportedById, userId),
        eq(tickets.projectId, projectId),
        eq(tickets.title, title),
        gt(tickets.createdAt, windowStart),
      ),
    )
    .limit(1);
  return existing ?? null;
}

/**
 * A file may only be attached once it's confirmed as this user's own,
 * not-yet-attached upload — the same file could otherwise be replayed onto
 * multiple tickets/documents. Failure is deliberately generic so it never
 * confirms whether a given file id exists at all.
 */
async function assertUnattachedOwnFile(
  database: Transaction,
  userId: string,
  fileId: string,
): Promise<void> {
  const [file] = await database
    .select({ id: files.id, uploadedById: files.uploadedById })
    .from(files)
    .where(eq(files.id, fileId))
    .limit(1);

  const [existingDocument] = await database
    .select({ fileId: documents.fileId })
    .from(documents)
    .where(eq(documents.fileId, fileId))
    .limit(1);

  const [existingAttachment] = await database
    .select({ fileId: ticketAttachments.fileId })
    .from(ticketAttachments)
    .where(eq(ticketAttachments.fileId, fileId))
    .limit(1);

  if (!file || file.uploadedById !== userId || existingDocument || existingAttachment) {
    throw new Error('Een van de schermafbeeldingen kon niet gekoppeld worden.');
  }
}

export const createTicket = createFormAction(createTicketSchema, async (data) => {
  const user = await requireClientUser(await headers());
  const project = await assertProjectAccess(user, data.projectId);
  if (project.status === 'archived') {
    throw new Error('Dit project is gearchiveerd.');
  }

  await assertNotRateLimited(user.id);

  const duplicate = await findRecentDuplicate(user.id, data.projectId, data.title);
  if (duplicate) {
    return { ticketId: duplicate.id };
  }

  const ticketId = await db.transaction(async (tx) => {
    const [ticket] = await tx
      .insert(tickets)
      .values({
        projectId: data.projectId,
        reportedById: user.id,
        title: data.title,
        description: data.description || null,
        pageUrl: data.pageUrl || null,
        status: 'new',
        priority: data.priority,
      })
      .returning();

    for (const fileId of data.fileIds) {
      await assertUnattachedOwnFile(tx, user.id, fileId);
      await tx.insert(ticketAttachments).values({ ticketId: ticket.id, fileId });
    }

    await tx.insert(activityLog).values({
      projectId: data.projectId,
      ticketId: ticket.id,
      actorId: user.id,
      type: 'ticket_created',
      description: `Nieuwe melding: "${data.title}"`,
    });

    return ticket.id;
  });

  return { ticketId };
});
