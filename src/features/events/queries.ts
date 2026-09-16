import { and, eq } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { events } from '@/db/schema';
import {
  AccessError,
  assertProjectAccess,
  isAdmin,
  isVisibleToUser,
  type AuthenticatedUser,
} from '@/lib/access';

export async function listEventsForProject(
  user: AuthenticatedUser,
  projectId: string,
  database: Database = db,
) {
  await assertProjectAccess(user, projectId, database);

  const conditions = isAdmin(user)
    ? eq(events.projectId, projectId)
    : and(eq(events.projectId, projectId), eq(events.visibleToClient, true));

  return database.select().from(events).where(conditions).orderBy(events.startsAt);
}

export async function getEventById(
  user: AuthenticatedUser,
  eventId: string,
  database: Database = db,
) {
  const [event] = await database.select().from(events).where(eq(events.id, eventId)).limit(1);

  if (!event) {
    throw new AccessError('NOT_FOUND', 'Event not found.');
  }

  await assertProjectAccess(user, event.projectId, database);

  if (!isVisibleToUser(user, event)) {
    throw new AccessError('NOT_FOUND', 'Event not found.');
  }

  return event;
}
