'use server';

import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

import { db } from '@/db';
import { activityLog, tickets, type Priority, type TicketStatus } from '@/db/schema';
import {
  updateTicketPrioritySchema,
  updateTicketStatusSchema,
} from '@/features/tickets/schemas.admin';
import { AccessError, requireAdmin } from '@/lib/access';
import { createFormAction } from '@/lib/form-action';

const statusLabels: Record<TicketStatus, string> = {
  new: 'Nieuw',
  in_progress: 'In behandeling',
  resolved: 'Opgelost',
};

const priorityLabels: Record<Priority, string> = {
  low: 'Laag',
  medium: 'Middel',
  high: 'Hoog',
};

async function getTicketOrNotFound(ticketId: string) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!ticket) {
    throw new AccessError('NOT_FOUND', 'Ticket not found.');
  }
  return ticket;
}

export const updateTicketStatus = createFormAction(updateTicketStatusSchema, async (data) => {
  const admin = await requireAdmin(await headers());
  const ticket = await getTicketOrNotFound(data.ticketId);

  const resolvedAt = data.status === 'resolved' ? new Date() : null;

  await db.transaction(async (tx) => {
    await tx
      .update(tickets)
      .set({ status: data.status, resolvedAt })
      .where(eq(tickets.id, data.ticketId));

    await tx.insert(activityLog).values({
      projectId: ticket.projectId,
      ticketId: ticket.id,
      actorId: admin.id,
      type: 'ticket_status_changed',
      description: `Status gewijzigd naar "${statusLabels[data.status]}"`,
    });
  });

  return { status: data.status, resolvedAt };
});

export const updateTicketPriority = createFormAction(updateTicketPrioritySchema, async (data) => {
  const admin = await requireAdmin(await headers());
  const ticket = await getTicketOrNotFound(data.ticketId);

  await db.transaction(async (tx) => {
    await tx.update(tickets).set({ priority: data.priority }).where(eq(tickets.id, data.ticketId));

    await tx.insert(activityLog).values({
      projectId: ticket.projectId,
      ticketId: ticket.id,
      actorId: admin.id,
      type: 'ticket_priority_changed',
      description: `Prioriteit gezet op "${priorityLabels[data.priority]}"`,
    });
  });

  return { priority: data.priority };
});
