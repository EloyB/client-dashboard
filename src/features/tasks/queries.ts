import { asc, desc, eq } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { clients, projects, tasks } from '@/db/schema';
import { AccessError, assertProjectAccess, requireAdmin } from '@/lib/access';
import { taskReference } from '@/lib/task-links';
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
    reference: taskReference(task.id),
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

/**
 * "Al mijn taken" (7e) — every task across every project, with the client
 * and project name already joined in (no N+1 from re-fetching those per
 * row). Newest-first is just a stable tie-breaker; the page groups and
 * orders by deadline itself.
 */
export async function listAllTasksForAdmin(requestHeaders: Headers, database: Database = db) {
  await requireAdmin(requestHeaders);

  const rows = await database
    .select({
      task: tasks,
      projectName: projects.name,
      clientId: clients.id,
      clientName: clients.name,
    })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .innerJoin(clients, eq(clients.id, projects.clientId))
    .orderBy(desc(tasks.createdAt));

  return rows.map((row) => ({
    ...row.task,
    reference: taskReference(row.task.id),
    ticketReference: row.task.ticketId ? ticketReference(row.task.ticketId) : null,
    projectName: row.projectName,
    clientId: row.clientId,
    clientName: row.clientName,
  }));
}

export type AllTasksRow = Awaited<ReturnType<typeof listAllTasksForAdmin>>[number];
