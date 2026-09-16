import { desc, eq } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { tickets } from '@/db/schema';
import { AccessError, assertProjectAccess, type AuthenticatedUser } from '@/lib/access';

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
