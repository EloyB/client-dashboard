import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db, type Database } from '@/db';
import { clients, projects, tickets, user as userTable, type ProjectStatus } from '@/db/schema';
import { AccessError, requireAdmin } from '@/lib/access';
import { peekInviteToken } from '@/lib/invite-token';

export type Invitation = {
  userId: string;
  name: string;
  email: string;
  clientId: string;
  clientName: string;
};

/** Read-only: used to prefill the acceptance page. Does not consume the token. */
export async function getInvitationByToken(
  token: string,
  database: Database = db,
): Promise<Invitation | null> {
  const peeked = await peekInviteToken(token, database);
  if (!peeked) return null;

  const [invitedUser] = await database
    .select({ name: userTable.name, email: userTable.email, clientId: userTable.clientId })
    .from(userTable)
    .where(eq(userTable.id, peeked.userId))
    .limit(1);
  if (!invitedUser || !invitedUser.clientId) return null;

  const [client] = await database
    .select({ name: clients.name })
    .from(clients)
    .where(eq(clients.id, invitedUser.clientId))
    .limit(1);
  if (!client) return null;

  return {
    userId: peeked.userId,
    name: invitedUser.name,
    email: invitedUser.email,
    clientId: invitedUser.clientId,
    clientName: client.name,
  };
}

export type ClientListRow = {
  id: string;
  name: string;
  email: string;
  activeProjectCount: number;
  openTicketCount: number;
};

/**
 * One query with conditional aggregation instead of a count per client: the
 * double left join fans out into multiple rows per client (one per matching
 * project/ticket combination), but `count(distinct ...)` dedupes correctly
 * since every ticket and project still belongs to exactly one client.
 */
export async function listClients(
  requestHeaders: Headers,
  database: Database = db,
): Promise<ClientListRow[]> {
  await requireAdmin(requestHeaders);

  return database
    .select({
      id: clients.id,
      name: clients.name,
      email: clients.email,
      activeProjectCount: sql<number>`count(distinct ${projects.id}) filter (where ${projects.status} = 'active')::int`,
      openTicketCount: sql<number>`count(distinct ${tickets.id}) filter (where ${tickets.status} in ('new', 'in_progress'))::int`,
    })
    .from(clients)
    .leftJoin(projects, eq(projects.clientId, clients.id))
    .leftJoin(tickets, eq(tickets.projectId, projects.id))
    .groupBy(clients.id)
    .orderBy(clients.name);
}

export type ClientProjectRow = {
  id: string;
  name: string;
  status: ProjectStatus;
  dueDate: string | null;
};

export type ClientUserRow = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
};

export type ClientDetail = {
  client: typeof clients.$inferSelect;
  projects: ClientProjectRow[];
  users: ClientUserRow[];
};

/** Throws NOT_FOUND for both a malformed and a non-existent id, so neither is distinguishable. */
export async function getClientById(
  requestHeaders: Headers,
  clientId: string,
  database: Database = db,
): Promise<ClientDetail> {
  await requireAdmin(requestHeaders);

  if (!z.uuid().safeParse(clientId).success) {
    throw new AccessError('NOT_FOUND', 'Client not found.');
  }

  const [client] = await database.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) {
    throw new AccessError('NOT_FOUND', 'Client not found.');
  }

  const clientProjects = await database
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      dueDate: projects.dueDate,
    })
    .from(projects)
    .where(eq(projects.clientId, clientId))
    .orderBy(projects.name);

  const clientUsers = await database
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      emailVerified: userTable.emailVerified,
    })
    .from(userTable)
    .where(eq(userTable.clientId, clientId))
    .orderBy(userTable.name);

  return { client, projects: clientProjects, users: clientUsers };
}
