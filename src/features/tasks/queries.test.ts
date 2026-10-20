import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

const { db } = await import('@/db');
const { clients, tasks } = await import('@/db/schema');
const { adminHeaders, createTempClient, createTempClientUserSession, createTempProject } =
  await import('@/db/test-real-session');
const { getTaskById, listAllTasksForAdmin, listTasksForProject } =
  await import('@/features/tasks/queries');
const { taskReference } = await import('@/lib/task-links');

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

describe('listTasksForProject', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { headers, cleanup } = await createTempClientUserSession(client.id);

    try {
      await expect(listTasksForProject(headers, project.id)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    } finally {
      await cleanup();
      await deleteTempClient(client.id);
    }
  });

  it('returns only tasks from the given project, ordered by position', async () => {
    const client = await createTempClient();
    const projectA = await createTempProject(client.id);
    const projectB = await createTempProject(client.id);
    const taskA1 = await createTempTask(projectA.id, { position: 'a0' });
    const taskA2 = await createTempTask(projectA.id, { position: 'a1' });
    await createTempTask(projectB.id, { position: 'a0' });

    try {
      const result = await listTasksForProject(await adminHeaders(), projectA.id);
      expect(result.map((task) => task.id)).toEqual([taskA1.id, taskA2.id]);
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('includes the task’s own reference', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const task = await createTempTask(project.id);

    try {
      const [result] = await listTasksForProject(await adminHeaders(), project.id);
      expect(result.reference).toBe(taskReference(task.id));
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('includes a ticket reference only when linked', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    await createTempTask(project.id);

    try {
      const [result] = await listTasksForProject(await adminHeaders(), project.id);
      expect(result.ticketReference).toBeNull();
    } finally {
      await deleteTempClient(client.id);
    }
  });
});

describe('listAllTasksForAdmin', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const { headers, cleanup } = await createTempClientUserSession(client.id);

    try {
      await expect(listAllTasksForAdmin(headers)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    } finally {
      await cleanup();
      await deleteTempClient(client.id);
    }
  });

  it('includes tasks across every project, with client and project names joined in', async () => {
    const clientA = await createTempClient();
    const clientB = await createTempClient();
    const projectA = await createTempProject(clientA.id);
    const projectB = await createTempProject(clientB.id);
    const taskA = await createTempTask(projectA.id, { title: 'Taak A' });
    const taskB = await createTempTask(projectB.id, { title: 'Taak B' });

    try {
      const result = await listAllTasksForAdmin(await adminHeaders());
      const ids = result.map((task) => task.id);
      expect(ids).toEqual(expect.arrayContaining([taskA.id, taskB.id]));

      const rowA = result.find((task) => task.id === taskA.id);
      expect(rowA).toMatchObject({
        projectName: projectA.name,
        clientId: clientA.id,
        clientName: clientA.name,
      });
    } finally {
      await deleteTempClient(clientA.id);
      await deleteTempClient(clientB.id);
    }
  });
});

describe('getTaskById', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { headers, cleanup } = await createTempClientUserSession(client.id);
    const task = await createTempTask(project.id);

    try {
      await expect(getTaskById(headers, task.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    } finally {
      await cleanup();
      await deleteTempClient(client.id);
    }
  });

  it('throws NOT_FOUND for a non-existent id', async () => {
    await expect(getTaskById(await adminHeaders(), crypto.randomUUID())).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
