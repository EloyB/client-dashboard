import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

// Every action reads the session via next/headers' headers(), which throws
// outside a real request. Mocking it lets these tests drive the real
// UNAUTHENTICATED/FORBIDDEN/NOT_FOUND behaviour through the real actions.
let currentHeaders = new Headers();
vi.mock('next/headers', () => ({
  headers: async () => currentHeaders,
}));

const { db } = await import('@/db');
const { clients, files } = await import('@/db/schema');
const {
  adminHeaders,
  createTempClient,
  createTempClientUserSession,
  createTempProject,
  uploadRealObject,
} = await import('@/db/test-real-session');
const { confirmUpload, deleteFile, getFileDownloadUrl, requestUpload } =
  await import('@/features/files/actions');
const { deleteObject } = await import('@/lib/storage');

async function deleteTempClient(clientId: string) {
  await db.delete(clients).where(eq(clients.id, clientId));
}

describe('requestUpload (server action)', () => {
  it('rejects an unauthenticated request', async () => {
    currentHeaders = new Headers();
    const client = await createTempClient();
    const project = await createTempProject(client.id);

    try {
      const result = await requestUpload({
        projectId: project.id,
        context: 'ticket_attachment',
        filename: 'screenshot.png',
        mimeType: 'image/png',
        size: 1024,
      });
      expect(result).toMatchObject({ success: false, formError: 'You must be signed in.' });
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('rejects a client user requesting an upload for another client’s project', async () => {
    const owner = await createTempClient();
    const ownerProject = await createTempProject(owner.id);
    const outsider = await createTempClient();
    const { headers, cleanup } = await createTempClientUserSession(outsider.id);

    try {
      currentHeaders = headers;
      const result = await requestUpload({
        projectId: ownerProject.id,
        context: 'ticket_attachment',
        filename: 'screenshot.png',
        mimeType: 'image/png',
        size: 1024,
      });
      expect(result).toMatchObject({ success: false, formError: 'Project not found.' });
    } finally {
      await cleanup();
      await deleteTempClient(owner.id);
      await deleteTempClient(outsider.id);
    }
  });

  it('rejects a disallowed mime type for the given context', async () => {
    currentHeaders = await adminHeaders();
    const client = await createTempClient();
    const project = await createTempProject(client.id);

    try {
      const result = await requestUpload({
        projectId: project.id,
        context: 'ticket_attachment',
        filename: 'malware.exe',
        mimeType: 'application/x-msdownload',
        size: 1024,
      });
      expect(result).toMatchObject({
        success: false,
        fieldErrors: { mimeType: [expect.any(String)] },
      });
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('rejects a file over the context’s size limit', async () => {
    currentHeaders = await adminHeaders();
    const client = await createTempClient();
    const project = await createTempProject(client.id);

    try {
      const result = await requestUpload({
        projectId: project.id,
        context: 'ticket_attachment',
        filename: 'huge.png',
        mimeType: 'image/png',
        size: 11 * 1024 * 1024,
      });
      expect(result).toMatchObject({
        success: false,
        fieldErrors: { size: [expect.any(String)] },
      });
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('returns a storage key scoped to the project and context, plus an upload URL', async () => {
    currentHeaders = await adminHeaders();
    const client = await createTempClient();
    const project = await createTempProject(client.id);

    try {
      const result = await requestUpload({
        projectId: project.id,
        context: 'ticket_attachment',
        filename: 'screenshot.png',
        mimeType: 'image/png',
        size: 1024,
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.storageKey.startsWith(`projects/${project.id}/tickets/`)).toBe(true);
      expect(result.data.uploadUrl).toContain(result.data.storageKey);
    } finally {
      await deleteTempClient(client.id);
    }
  });
});

describe('confirmUpload (server action)', () => {
  it('fails when nothing was actually uploaded to the returned storage key', async () => {
    currentHeaders = await adminHeaders();
    const client = await createTempClient();
    const project = await createTempProject(client.id);

    try {
      const requested = await requestUpload({
        projectId: project.id,
        context: 'ticket_attachment',
        filename: 'screenshot.png',
        mimeType: 'image/png',
        size: 1024,
      });
      if (!requested.success) throw new Error('setup failed');

      const result = await confirmUpload({
        projectId: project.id,
        context: 'ticket_attachment',
        storageKey: requested.data.storageKey,
        filename: 'screenshot.png',
      });
      expect(result).toMatchObject({ success: false, formError: expect.any(String) });
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('rejects confirmation when the real uploaded object is too big, even if requestUpload was told a valid size', async () => {
    currentHeaders = await adminHeaders();
    const client = await createTempClient();
    const project = await createTempProject(client.id);

    const requested = await requestUpload({
      projectId: project.id,
      context: 'ticket_attachment',
      filename: 'screenshot.png',
      mimeType: 'image/png',
      size: 1024, // the browser's honest-sounding claim
    });
    if (!requested.success) throw new Error('setup failed');

    try {
      // The browser then uploads something much bigger than it claimed.
      await uploadRealObject(requested.data.uploadUrl, new Uint8Array(11 * 1024 * 1024));

      const result = await confirmUpload({
        projectId: project.id,
        context: 'ticket_attachment',
        storageKey: requested.data.storageKey,
        filename: 'screenshot.png',
      });
      expect(result).toMatchObject({
        success: false,
        formError: expect.stringContaining('groot'),
      });
    } finally {
      // confirmUpload rejected, so no files row exists to track this object —
      // it would otherwise be an orphan the cleanup script can never find.
      await deleteObject(requested.data.storageKey);
      await deleteTempClient(client.id);
    }
  });

  it('confirms a real upload and creates the files record with the real size/type', async () => {
    currentHeaders = await adminHeaders();
    const client = await createTempClient();
    const project = await createTempProject(client.id);

    try {
      const requested = await requestUpload({
        projectId: project.id,
        context: 'ticket_attachment',
        filename: 'screenshot.png',
        mimeType: 'image/png',
        size: 1024,
      });
      if (!requested.success) throw new Error('setup failed');
      await uploadRealObject(requested.data.uploadUrl, new Uint8Array(2048));

      const confirmed = await confirmUpload({
        projectId: project.id,
        context: 'ticket_attachment',
        storageKey: requested.data.storageKey,
        filename: 'screenshot.png',
      });
      expect(confirmed.success).toBe(true);
      if (!confirmed.success) return;

      const [file] = await db
        .select()
        .from(files)
        .where(eq(files.id, confirmed.data.fileId))
        .limit(1);
      expect(file).toMatchObject({
        filename: 'screenshot.png',
        storageKey: requested.data.storageKey,
        size: 2048,
      });
      await db.delete(files).where(eq(files.id, confirmed.data.fileId));
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('lets a client user confirm an upload for their own project', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { headers, cleanup } = await createTempClientUserSession(client.id);

    try {
      currentHeaders = headers;
      const requested = await requestUpload({
        projectId: project.id,
        context: 'ticket_attachment',
        filename: 'screenshot.png',
        mimeType: 'image/png',
        size: 1024,
      });
      if (!requested.success) throw new Error('setup failed');
      await uploadRealObject(requested.data.uploadUrl, new Uint8Array(512));

      const confirmed = await confirmUpload({
        projectId: project.id,
        context: 'ticket_attachment',
        storageKey: requested.data.storageKey,
        filename: 'screenshot.png',
      });
      expect(confirmed.success).toBe(true);
      if (confirmed.success) {
        await db.delete(files).where(eq(files.id, confirmed.data.fileId));
      }
    } finally {
      await cleanup();
      await deleteTempClient(client.id);
    }
  });
});

describe('getFileDownloadUrl and deleteFile (server actions)', () => {
  async function confirmedFile(projectId: string) {
    currentHeaders = await adminHeaders();
    const requested = await requestUpload({
      projectId,
      context: 'ticket_attachment',
      filename: 'screenshot.png',
      mimeType: 'image/png',
      size: 1024,
    });
    if (!requested.success) throw new Error('setup failed');
    await uploadRealObject(requested.data.uploadUrl, new Uint8Array(1024));
    const confirmed = await confirmUpload({
      projectId,
      context: 'ticket_attachment',
      storageKey: requested.data.storageKey,
      filename: 'screenshot.png',
    });
    if (!confirmed.success) throw new Error('setup failed');
    return confirmed.data.fileId;
  }

  it('gives an admin a working download URL', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const fileId = await confirmedFile(project.id);

    try {
      currentHeaders = await adminHeaders();
      const url = await getFileDownloadUrl(fileId);
      const response = await fetch(url);
      expect(response.status).toBe(200);
    } finally {
      await db.delete(files).where(eq(files.id, fileId));
      await deleteTempClient(client.id);
    }
  });

  it('rejects a client user downloading a file with no document/ticket attached yet', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const fileId = await confirmedFile(project.id);
    const { headers, cleanup } = await createTempClientUserSession(client.id);

    try {
      currentHeaders = headers;
      await expect(getFileDownloadUrl(fileId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    } finally {
      await cleanup();
      await db.delete(files).where(eq(files.id, fileId));
      await deleteTempClient(client.id);
    }
  });

  it('deletes the object and the record together', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const fileId = await confirmedFile(project.id);

    try {
      currentHeaders = await adminHeaders();
      const urlBeforeDelete = await getFileDownloadUrl(fileId);
      await deleteFile(fileId);

      const [row] = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
      expect(row).toBeUndefined();

      const responseAfterDelete = await fetch(urlBeforeDelete);
      expect(responseAfterDelete.status).toBe(404);
    } finally {
      await deleteTempClient(client.id);
    }
  });
});
