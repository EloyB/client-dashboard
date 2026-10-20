import { and, eq, lt, sql } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { clients, events, projects, type EventType } from '@/db/schema';
import { requireAdmin } from '@/lib/access';

/**
 * Admin-only event queries for the global calendar (8b) — kept entirely
 * separate from features/events/queries.ts (the per-project, portal-shared
 * queries): each file resolves and scopes its own session, so this one can
 * never accidentally skip a client-visibility check the other relies on.
 */

export type CalendarEvent = {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  title: string;
  description: string | null;
  type: EventType;
  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
  location: string | null;
  visibleToClient: boolean;
};

/**
 * Events whose occurrence overlaps [start, end) — `end` is exclusive (the
 * first instant after the period), so the calendar only loads what the
 * current month or week actually needs, never the full table.
 */
export async function listEventsForCalendar(
  requestHeaders: Headers,
  { start, end, projectId, type }: { start: Date; end: Date; projectId?: string; type?: EventType },
  database: Database = db,
): Promise<CalendarEvent[]> {
  await requireAdmin(requestHeaders);

  const conditions = [
    lt(events.startsAt, end),
    sql`coalesce(${events.endsAt}, ${events.startsAt}) >= ${start.toISOString()}`,
  ];
  if (projectId) conditions.push(eq(events.projectId, projectId));
  if (type) conditions.push(eq(events.type, type));

  const rows = await database
    .select({
      id: events.id,
      projectId: events.projectId,
      projectName: projects.name,
      clientName: clients.name,
      title: events.title,
      description: events.description,
      type: events.type,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      allDay: events.allDay,
      location: events.location,
      visibleToClient: events.visibleToClient,
    })
    .from(events)
    .innerJoin(projects, eq(projects.id, events.projectId))
    .innerJoin(clients, eq(clients.id, projects.clientId))
    .where(and(...conditions))
    .orderBy(events.startsAt);

  return rows;
}
