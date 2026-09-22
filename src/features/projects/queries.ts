import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db, type Database } from '@/db';
import { clients, events, projects, tickets, type ProjectStatus } from '@/db/schema';
import { AccessError, requireAdmin } from '@/lib/access';

export type ProjectListRow = {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  nextDeadline: { startsAt: Date; title: string } | null;
  openTicketCount: number;
};

/**
 * One query: two LEFT JOIN LATERALs instead of a per-row lookup. Each is
 * itself a single-row-per-project subquery (a `LIMIT 1` for the nearest
 * deadline, a whole-table `count(*)` for open tickets), so neither fans out
 * the outer row set and no GROUP BY is needed.
 */
export async function listProjects(
  requestHeaders: Headers,
  database: Database = db,
): Promise<ProjectListRow[]> {
  await requireAdmin(requestHeaders);

  const nextDeadline = database
    .select({ startsAt: events.startsAt, title: events.title })
    .from(events)
    .where(
      and(
        eq(events.projectId, projects.id),
        eq(events.type, 'deadline'),
        gte(events.startsAt, new Date()),
      ),
    )
    .orderBy(events.startsAt)
    .limit(1)
    .as('next_deadline');

  const openTickets = database
    .select({ count: sql<number>`count(*)::int`.as('count') })
    .from(tickets)
    .where(and(eq(tickets.projectId, projects.id), inArray(tickets.status, ['new', 'in_progress'])))
    .as('open_tickets');

  const rows = await database
    .select({
      id: projects.id,
      name: projects.name,
      clientId: projects.clientId,
      clientName: clients.name,
      status: projects.status,
      startDate: projects.startDate,
      dueDate: projects.dueDate,
      nextDeadlineAt: nextDeadline.startsAt,
      nextDeadlineTitle: nextDeadline.title,
      openTicketCount: openTickets.count,
    })
    .from(projects)
    .innerJoin(clients, eq(clients.id, projects.clientId))
    .leftJoinLateral(nextDeadline, sql`true`)
    .leftJoinLateral(openTickets, sql`true`)
    .orderBy(sql`${nextDeadline.startsAt} asc nulls last`);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    clientId: row.clientId,
    clientName: row.clientName,
    status: row.status,
    startDate: row.startDate,
    dueDate: row.dueDate,
    nextDeadline: row.nextDeadlineAt
      ? { startsAt: row.nextDeadlineAt, title: row.nextDeadlineTitle ?? '' }
      : null,
    openTicketCount: row.openTicketCount,
  }));
}

export type ProjectDetail = {
  project: typeof projects.$inferSelect;
  clientName: string;
};

/** Throws NOT_FOUND for both a malformed and a non-existent id, so neither is distinguishable. */
export async function getProjectById(
  requestHeaders: Headers,
  projectId: string,
  database: Database = db,
): Promise<ProjectDetail> {
  await requireAdmin(requestHeaders);

  if (!z.uuid().safeParse(projectId).success) {
    throw new AccessError('NOT_FOUND', 'Project not found.');
  }

  const [row] = await database
    .select({ project: projects, clientName: clients.name })
    .from(projects)
    .innerJoin(clients, eq(clients.id, projects.clientId))
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!row) {
    throw new AccessError('NOT_FOUND', 'Project not found.');
  }

  return { project: row.project, clientName: row.clientName };
}

export type SelectableClient = { id: string; name: string };

export async function listSelectableClients(
  requestHeaders: Headers,
  database: Database = db,
): Promise<SelectableClient[]> {
  await requireAdmin(requestHeaders);

  return database
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .orderBy(clients.name);
}
