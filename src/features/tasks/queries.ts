import { and, asc, desc, eq, lte, ne, or } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { clients, projects, tasks } from '@/db/schema';
import { AccessError, assertProjectAccess, requireAdmin } from '@/lib/access';
import { endOfWeek } from '@/features/tasks/grouping';
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

/**
 * For the admin home page (9a) — not-done tasks that are either overdue,
 * due by the end of this week, or already in progress. Filtered in SQL
 * (not fetched-then-filtered from listAllTasksForAdmin) so a studio with a
 * long task history never slows this section down.
 */
export async function listTasksForDashboard(
  requestHeaders: Headers,
  today: string,
  database: Database = db,
) {
  await requireAdmin(requestHeaders);

  const rows = await database
    .select({
      task: tasks,
      projectName: projects.name,
      clientName: clients.name,
    })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .innerJoin(clients, eq(clients.id, projects.clientId))
    .where(
      and(
        ne(tasks.status, 'done'),
        or(lte(tasks.dueDate, endOfWeek(today)), eq(tasks.status, 'in_progress')),
      ),
    )
    .orderBy(asc(tasks.dueDate));

  return rows.map((row) => ({
    ...row.task,
    reference: taskReference(row.task.id),
    projectName: row.projectName,
    clientName: row.clientName,
  }));
}

export type DashboardTaskRow = Awaited<ReturnType<typeof listTasksForDashboard>>[number];
