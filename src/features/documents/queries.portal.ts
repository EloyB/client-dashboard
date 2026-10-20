import { and, desc, eq } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { documents, files, projects, type DocumentType } from '@/db/schema';
import type { AuthenticatedUser } from '@/lib/access';

export type PortalDocumentRow = {
  id: string;
  title: string;
  type: DocumentType;
  projectId: string;
  projectName: string;
  fileId: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: Date;
};

/**
 * Every document shared with the client's own projects — never another
 * client's documents, and never one with visibleToClient: false. Kept fully
 * separate from the admin-side features/documents/queries.ts (no shared
 * query with a role flag), per the rule agreed in slice 5d.
 */
export async function listDocumentsForClient(
  user: AuthenticatedUser & { clientId: string },
  database: Database = db,
): Promise<PortalDocumentRow[]> {
  return database
    .select({
      id: documents.id,
      title: documents.title,
      type: documents.type,
      projectId: documents.projectId,
      projectName: projects.name,
      fileId: documents.fileId,
      filename: files.filename,
      mimeType: files.mimeType,
      size: files.size,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .innerJoin(projects, eq(projects.id, documents.projectId))
    .innerJoin(files, eq(files.id, documents.fileId))
    .where(and(eq(projects.clientId, user.clientId), eq(documents.visibleToClient, true)))
    .orderBy(desc(documents.createdAt));
}
