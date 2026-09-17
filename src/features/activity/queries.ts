import { and, desc, eq, isNull } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { activityLog } from '@/db/schema';
import { assertProjectAccess, isAdmin, type AuthenticatedUser } from '@/lib/access';

/**
 * Task-related activity is never shown to clients, since clients never
 * access tasks at all — the same rule as CLAUDE.md's access control for
 * the tasks table itself.
 */
export async function listActivityForProject(
  user: AuthenticatedUser,
  projectId: string,
  database: Database = db,
) {
  await assertProjectAccess(user, projectId, database);

  const conditions = isAdmin(user)
    ? eq(activityLog.projectId, projectId)
    : and(eq(activityLog.projectId, projectId), isNull(activityLog.taskId));

  return database.select().from(activityLog).where(conditions).orderBy(desc(activityLog.createdAt));
}
