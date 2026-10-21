import { and, desc, eq } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { documents, files, user } from '@/db/schema';
import {
  AccessError,
  assertProjectAccess,
  isAdmin,
  isVisibleToUser,
  type AuthenticatedUser,
} from '@/lib/access';

export type DocumentWithFile = {
  id: string;
  projectId: string;
  fileId: string;
  title: string;
  type: (typeof documents.$inferSelect)['type'];
  visibleToClient: boolean;
  createdAt: Date;
  filename: string;
  mimeType: string;
  size: number;
  uploadedByName: string | null;
};

/**
 * Newest first. Returns every matching document — the project-detail section
 * needs the full list anyway to show a correct total/shared count, not just
 * the handful of rows it displays, so callers cap the row count themselves.
 */
export async function listDocumentsForProject(
  user_: AuthenticatedUser,
  projectId: string,
  database: Database = db,
): Promise<DocumentWithFile[]> {
  await assertProjectAccess(user_, projectId, database);

  const conditions = isAdmin(user_)
    ? eq(documents.projectId, projectId)
    : and(eq(documents.projectId, projectId), eq(documents.visibleToClient, true));

  return database
    .select({
      id: documents.id,
      projectId: documents.projectId,
      fileId: documents.fileId,
      title: documents.title,
      type: documents.type,
      visibleToClient: documents.visibleToClient,
      createdAt: documents.createdAt,
      filename: files.filename,
      mimeType: files.mimeType,
      size: files.size,
      uploadedByName: user.name,
    })
    .from(documents)
    .innerJoin(files, eq(files.id, documents.fileId))
    .leftJoin(user, eq(user.id, files.uploadedById))
    .where(conditions)
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentById(
  user_: AuthenticatedUser,
  documentId: string,
  database: Database = db,
) {
  const [document] = await database
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!document) {
    throw new AccessError('NOT_FOUND', 'Document not found.');
  }

  await assertProjectAccess(user_, document.projectId, database);

  if (!isVisibleToUser(user_, document)) {
    throw new AccessError('NOT_FOUND', 'Document not found.');
  }

  return document;
}
