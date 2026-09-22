import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { testDb } from '@/db/test-client';
import {
  cleanupTestAdminUser,
  cleanupTestClient,
  cleanupTestFile,
  createTestAdminUser,
  createTestClient,
  createTestDocument,
  createTestFile,
  createTestProject,
} from '@/db/test-fixtures';
import { cleanupOrphanFiles } from '@/db/cleanup-orphan-files';
import { files } from '@/db/schema';
import { buildStorageKey, getUploadUrl, headObject } from '@/lib/storage';

async function createRealObject(uploaderId: string, createdAt: Date) {
  const storageKey = buildStorageKey(crypto.randomUUID(), 'tickets');
  const uploadUrl = await getUploadUrl(storageKey);
  const response = await fetch(uploadUrl, { method: 'PUT', body: new Uint8Array(16) });
  if (!response.ok) {
    throw new Error(`Test setup: PUT to presigned URL failed with ${response.status}`);
  }

  const file = await createTestFile(uploaderId, { storageKey, createdAt });
  return file;
}

describe('cleanupOrphanFiles', () => {
  it('removes only orphaned files older than the given age, leaving recent or attached ones', async () => {
    const admin = await createTestAdminUser();
    const client = await createTestClient();
    const project = await createTestProject(client.id);

    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const oldOrphan = await createRealObject(admin.id, twoDaysAgo);
    const recentOrphan = await createRealObject(admin.id, new Date());
    const oldAttached = await createRealObject(admin.id, twoDaysAgo);
    await createTestDocument(project.id, oldAttached.id);

    try {
      const cleaned = await cleanupOrphanFiles(24, testDb);

      expect(cleaned.map((file) => file.id)).toEqual([oldOrphan.id]);

      const [oldOrphanRow] = await testDb
        .select()
        .from(files)
        .where(eq(files.id, oldOrphan.id))
        .limit(1);
      expect(oldOrphanRow).toBeUndefined();
      expect(await headObject(oldOrphan.storageKey)).toBeNull();

      const [recentOrphanRow] = await testDb
        .select()
        .from(files)
        .where(eq(files.id, recentOrphan.id))
        .limit(1);
      expect(recentOrphanRow).toBeDefined();
      expect(await headObject(recentOrphan.storageKey)).not.toBeNull();

      const [oldAttachedRow] = await testDb
        .select()
        .from(files)
        .where(eq(files.id, oldAttached.id))
        .limit(1);
      expect(oldAttachedRow).toBeDefined();
      expect(await headObject(oldAttached.storageKey)).not.toBeNull();
    } finally {
      await cleanupTestClient(client.id);
      await cleanupTestFile(recentOrphan.id);
      await cleanupTestFile(oldAttached.id);
      await cleanupTestAdminUser(admin.id);
    }
  });

  it('does nothing when there are no orphans older than the given age', async () => {
    const cleaned = await cleanupOrphanFiles(24, testDb);
    expect(cleaned).toEqual([]);
  });
});
