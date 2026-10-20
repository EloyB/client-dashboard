import { and, eq } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { events, projects, type EventType } from '@/db/schema';
import type { AuthenticatedUser } from '@/lib/access';

export type PortalEventRow = {
  id: string;
  title: string;
  description: string | null;
  type: EventType;
  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
  location: string | null;
  projectId: string;
  projectName: string;
};

/**
 * Every event shared with the client's own projects — never another
 * client's events, and never one with visibleToClient: false. Kept fully
 * separate from the admin-side features/events/queries.admin.ts (no shared
 * query with a role flag), per the rule agreed in slice 5d and followed for
 * documents (queries.portal.ts) in 6b.
 */
export async function listEventsForClient(
  user: AuthenticatedUser & { clientId: string },
  database: Database = db,
): Promise<PortalEventRow[]> {
  return database
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      type: events.type,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      allDay: events.allDay,
      location: events.location,
      projectId: events.projectId,
      projectName: projects.name,
    })
    .from(events)
    .innerJoin(projects, eq(projects.id, events.projectId))
    .where(and(eq(projects.clientId, user.clientId), eq(events.visibleToClient, true)))
    .orderBy(events.startsAt);
}
