import { and, asc, desc, eq, ne } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { projects, ticketComments, tickets } from '@/db/schema';
import { AccessError, assertProjectAccess, type AuthenticatedUser } from '@/lib/access';

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
