'use server';

import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

import { db } from '@/db';
import { activityLog, documents } from '@/db/schema';
import {
  createDocumentSchema,
  deleteDocumentSchema,
  updateDocumentVisibilitySchema,
} from '@/features/documents/schemas';
import { deleteFile } from '@/features/files/actions';
import { AccessError, assertProjectAccess, requireAdmin } from '@/lib/access';
import { createFormAction } from '@/lib/form-action';

const documentTypeLabels: Record<string, string> = {
  invoice: 'Factuur',
  quote: 'Offerte',
  contract: 'Contract',
  other: 'Andere',
};

async function getDocumentOrNotFound(documentId: string) {
  const [document] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
  if (!document) {
    throw new AccessError('NOT_FOUND', 'Document not found.');
  }
  return document;
}

/**
 * Links an already-uploaded file (see features/files: requestUpload/
 * confirmUpload) to a project as a document. The file itself is created
 * beforehand by the generic upload flow — if this insert fails after a
 * successful upload, the file row is left unattached, same accepted risk as
 * elsewhere in the app (no extra cleanup job for an edge case this rare).
 */
export const createDocument = createFormAction(createDocumentSchema, async (data) => {
  const admin = await requireAdmin(await headers());
  await assertProjectAccess(admin, data.projectId);

  const [document] = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(documents)
      .values({
        projectId: data.projectId,
        fileId: data.fileId,
        title: data.title,
        type: data.type,
        visibleToClient: data.visibleToClient,
      })
      .returning();

    await tx.insert(activityLog).values({
      projectId: data.projectId,
      actorId: admin.id,
      type: 'document_added',
      description: `Document "${data.title}" geüpload (${documentTypeLabels[data.type]})`,
    });

    return inserted;
  });

  return document;
});

export const updateDocumentVisibility = createFormAction(
  updateDocumentVisibilitySchema,
  async (data) => {
    const admin = await requireAdmin(await headers());
    const document = await getDocumentOrNotFound(data.documentId);
    await assertProjectAccess(admin, document.projectId);

    const [updated] = await db
      .update(documents)
      .set({ visibleToClient: data.visibleToClient })
      .where(eq(documents.id, data.documentId))
      .returning();

    return updated;
  },
);

/**
 * Deletes the document row first, then the underlying file/storage object:
 * documents.fileId -> files restricts deleting a file that's still linked,
 * so the link has to go before deleteFile can succeed.
 */
export const deleteDocument = createFormAction(deleteDocumentSchema, async (data) => {
  const admin = await requireAdmin(await headers());
  const document = await getDocumentOrNotFound(data.documentId);
  await assertProjectAccess(admin, document.projectId);

  await db.delete(documents).where(eq(documents.id, data.documentId));
  await deleteFile(document.fileId);

  return { id: data.documentId };
});
