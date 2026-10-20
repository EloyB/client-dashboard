import { and, asc, desc, eq, ne } from 'drizzle-orm';

import { db, type Database } from '@/db';
import {
  files,
  projects,
  ticketAttachments,
  ticketComments,
  tickets,
  user as userTable,
  type Priority,
  type TicketStatus,
} from '@/db/schema';
import { AccessError, assertProjectAccess, type AuthenticatedUser } from '@/lib/access';
import { ticketReference } from '@/lib/ticket-links';

export type SelectableProject = { id: string; name: string };

/** Used by the "report a bug" form (slice 5a) — a client's own non-archived projects. */
export async function listSelectableProjectsForClient(
  user: AuthenticatedUser & { clientId: string },
  database: Database = db,
): Promise<SelectableProject[]> {
  return database
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(and(eq(projects.clientId, user.clientId), ne(projects.status, 'archived')))
    .orderBy(projects.name);
}

export type PortalTicketListRow = {
  id: string;
  reference: string;
  title: string;
  projectId: string;
  projectName: string;
  status: TicketStatus;
  priority: Priority;
  reporterId: string;
  reporterName: string;
  updatedAt: Date;
};

/** Used by the portal ticket overview (slice 5c) — every ticket across the client's own projects, regardless of who on that client reported it. */
export async function listTicketsForClient(
  user: AuthenticatedUser & { clientId: string },
  database: Database = db,
): Promise<PortalTicketListRow[]> {
  const rows = await database
    .select({
      id: tickets.id,
      title: tickets.title,
      projectId: tickets.projectId,
      projectName: projects.name,
      status: tickets.status,
      priority: tickets.priority,
      reporterId: userTable.id,
      reporterName: userTable.name,
      updatedAt: tickets.updatedAt,
    })
    .from(tickets)
    .innerJoin(projects, eq(projects.id, tickets.projectId))
    .innerJoin(userTable, eq(userTable.id, tickets.reportedById))
    .where(eq(projects.clientId, user.clientId))
    .orderBy(desc(tickets.updatedAt));

  return rows.map((row) => ({ ...row, reference: ticketReference(row.id) }));
}

export type PortalTicketAttachment = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
};

export type PortalTicketDetail = {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  pageUrl: string | null;
  status: TicketStatus;
  priority: Priority;
  projectName: string;
  reporterName: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  attachments: PortalTicketAttachment[];
};

/**
 * Used by the portal ticket detail (slice 5c). Reuses getTicketById for the
 * NOT_FOUND-for-either-case access check, then enriches with display-only
 * data — never tasks or internal notes, which don't belong to the client.
 */
export async function getTicketDetailForClient(
  user: AuthenticatedUser,
  ticketId: string,
  database: Database = db,
): Promise<PortalTicketDetail> {
  const ticket = await getTicketById(user, ticketId, database);

  const [projectRow] = await database
    .select({ name: projects.name })
    .from(projects)
    .where(eq(projects.id, ticket.projectId))
    .limit(1);
  const [reporterRow] = await database
    .select({ name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, ticket.reportedById))
    .limit(1);
  const attachments = await database
    .select({
      id: files.id,
      filename: files.filename,
      mimeType: files.mimeType,
      size: files.size,
    })
    .from(ticketAttachments)
    .innerJoin(files, eq(files.id, ticketAttachments.fileId))
    .where(eq(ticketAttachments.ticketId, ticket.id));

  return {
    id: ticket.id,
    reference: ticketReference(ticket.id),
    title: ticket.title,
    description: ticket.description,
    pageUrl: ticket.pageUrl,
    status: ticket.status,
    priority: ticket.priority,
    projectName: projectRow?.name ?? '',
    reporterName: reporterRow?.name ?? '',
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    resolvedAt: ticket.resolvedAt,
    attachments,
  };
}

export async function listTicketsForProject(
  user: AuthenticatedUser,
  projectId: string,
  database: Database = db,
) {
  await assertProjectAccess(user, projectId, database);

  return database
    .select()
    .from(tickets)
    .where(eq(tickets.projectId, projectId))
    .orderBy(desc(tickets.createdAt));
}

export async function getTicketById(
  user: AuthenticatedUser,
  ticketId: string,
  database: Database = db,
) {
  const [ticket] = await database.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);

  if (!ticket) {
    throw new AccessError('NOT_FOUND', 'Ticket not found.');
  }

  await assertProjectAccess(user, ticket.projectId, database);

  return ticket;
}

export async function listCommentsForTicket(
  user: AuthenticatedUser,
  ticketId: string,
  database: Database = db,
) {
  await getTicketById(user, ticketId, database);

  return database
    .select()
    .from(ticketComments)
    .where(eq(ticketComments.ticketId, ticketId))
    .orderBy(asc(ticketComments.createdAt));
}

export async function addCommentToTicket(
  user: AuthenticatedUser,
  ticketId: string,
  body: string,
  database: Database = db,
) {
  await getTicketById(user, ticketId, database);

  const [comment] = await database
    .insert(ticketComments)
    .values({ ticketId, authorId: user.id, body })
    .returning();

  return comment;
}
