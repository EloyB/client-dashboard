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
import { getDocumentById, listDocumentsForProject } from '@/features/documents/queries';
import type { AuthenticatedUser } from '@/lib/access';

describe('documents queries', () => {
  const admin: AuthenticatedUser = { id: 'admin-fixture', role: 'admin', clientId: null };

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
    // files.uploadedById has onDelete restrict, so the documents referencing
    // this file (removed via the client cascades above) must be gone first.
    await testDb.delete(files).where(eq(files.uploadedById, uploader.id));
    await cleanupTestAdminUser(uploader.id);
  });

  it('lets an admin see internal and client-visible documents', async () => {
    const result = await listDocumentsForProject(admin, projectA.id, testDb);

    expect(result.map((document) => document.id).sort()).toEqual(
      [visibleDocument.id, internalDocument.id].sort(),
    );
  });

  it('hides documents with visibleToClient = false from a client user', async () => {
    const asUserA1: AuthenticatedUser = { id: userA1.id, role: 'client', clientId: clientA.id };

    const result = await listDocumentsForProject(asUserA1, projectA.id, testDb);

    expect(result.map((document) => document.id)).toEqual([visibleDocument.id]);

    await expect(getDocumentById(asUserA1, internalDocument.id, testDb)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('never returns another client’s documents, even by a known ID', async () => {
    const asUserA1: AuthenticatedUser = { id: userA1.id, role: 'client', clientId: clientA.id };

    await expect(listDocumentsForProject(asUserA1, projectB.id, testDb)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });

    await expect(getDocumentById(asUserA1, documentB.id, testDb)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
