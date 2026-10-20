import { desc, eq, sql } from 'drizzle-orm';

import { db, type Database } from '@/db';
import {
  clients,
  files,
  projects,
  ticketAttachments,
  tickets,
  tasks,
  user as userTable,
  type Priority,
  type TaskStatus,
  type TicketStatus,
} from '@/db/schema';
import { AccessError, requireAdmin } from '@/lib/access';
import { taskReference } from '@/lib/task-links';
import { ticketReference } from '@/lib/ticket-links';

/**
 * Admin-only ticket queries — kept entirely separate from
 * features/tickets/queries.ts (the portal queries): each file resolves and
 * scopes its own session, so a portal query can never accidentally skip the
 * client filter via a shared "is this an admin" flag.
 */

export type AdminTicketListRow = {
  id: string;
  reference: string;
  title: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  status: TicketStatus;
  priority: Priority;
  reporterName: string;
  createdAt: Date;
  attachmentCount: number;
};

export async function listTicketsForAdmin(
  requestHeaders: Headers,
  database: Database = db,
): Promise<AdminTicketListRow[]> {
  await requireAdmin(requestHeaders);

  const attachmentCount = database
    .select({ count: sql<number>`count(*)::int`.as('count') })
    .from(ticketAttachments)
    .where(eq(ticketAttachments.ticketId, tickets.id))
    .as('attachment_count');

  const rows = await database
    .select({
      id: tickets.id,
      title: tickets.title,
      clientId: clients.id,
      clientName: clients.name,
      projectId: projects.id,
      projectName: projects.name,
      status: tickets.status,
      priority: tickets.priority,
      reporterName: userTable.name,
      createdAt: tickets.createdAt,
      attachmentCount: attachmentCount.count,
    })
    .from(tickets)
    .innerJoin(projects, eq(projects.id, tickets.projectId))
    .innerJoin(clients, eq(clients.id, projects.clientId))
    .innerJoin(userTable, eq(userTable.id, tickets.reportedById))
    .leftJoinLateral(attachmentCount, sql`true`)
    .orderBy(desc(tickets.createdAt));

  return rows.map((row) => ({
    ...row,
    attachmentCount: row.attachmentCount ?? 0,
    reference: ticketReference(row.id),
  }));
}

/** Used by the ticket section on project detail (slice 5d) — same shape as the overview, scoped to one project. */
export async function listTicketsForProjectAdmin(
  requestHeaders: Headers,
  projectId: string,
  limit: number,
  database: Database = db,
): Promise<AdminTicketListRow[]> {
  await requireAdmin(requestHeaders);

  const attachmentCount = database
    .select({ count: sql<number>`count(*)::int`.as('count') })
    .from(ticketAttachments)
    .where(eq(ticketAttachments.ticketId, tickets.id))
    .as('attachment_count');

  const rows = await database
    .select({
      id: tickets.id,
      title: tickets.title,
      clientId: clients.id,
      clientName: clients.name,
      projectId: projects.id,
      projectName: projects.name,
      status: tickets.status,
      priority: tickets.priority,
      reporterName: userTable.name,
      createdAt: tickets.createdAt,
      attachmentCount: attachmentCount.count,
    })
    .from(tickets)
    .innerJoin(projects, eq(projects.id, tickets.projectId))
    .innerJoin(clients, eq(clients.id, projects.clientId))
    .innerJoin(userTable, eq(userTable.id, tickets.reportedById))
    .leftJoinLateral(attachmentCount, sql`true`)
    .where(eq(tickets.projectId, projectId))
    .orderBy(desc(tickets.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    attachmentCount: row.attachmentCount ?? 0,
    reference: ticketReference(row.id),
  }));
}

export type AdminTicketAttachment = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
};

export type AdminLinkedTask = {
  id: string;
  reference: string;
  title: string;
  status: TaskStatus;
  dueDate: string | null;
};

export type AdminTicketDetail = {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  pageUrl: string | null;
  status: TicketStatus;
  priority: Priority;
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  reporterName: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  attachments: AdminTicketAttachment[];
  linkedTask: AdminLinkedTask | null;
};

/** NOT_FOUND only for a genuinely non-existent id — an admin can open any ticket, no ownership check. */
export async function getTicketByIdForAdmin(
  requestHeaders: Headers,
  ticketId: string,
  database: Database = db,
): Promise<AdminTicketDetail> {
  await requireAdmin(requestHeaders);

  const [row] = await database
    .select({
      ticket: tickets,
      clientId: clients.id,
      clientName: clients.name,
      projectId: projects.id,
      projectName: projects.name,
      reporterName: userTable.name,
    })
    .from(tickets)
    .innerJoin(projects, eq(projects.id, tickets.projectId))
    .innerJoin(clients, eq(clients.id, projects.clientId))
    .innerJoin(userTable, eq(userTable.id, tickets.reportedById))
    .where(eq(tickets.id, ticketId))
    .limit(1);

  if (!row) {
    throw new AccessError('NOT_FOUND', 'Ticket not found.');
  }

  const attachments = await database
    .select({
      id: files.id,
      filename: files.filename,
      mimeType: files.mimeType,
      size: files.size,
    })
    .from(ticketAttachments)
    .innerJoin(files, eq(files.id, ticketAttachments.fileId))
    .where(eq(ticketAttachments.ticketId, ticketId));

  const [linkedTask] = await database
    .select({ id: tasks.id, title: tasks.title, status: tasks.status, dueDate: tasks.dueDate })
    .from(tasks)
    .where(eq(tasks.ticketId, ticketId))
    .limit(1);

  return {
    id: row.ticket.id,
    reference: ticketReference(row.ticket.id),
    title: row.ticket.title,
    description: row.ticket.description,
    pageUrl: row.ticket.pageUrl,
    status: row.ticket.status,
    priority: row.ticket.priority,
    clientId: row.clientId,
    clientName: row.clientName,
    projectId: row.projectId,
    projectName: row.projectName,
    reporterName: row.reporterName,
    createdAt: row.ticket.createdAt,
    updatedAt: row.ticket.updatedAt,
    resolvedAt: row.ticket.resolvedAt,
    attachments,
    linkedTask: linkedTask
      ? {
          id: linkedTask.id,
          reference: taskReference(linkedTask.id),
          title: linkedTask.title,
          status: linkedTask.status,
          dueDate: linkedTask.dueDate,
        }
      : null,
  };
}
