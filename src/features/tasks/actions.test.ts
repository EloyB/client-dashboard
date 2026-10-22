import { asc, eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

let currentHeaders = new Headers();
vi.mock('next/headers', () => ({
  headers: async () => currentHeaders,
}));

const { db } = await import('@/db');
const { activityLog, clients, tasks } = await import('@/db/schema');
const { adminHeaders, createTempClient, createTempClientUserSession, createTempProject } =
  await import('@/db/test-real-session');
const { createTask, deleteTask, moveTask, updateTask, updateTaskStatus } =
  await import('@/features/tasks/actions');

async function deleteTempClient(clientId: string) {
  await db.delete(clients).where(eq(clients.id, clientId));
}

async function createTempTask(
  projectId: string,
  overrides: Partial<typeof tasks.$inferInsert> = {},
) {
  const [task] = await db
    .insert(tasks)
    .values({ projectId, title: 'Testtaak', position: 'a0', ...overrides })
    .returning();
  return task;
}

describe('createTask (admin server action)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { headers, cleanup } = await createTempClientUserSession(client.id);

    try {
      currentHeaders = headers;
      const result = await createTask({
        projectId: project.id,
        title: 'Taak',
        description: '',
        status: 'todo',
        priority: 'medium',
      });
      expect(result).toMatchObject({
        success: false,
        formError: 'This action requires an admin account.',
      });
    } finally {
      await cleanup();
      await deleteTempClient(client.id);
    }
  });

  it('creates a task with a position after existing tasks in the same status column', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const first = await createTempTask(project.id, { status: 'todo', position: 'a0' });

    try {
      currentHeaders = await adminHeaders();
      const result = await createTask({
        projectId: project.id,
        title: 'Tweede taak',
        description: 'Met omschrijving',
        status: 'todo',
        priority: 'high',
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.position > first.position).toBe(true);
      expect(result.data.completedAt).toBeNull();
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('sets completedAt when created directly with status done', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);

    try {
      currentHeaders = await adminHeaders();
      const result = await createTask({
        projectId: project.id,
        title: 'Al klaar',
        description: '',
        status: 'done',
        priority: 'low',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.completedAt).toBeInstanceOf(Date);
      }
    } finally {
      await deleteTempClient(client.id);
    }
  });
});

describe('updateTaskStatus (admin server action)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { headers, cleanup } = await createTempClientUserSession(client.id);
    const task = await createTempTask(project.id);

    try {
      currentHeaders = headers;
      const result = await updateTaskStatus({ taskId: task.id, status: 'done' });
      expect(result).toMatchObject({
        success: false,
        formError: 'This action requires an admin account.',
      });
    } finally {
      await cleanup();
      await deleteTempClient(client.id);
    }
  });

  it('sets completedAt when moving to done, and logs the change', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const task = await createTempTask(project.id, { status: 'todo' });

    try {
      currentHeaders = await adminHeaders();
      const result = await updateTaskStatus({ taskId: task.id, status: 'done' });
      expect(result.success).toBe(true);

      const [updated] = await db.select().from(tasks).where(eq(tasks.id, task.id)).limit(1);
      expect(updated.status).toBe('done');
      expect(updated.completedAt).toBeInstanceOf(Date);

      const [logEntry] = await db
        .select()
        .from(activityLog)
        .where(eq(activityLog.taskId, task.id))
        .limit(1);
      expect(logEntry).toMatchObject({ type: 'task_status_changed' });
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('clears completedAt when reopening a done task', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const task = await createTempTask(project.id, { status: 'done', completedAt: new Date() });

    try {
      currentHeaders = await adminHeaders();
      const result = await updateTaskStatus({ taskId: task.id, status: 'in_progress' });
      expect(result.success).toBe(true);

      const [updated] = await db.select().from(tasks).where(eq(tasks.id, task.id)).limit(1);
      expect(updated.status).toBe('in_progress');
      expect(updated.completedAt).toBeNull();
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('rejects an invalid status value', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const task = await createTempTask(project.id);

    try {
      currentHeaders = await adminHeaders();
      const result = await updateTaskStatus({ taskId: task.id, status: 'archived' as never });
      expect(result).toMatchObject({
        success: false,
        fieldErrors: { status: [expect.any(String)] },
      });
    } finally {
      await deleteTempClient(client.id);
    }
  });
});

describe('moveTask (admin server action)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { headers, cleanup } = await createTempClientUserSession(client.id);
    const task = await createTempTask(project.id);

    try {
      currentHeaders = headers;
      const result = await moveTask({
        taskId: task.id,
        status: 'todo',
        previousTaskId: null,
        nextTaskId: null,
      });
      expect(result).toMatchObject({
        success: false,
        formError: 'This action requires an admin account.',
      });
    } finally {
      await cleanup();
      await deleteTempClient(client.id);
    }
  });

  it('places the task between two named neighbors in the same column', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const first = await createTempTask(project.id, { status: 'todo', position: 'a0' });
    const second = await createTempTask(project.id, { status: 'todo', position: 'a2' });
    const moving = await createTempTask(project.id, { status: 'todo', position: 'z0' });

    try {
      currentHeaders = await adminHeaders();
      const result = await moveTask({
        taskId: moving.id,
        status: 'todo',
        previousTaskId: first.id,
        nextTaskId: second.id,
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.position > first.position).toBe(true);
      expect(result.data.position < second.position).toBe(true);
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('sets completedAt when moved into done, and logs the change', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const task = await createTempTask(project.id, { status: 'todo' });

    try {
      currentHeaders = await adminHeaders();
      const result = await moveTask({
        taskId: task.id,
        status: 'done',
        previousTaskId: null,
        nextTaskId: null,
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.completedAt).toBeInstanceOf(Date);

      const [logEntry] = await db
        .select()
        .from(activityLog)
        .where(eq(activityLog.taskId, task.id))
        .limit(1);
      expect(logEntry).toMatchObject({ type: 'task_status_changed' });
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('rejects a neighbor task from a different project', async () => {
    const client = await createTempClient();
    const projectA = await createTempProject(client.id);
    const projectB = await createTempProject(client.id);
    const task = await createTempTask(projectA.id, { status: 'todo' });
    const outsider = await createTempTask(projectB.id, { status: 'todo' });

    try {
      currentHeaders = await adminHeaders();
      const result = await moveTask({
        taskId: task.id,
        status: 'todo',
        previousTaskId: outsider.id,
        nextTaskId: null,
      });
      expect(result).toMatchObject({ success: false, formError: expect.any(String) });
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('keeps a stable order after many repeated moves within a column', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const initial = await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        createTempTask(project.id, { status: 'todo', position: `a${index}` }),
      ),
    );

    try {
      currentHeaders = await adminHeaders();
      let order = initial;

      // Repeatedly move the last task to the front, ten times — the scenario
      // the user flagged as where fractional indexing tends to break.
      for (let move = 0; move < 10; move++) {
        const moving = order[order.length - 1];
        const target = order[0];
        const result = await moveTask({
          taskId: moving.id,
          status: 'todo',
          previousTaskId: null,
          nextTaskId: target.id,
        });
        expect(result.success).toBe(true);
        if (!result.success) return;
        order = [{ ...moving, position: result.data.position }, ...order.slice(0, -1)];
      }

      const rows = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, project.id))
        .orderBy(asc(tasks.position));
      expect(rows.map((row) => row.id)).toEqual(order.map((task) => task.id));
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('rejects a neighbor task from a different status column', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const task = await createTempTask(project.id, { status: 'todo' });
    const otherColumn = await createTempTask(project.id, { status: 'done' });

    try {
      currentHeaders = await adminHeaders();
      const result = await moveTask({
        taskId: task.id,
        status: 'todo',
        previousTaskId: otherColumn.id,
        nextTaskId: null,
      });
      expect(result).toMatchObject({ success: false, formError: expect.any(String) });
    } finally {
      await deleteTempClient(client.id);
    }
  });
});

describe('updateTask (admin server action)', () => {
  it('updates fields without touching position when the status stays the same', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const task = await createTempTask(project.id, { status: 'todo', position: 'm0' });

    try {
      currentHeaders = await adminHeaders();
      const result = await updateTask({
        taskId: task.id,
        projectId: project.id,
        title: 'Bijgewerkte titel',
        description: '',
        status: 'todo',
        priority: 'high',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.position).toBe('m0');
        expect(result.data.title).toBe('Bijgewerkte titel');
      }
    } finally {
      await deleteTempClient(client.id);
    }
  });
});

describe('deleteTask (admin server action)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { headers, cleanup } = await createTempClientUserSession(client.id);
    const task = await createTempTask(project.id);

    try {
      currentHeaders = headers;
      const result = await deleteTask({ taskId: task.id });
      expect(result).toMatchObject({
        success: false,
        formError: 'This action requires an admin account.',
      });
    } finally {
      await cleanup();
      await deleteTempClient(client.id);
    }
  });

  it('deletes the task', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const task = await createTempTask(project.id);

    try {
      currentHeaders = await adminHeaders();
      const result = await deleteTask({ taskId: task.id });
      expect(result.success).toBe(true);

      const [remaining] = await db.select().from(tasks).where(eq(tasks.id, task.id)).limit(1);
      expect(remaining).toBeUndefined();
    } finally {
      await deleteTempClient(client.id);
    }
  });
});
