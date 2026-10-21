import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

// Every action reads the session via next/headers' headers(), which throws
// outside a real request. Mocking it lets these tests drive the real
// FORBIDDEN behaviour through the real actions.
let currentHeaders = new Headers();
vi.mock('next/headers', () => ({
  headers: async () => currentHeaders,
}));

const { db } = await import('@/db');
const { activityLog, clients, documents, files, user } = await import('@/db/schema');
const {
  ADMIN_EMAIL,
  adminHeaders,
  createTempClient,
  createTempClientUserSession,
  createTempProject,
  unique,
} = await import('@/db/test-real-session');
const { createDocument, deleteDocument, updateDocumentVisibility } =
  await import('@/features/documents/actions');

async function deleteTempClient(clientId: string) {
  await db.delete(clients).where(eq(clients.id, clientId));
}

async function tempAdminId(): Promise<string> {
  const [admin] = await db.select().from(user).where(eq(user.email, ADMIN_EMAIL)).limit(1);
  return admin.id;
}

// test-fixtures.ts's createTestFile/createTestDocument target the isolated
// testDb; these actions run against the real db (see test-real-session.ts),
// so fixtures here need to exist in that same database.
async function createTempFile(
  uploadedById: string,
  overrides: Partial<typeof files.$inferInsert> = {},
) {
  const [file] = await db
    .insert(files)
    .values({
      storageKey: `test/${crypto.randomUUID()}`,
      filename: 'test-bestand.png',
      mimeType: 'image/png',
      size: 1024,
      uploadedById,
      ...overrides,
    })
    .returning();
  return file;
}

async function createTempDocument(
  projectId: string,
  fileId: string,
  overrides: Partial<typeof documents.$inferInsert> = {},
) {
  const [document] = await db
    .insert(documents)
    .values({
      projectId,
      fileId,
      title: unique('Test Document'),
      visibleToClient: true,
      ...overrides,
    })
    .returning();
  return document;
}

async function cleanupDocument(documentId: string, fileId: string) {
  await db.delete(documents).where(eq(documents.id, documentId));
  await db.delete(files).where(eq(files.id, fileId));
}

describe('createDocument (admin server action)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { userId, headers, cleanup } = await createTempClientUserSession(client.id);
    const file = await createTempFile(userId, { mimeType: 'application/pdf' });

    try {
      currentHeaders = headers;
      const result = await createDocument({
        projectId: project.id,
        fileId: file.id,
        title: 'Factuur',
        type: 'invoice',
        visibleToClient: true,
      });
      expect(result).toMatchObject({
        success: false,
        formError: 'This action requires an admin account.',
      });
    } finally {
      await db.delete(files).where(eq(files.id, file.id));
      await deleteTempClient(client.id);
      await cleanup();
    }
  });

  it('links an uploaded file to the project and logs the change', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const adminId = await tempAdminId();
    const file = await createTempFile(adminId, { mimeType: 'application/pdf' });

    try {
      currentHeaders = await adminHeaders();
      const result = await createDocument({
        projectId: project.id,
        fileId: file.id,
        title: 'Factuur eerste schijf',
        type: 'invoice',
        visibleToClient: true,
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data).toMatchObject({
        projectId: project.id,
        fileId: file.id,
        title: 'Factuur eerste schijf',
        type: 'invoice',
        visibleToClient: true,
      });

      const [logEntry] = await db
        .select()
        .from(activityLog)
        .where(eq(activityLog.projectId, project.id))
        .limit(1);
      expect(logEntry).toMatchObject({ type: 'document_added' });

      await cleanupDocument(result.data.id, file.id);
    } finally {
      await deleteTempClient(client.id);
    }
  });
});

describe('updateDocumentVisibility (admin server action)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { userId, headers, cleanup } = await createTempClientUserSession(client.id);
    const file = await createTempFile(userId);
    const document = await createTempDocument(project.id, file.id, { visibleToClient: true });

    try {
      currentHeaders = headers;
      const result = await updateDocumentVisibility({
        documentId: document.id,
        visibleToClient: false,
      });
      expect(result).toMatchObject({
        success: false,
        formError: 'This action requires an admin account.',
      });
    } finally {
      await cleanupDocument(document.id, file.id);
      await deleteTempClient(client.id);
      await cleanup();
    }
  });

  it('toggles visibility', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const adminId = await tempAdminId();
    const file = await createTempFile(adminId);
    const document = await createTempDocument(project.id, file.id, { visibleToClient: true });

    try {
      currentHeaders = await adminHeaders();
      const result = await updateDocumentVisibility({
        documentId: document.id,
        visibleToClient: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.visibleToClient).toBe(false);
      }
    } finally {
      await cleanupDocument(document.id, file.id);
      await deleteTempClient(client.id);
    }
  });
});

describe('deleteDocument (admin server action)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { userId, headers, cleanup } = await createTempClientUserSession(client.id);
    const file = await createTempFile(userId);
    const document = await createTempDocument(project.id, file.id);

    try {
      currentHeaders = headers;
      const result = await deleteDocument({ documentId: document.id });
      expect(result).toMatchObject({
        success: false,
        formError: 'This action requires an admin account.',
      });
    } finally {
      await cleanupDocument(document.id, file.id);
      await deleteTempClient(client.id);
      await cleanup();
    }
  });

  it('deletes both the document row and the underlying file', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const adminId = await tempAdminId();
    const file = await createTempFile(adminId);
    const document = await createTempDocument(project.id, file.id);

    try {
      currentHeaders = await adminHeaders();
      const result = await deleteDocument({ documentId: document.id });
      expect(result.success).toBe(true);

      const [remainingDocument] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, document.id))
        .limit(1);
      expect(remainingDocument).toBeUndefined();

      const [remainingFile] = await db.select().from(files).where(eq(files.id, file.id)).limit(1);
      expect(remainingFile).toBeUndefined();
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('rejects a non-existent document id', async () => {
    currentHeaders = await adminHeaders();
    const result = await deleteDocument({ documentId: crypto.randomUUID() });
    expect(result).toMatchObject({ success: false, formError: expect.any(String) });
  });
});
