import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  cleanupTestAdminUser,
  cleanupTestClient,
  createTestAdminUser,
  createTestClient,
  createTestClientUser,
  createTestProject,
} from '@/db/test-fixtures';
import { testDb } from '@/db/test-client';
import { documents, files } from '@/db/schema';
import { listDocumentsForClient } from '@/features/documents/queries.portal';
import type { AuthenticatedUser } from '@/lib/access';

describe('listDocumentsForClient', () => {
  let clientA: Awaited<ReturnType<typeof createTestClient>>;
  let clientB: Awaited<ReturnType<typeof createTestClient>>;
  let projectA: Awaited<ReturnType<typeof createTestProject>>;
  let projectB: Awaited<ReturnType<typeof createTestProject>>;
  let userA1: Awaited<ReturnType<typeof createTestClientUser>>;
  let userB1: Awaited<ReturnType<typeof createTestClientUser>>;
  let uploader: Awaited<ReturnType<typeof createTestAdminUser>>;
  let visibleDocument: typeof documents.$inferSelect;
  let internalDocument: typeof documents.$inferSelect;
  let documentB: typeof documents.$inferSelect;

  beforeEach(async () => {
    clientA = await createTestClient();
    clientB = await createTestClient();
    projectA = await createTestProject(clientA.id);
    projectB = await createTestProject(clientB.id);
    userA1 = await createTestClientUser(clientA.id);
    userB1 = await createTestClientUser(clientB.id);
    uploader = await createTestAdminUser();

    const [file] = await testDb
      .insert(files)
      .values({
        storageKey: `test/${crypto.randomUUID()}.pdf`,
        filename: 'offerte.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        uploadedById: uploader.id,
      })
      .returning();

    [visibleDocument] = await testDb
      .insert(documents)
      .values({
        projectId: projectA.id,
        fileId: file.id,
        title: 'Offerte.pdf',
        type: 'quote',
        visibleToClient: true,
      })
      .returning();

    [internalDocument] = await testDb
      .insert(documents)
      .values({
        projectId: projectA.id,
        fileId: file.id,
        title: 'Interne notities.pdf',
        visibleToClient: false,
      })
      .returning();

    [documentB] = await testDb
      .insert(documents)
      .values({
        projectId: projectB.id,
        fileId: file.id,
        title: 'Voorstel.pdf',
        visibleToClient: true,
      })
      .returning();
  });

  afterEach(async () => {
    await cleanupTestClient(clientA.id, [userA1.id]);
    await cleanupTestClient(clientB.id, [userB1.id]);
    await testDb.delete(files).where(eq(files.uploadedById, uploader.id));
    await cleanupTestAdminUser(uploader.id);
  });

  it('returns only visible documents from the user’s own client', async () => {
    const asUserA1: AuthenticatedUser & { clientId: string } = {
      id: userA1.id,
      role: 'client',
      clientId: clientA.id,
    };

    const result = await listDocumentsForClient(asUserA1, testDb);
    const ids = result.map((document) => document.id);

    expect(ids).toEqual([visibleDocument.id]);
    expect(ids).not.toContain(internalDocument.id);
  });

  it('never includes another client’s documents', async () => {
    const asUserA1: AuthenticatedUser & { clientId: string } = {
      id: userA1.id,
      role: 'client',
      clientId: clientA.id,
    };

    const result = await listDocumentsForClient(asUserA1, testDb);

    expect(result.map((document) => document.id)).not.toContain(documentB.id);
  });

  it('includes project and file metadata for grouping and display', async () => {
    const asUserA1: AuthenticatedUser & { clientId: string } = {
      id: userA1.id,
      role: 'client',
      clientId: clientA.id,
    };

    const [row] = await listDocumentsForClient(asUserA1, testDb);

    expect(row).toMatchObject({
      projectId: projectA.id,
      projectName: projectA.name,
      fileId: visibleDocument.fileId,
      filename: 'offerte.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      type: 'quote',
    });
  });
});
