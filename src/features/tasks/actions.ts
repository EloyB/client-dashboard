'use server';

import { and, desc, eq } from 'drizzle-orm';
import { generateKeyBetween } from 'fractional-indexing';
import { headers } from 'next/headers';

import { db, type Database } from '@/db';
import { activityLog, tasks, type TaskStatus } from '@/db/schema';
import {
  createTaskSchema,
  deleteTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from '@/features/tasks/schemas';
import { AccessError, assertProjectAccess, requireAdmin } from '@/lib/access';
import { createFormAction } from '@/lib/form-action';
import { formatDateOnly } from '@/lib/utils';

const statusLabels: Record<TaskStatus, string> = {
  todo: 'Te doen',
  in_progress: 'Bezig',
  review: 'Review',
  done: 'Klaar',
};

/**
 * Appended after every other task already in this (project, status) column —
 * so 7b's kanban board can build directly on this ordering without a
 * migration or a backfill.
 */
async function nextPosition(projectId: string, status: TaskStatus, database: Database) {
  const [last] = await database
    .select({ position: tasks.position })
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.status, status)))
    .orderBy(desc(tasks.position))
    .limit(1);

  return generateKeyBetween(last?.position ?? null, null);
}

function completedAtFor(status: TaskStatus): Date | null {
  return status === 'done' ? new Date() : null;
}

async function getTaskOrNotFound(taskId: string) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!task) {
    throw new AccessError('NOT_FOUND', 'Task not found.');
  }
  return task;
}

export const createTask = createFormAction(createTaskSchema, async (data) => {
  const admin = await requireAdmin(await headers());
  await assertProjectAccess(admin, data.projectId);

  const position = await nextPosition(data.projectId, data.status, db);

  const [task] = await db
    .insert(tasks)
    .values({
      projectId: data.projectId,
      title: data.title,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      dueDate: formatDateOnly(data.dueDate),
      position,
      completedAt: completedAtFor(data.status),
    })
    .returning();

  return task;
});

export const updateTask = createFormAction(updateTaskSchema, async (data) => {
  const admin = await requireAdmin(await headers());
  await assertProjectAccess(admin, data.projectId);
  const existing = await getTaskOrNotFound(data.taskId);

  const statusChanged = existing.status !== data.status;
  const position = statusChanged
    ? await nextPosition(data.projectId, data.status, db)
    : existing.position;

  const [task] = await db.transaction(async (tx) => {
    const updated = await tx
      .update(tasks)
      .set({
        title: data.title,
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        dueDate: formatDateOnly(data.dueDate),
        position,
        completedAt: completedAtFor(data.status),
      })
      .where(eq(tasks.id, data.taskId))
      .returning();

    if (statusChanged) {
      await tx.insert(activityLog).values({
        projectId: data.projectId,
        taskId: data.taskId,
        actorId: admin.id,
        type: 'task_status_changed',
        description: `Taak "${data.title}" verplaatst naar "${statusLabels[data.status]}"`,
      });
    }

    return updated;
  });

  return task;
});

export const updateTaskStatus = createFormAction(updateTaskStatusSchema, async (data) => {
  const admin = await requireAdmin(await headers());
  const existing = await getTaskOrNotFound(data.taskId);

  if (existing.status === data.status) {
    return existing;
  }

  const position = await nextPosition(existing.projectId, data.status, db);

  const [task] = await db.transaction(async (tx) => {
    const updated = await tx
      .update(tasks)
      .set({ status: data.status, position, completedAt: completedAtFor(data.status) })
      .where(eq(tasks.id, data.taskId))
      .returning();

    await tx.insert(activityLog).values({
      projectId: existing.projectId,
      taskId: existing.id,
      actorId: admin.id,
      type: 'task_status_changed',
      description: `Taak "${existing.title}" verplaatst naar "${statusLabels[data.status]}"`,
    });

    return updated;
  });

  return task;
});

export const deleteTask = createFormAction(deleteTaskSchema, async (data) => {
  await requireAdmin(await headers());
  await getTaskOrNotFound(data.taskId);

  await db.delete(tasks).where(eq(tasks.id, data.taskId));

  return { id: data.taskId };
});
