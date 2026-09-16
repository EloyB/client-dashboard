import { and, eq } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { documents } from '@/db/schema';
import {
  AccessError,
  assertProjectAccess,
  isAdmin,
  isVisibleToUser,
  type AuthenticatedUser,
} from '@/lib/access';

export async function listDocumentsForProject(
  user: AuthenticatedUser,
  projectId: string,
  database: Database = db,
) {
  await assertProjectAccess(user, projectId, database);

  const conditions = isAdmin(user)
    ? eq(documents.projectId, projectId)
    : and(eq(documents.projectId, projectId), eq(documents.visibleToClient, true));

  return database.select().from(documents).where(conditions).orderBy(documents.createdAt);
}

export async function getDocumentById(
  user: AuthenticatedUser,
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

  await assertProjectAccess(user, document.projectId, database);

  if (!isVisibleToUser(user, document)) {
    throw new AccessError('NOT_FOUND', 'Document not found.');
  }

  return document;
}
