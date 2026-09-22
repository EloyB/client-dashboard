'use server';

import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

import { db } from '@/db';
import { files } from '@/db/schema';
import { confirmUploadSchema, requestUploadSchema, uploadLimits } from '@/features/files/schemas';
import { AccessError, assertFileAccess, assertProjectAccess, getCurrentUser } from '@/lib/access';
import { createFormAction } from '@/lib/form-action';
import {
  buildStorageKey,
  deleteObject,
  getDownloadUrl,
  getUploadUrl,
  headObject,
} from '@/lib/storage';

const folderByContext = { ticket_attachment: 'tickets', document: 'documents' } as const;

async function requireAuthenticatedUser(requestHeaders: Headers) {
  const user = await getCurrentUser(requestHeaders);
  if (!user) {
    throw new AccessError('UNAUTHENTICATED', 'You must be signed in.');
  }
  return user;
}

export const requestUpload = createFormAction(requestUploadSchema, async (data) => {
  const user = await requireAuthenticatedUser(await headers());
  await assertProjectAccess(user, data.projectId);

  const storageKey = buildStorageKey(data.projectId, folderByContext[data.context]);
  const uploadUrl = await getUploadUrl(storageKey);

  return { storageKey, uploadUrl };
});

/** Verifies the real, stored object — never the browser's claimed size/type — before creating the record. */
export const confirmUpload = createFormAction(confirmUploadSchema, async (data) => {
  const user = await requireAuthenticatedUser(await headers());
  await assertProjectAccess(user, data.projectId);

  const expectedPrefix = `projects/${data.projectId}/${folderByContext[data.context]}/`;
  if (!data.storageKey.startsWith(expectedPrefix)) {
    throw new Error('Ongeldige upload.');
  }

  const stored = await headObject(data.storageKey);
  if (!stored) {
    throw new Error('Upload niet gevonden. Probeer opnieuw.');
  }

  const limits = uploadLimits[data.context];
  if (!limits.mimeTypes.includes(stored.contentType)) {
    throw new Error('Dit bestandstype is niet toegelaten.');
  }
  if (stored.size > limits.maxSizeBytes) {
    throw new Error(`Bestand is te groot (max. ${limits.maxSizeBytes / (1024 * 1024)} MB).`);
  }

  const [file] = await db
    .insert(files)
    .values({
      storageKey: data.storageKey,
      filename: data.filename,
      mimeType: stored.contentType,
      size: stored.size,
      uploadedById: user.id,
    })
    .returning();

  return { fileId: file.id };
});

export async function getFileDownloadUrl(fileId: string): Promise<string> {
  const user = await requireAuthenticatedUser(await headers());
  const file = await assertFileAccess(user, fileId);
  return getDownloadUrl(file.storageKey, { filename: file.filename, mimeType: file.mimeType });
}

/**
 * Only ever succeeds for a file with no document/ticket attached yet: those
 * reference files.id with onDelete: 'restrict', so the database itself
 * refuses to delete an attached one. Detaching is 5a/6a's own concern.
 *
 * Deletes the database row before the storage object — if the FK restricts
 * the delete, nothing has touched storage yet; deleting the object first
 * would risk a row left pointing at nothing if the FK check failed after.
 */
export async function deleteFile(fileId: string): Promise<void> {
  const user = await requireAuthenticatedUser(await headers());
  const file = await assertFileAccess(user, fileId);

  await db.delete(files).where(eq(files.id, fileId));
  await deleteObject(file.storageKey);
}
