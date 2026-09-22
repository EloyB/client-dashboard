import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

// Every action reads the session via next/headers' headers(), which throws
// outside a real request. Mocking it lets these tests drive requireAdmin's
// actual FORBIDDEN/UNAUTHENTICATED behaviour through the real actions
// instead of only through their underlying helpers.
let currentHeaders = new Headers();
vi.mock('next/headers', () => ({
  headers: async () => currentHeaders,
}));

// revalidatePath needs a real Next.js request/render context, which a
// plain vitest run doesn't have — the actions call it for real, so it's
// mocked here rather than removed.
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const { db } = await import('@/db');
const { clients, projects } = await import('@/db/schema');
const { adminHeaders, createTempClientSession, unique } = await import('@/db/test-real-session');
const { archiveProject, createProject, updateProject } =
  await import('@/features/projects/actions');

async function createTempClient(overrides: Partial<typeof clients.$inferInsert> = {}) {
  const [client] = await db
    .insert(clients)
    .values({ name: unique('Temp Client'), email: unique('temp-client'), ...overrides })
    .returning();
  return client;
}

async function createTempProject(
  clientId: string,
  overrides: Partial<typeof projects.$inferInsert> = {},
) {
  const [project] = await db
    .insert(projects)
    .values({ clientId, name: unique('Temp Project'), status: 'active', ...overrides })
    .returning();
  return project;
}

const validFields = {
  name: 'Test project',
  description: '',
  websiteUrl: '',
  status: 'active' as const,
  startDate: new Date('2026-01-01'),
  dueDate: new Date('2026-06-01'),
};

describe('createProject (server action)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const { headers, cleanup } = await createTempClientSession();
    try {
      currentHeaders = headers;
      const result = await createProject({ ...validFields, clientId: client.id });
      expect(result).toMatchObject({
        success: false,
        formError: 'This action requires an admin account.',
      });
    } finally {
      await cleanup();
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  it('creates a project with valid input', async () => {
    const client = await createTempClient();
    currentHeaders = await adminHeaders();

    try {
      const result = await createProject({ ...validFields, clientId: client.id });
      expect(result.success).toBe(true);
      if (!result.success) return;

      const [created] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, result.data.projectId))
        .limit(1);
      expect(created).toMatchObject({
        clientId: client.id,
        name: 'Test project',
        status: 'active',
        startDate: '2026-01-01',
        dueDate: '2026-06-01',
      });
    } finally {
      await db.delete(projects).where(eq(projects.clientId, client.id));
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  it('rejects invalid input (missing name)', async () => {
    const client = await createTempClient();
    currentHeaders = await adminHeaders();

    try {
      const result = await createProject({ ...validFields, clientId: client.id, name: '' });
      expect(result).toMatchObject({
        success: false,
        fieldErrors: { name: [expect.any(String)] },
      });
    } finally {
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  it('rejects a due date before the start date', async () => {
    const client = await createTempClient();
    currentHeaders = await adminHeaders();

    try {
      const result = await createProject({
        ...validFields,
        clientId: client.id,
        startDate: new Date('2026-06-01'),
        dueDate: new Date('2026-01-01'),
      });
      expect(result).toMatchObject({
        success: false,
        fieldErrors: { dueDate: [expect.any(String)] },
      });
    } finally {
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  it('requires a due date for a planned or active project', async () => {
    const client = await createTempClient();
    currentHeaders = await adminHeaders();

    try {
      const result = await createProject({
        ...validFields,
        clientId: client.id,
        status: 'active',
        dueDate: undefined,
      });
      expect(result).toMatchObject({
        success: false,
        fieldErrors: { dueDate: [expect.any(String)] },
      });
    } finally {
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  it('rejects a non-existent client id', async () => {
    currentHeaders = await adminHeaders();

    const result = await createProject({ ...validFields, clientId: crypto.randomUUID() });
    expect(result).toMatchObject({ success: false, formError: 'Kies een bestaande klant.' });
  });
});

describe('updateProject (server action)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { headers, cleanup } = await createTempClientSession();

    try {
      currentHeaders = headers;
      const result = await updateProject({
        ...validFields,
        clientId: client.id,
        projectId: project.id,
      });
      expect(result).toMatchObject({
        success: false,
        formError: 'This action requires an admin account.',
      });
    } finally {
      await cleanup();
      await db.delete(projects).where(eq(projects.id, project.id));
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  it('updates a project with valid input', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    currentHeaders = await adminHeaders();

    try {
      const result = await updateProject({
        ...validFields,
        clientId: client.id,
        projectId: project.id,
        name: 'Bijgewerkte naam',
      });
      expect(result.success).toBe(true);

      const [updated] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, project.id))
        .limit(1);
      expect(updated).toMatchObject({ name: 'Bijgewerkte naam' });
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  it('rejects a non-existent project id', async () => {
    const client = await createTempClient();
    currentHeaders = await adminHeaders();

    try {
      const result = await updateProject({
        ...validFields,
        clientId: client.id,
        projectId: crypto.randomUUID(),
      });
      expect(result).toMatchObject({ success: false, formError: expect.any(String) });
    } finally {
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  it('rejects a non-existent client id', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    currentHeaders = await adminHeaders();

    try {
      const result = await updateProject({
        ...validFields,
        clientId: crypto.randomUUID(),
        projectId: project.id,
      });
      expect(result).toMatchObject({ success: false, formError: 'Kies een bestaande klant.' });
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  it('allows moving a project to a different client', async () => {
    const clientA = await createTempClient();
    const clientB = await createTempClient();
    const project = await createTempProject(clientA.id);
    currentHeaders = await adminHeaders();

    try {
      const result = await updateProject({
        ...validFields,
        clientId: clientB.id,
        projectId: project.id,
      });
      expect(result.success).toBe(true);

      const [updated] = await db
        .select({ clientId: projects.clientId })
        .from(projects)
        .where(eq(projects.id, project.id))
        .limit(1);
      expect(updated.clientId).toBe(clientB.id);
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
      await db.delete(clients).where(eq(clients.id, clientA.id));
      await db.delete(clients).where(eq(clients.id, clientB.id));
    }
  });
});

describe('archiveProject (server action)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { headers, cleanup } = await createTempClientSession();

    try {
      currentHeaders = headers;
      await expect(archiveProject(project.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    } finally {
      await cleanup();
      await db.delete(projects).where(eq(projects.id, project.id));
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  it('sets the status to archived', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id, { status: 'active' });
    currentHeaders = await adminHeaders();

    try {
      await archiveProject(project.id);
      const [updated] = await db
        .select({ status: projects.status })
        .from(projects)
        .where(eq(projects.id, project.id))
        .limit(1);
      expect(updated.status).toBe('archived');
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  it('rejects an already-archived project', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id, { status: 'archived' });
    currentHeaders = await adminHeaders();

    try {
      await expect(archiveProject(project.id)).rejects.toThrow('Dit project is al gearchiveerd.');
    } finally {
      await db.delete(projects).where(eq(projects.id, project.id));
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  it('rejects a non-existent project id', async () => {
    currentHeaders = await adminHeaders();
    await expect(archiveProject(crypto.randomUUID())).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
