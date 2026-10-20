import { and, eq, gte, inArray, ne, sql } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { events, projects, type ProjectStatus } from '@/db/schema';
import type { AuthenticatedUser } from '@/lib/access';

export type PortalProjectRow = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  nextStep: { title: string; startsAt: Date } | null;
};

/**
 * The client's own, non-archived projects, each with its nearest upcoming
 * visible deadline or meeting ("volgende stap") — never a milestone/other
 * event, and never one with visibleToClient: false. Kept fully separate
 * from the admin-side features/projects/queries.ts, same rule as events and
 * documents (5d/6b/8c).
 */
export async function listProjectsForClient(
  user: AuthenticatedUser & { clientId: string },
  database: Database = db,
): Promise<PortalProjectRow[]> {
  const nextStep = database
    .select({ title: events.title, startsAt: events.startsAt })
    .from(events)
    .where(
      and(
        eq(events.projectId, projects.id),
        inArray(events.type, ['deadline', 'meeting']),
        eq(events.visibleToClient, true),
        gte(events.startsAt, new Date()),
      ),
    )
    .orderBy(events.startsAt)
    .limit(1)
    .as('next_step');

  const rows = await database
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      nextStepTitle: nextStep.title,
      nextStepStartsAt: nextStep.startsAt,
    })
    .from(projects)
    .leftJoinLateral(nextStep, sql`true`)
    .where(and(eq(projects.clientId, user.clientId), ne(projects.status, 'archived')))
    .orderBy(projects.name);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    nextStep: row.nextStepStartsAt
      ? { title: row.nextStepTitle ?? '', startsAt: row.nextStepStartsAt }
      : null,
  }));
}
