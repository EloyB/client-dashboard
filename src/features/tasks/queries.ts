import { asc, eq } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { tasks } from '@/db/schema';
import { AccessError, assertProjectAccess, requireAdmin } from '@/lib/access';
import { ticketReference } from '@/lib/ticket-links';

/** Tasks are admin-only — never exposed to a portal query or route. */
export async function listTasksForProject(
  requestHeaders: Headers,
  projectId: string,
  database: Database = db,
) {
  const admin = await requireAdmin(requestHeaders);
  await assertProjectAccess(admin, projectId, database);

  const rows = await database
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.position));

  return rows.map((task) => ({
    ...task,
    ticketReference: task.ticketId ? ticketReference(task.ticketId) : null,
  }));
}

export async function getTaskById(
  requestHeaders: Headers,
  taskId: string,
  database: Database = db,
) {
  await requireAdmin(requestHeaders);

  const [task] = await database.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!task) {
    throw new AccessError('NOT_FOUND', 'Task not found.');
  }

  return task;
}
