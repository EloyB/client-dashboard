import { eq } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { documents, files, projects, ticketAttachments, tickets, type UserRole } from '@/db/schema';
import { auth } from '@/lib/auth';

export type AuthenticatedUser = {
  id: string;
  role: UserRole;
  clientId: string | null;
};

export type Project = typeof projects.$inferSelect;

export class AccessError extends Error {
  code: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND';

  constructor(code: AccessError['code'], message: string) {
    super(message);
    this.name = 'AccessError';
    this.code = code;
  }
}

// Pure authorization logic — no session, no database, so these are directly
// unit-testable and reusable both server-side and in future UI-level checks.

export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === 'admin';
}

export function belongsToClient(user: AuthenticatedUser, clientId: string): boolean {
  return isAdmin(user) || user.clientId === clientId;
}

export function isVisibleToUser(
  user: AuthenticatedUser,
  resource: { visibleToClient: boolean },
): boolean {
  return isAdmin(user) || resource.visibleToClient;
}

// Session-resolving helpers. `requestHeaders` comes from `next/headers` in
// server actions/queries; tests pass a plain `Headers` instead.

export async function getCurrentUser(requestHeaders: Headers): Promise<AuthenticatedUser | null> {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return null;
  }

  // role/clientId are validated at the database level (enum + FK); Better
  // Auth only types additional fields as their raw JS type.
  const { role, clientId } = session.user as unknown as { role: UserRole; clientId: string | null };

  return { id: session.user.id, role, clientId };
}

export async function requireAdmin(requestHeaders: Headers): Promise<AuthenticatedUser> {
  const user = await getCurrentUser(requestHeaders);
  if (!user) {
    throw new AccessError('UNAUTHENTICATED', 'You must be signed in.');
  }
  if (!isAdmin(user)) {
    throw new AccessError('FORBIDDEN', 'This action requires an admin account.');
  }
  return user;
}

export async function requireClientUser(
  requestHeaders: Headers,
): Promise<AuthenticatedUser & { clientId: string }> {
  const user = await getCurrentUser(requestHeaders);
  if (!user) {
    throw new AccessError('UNAUTHENTICATED', 'You must be signed in.');
  }
  if (user.role !== 'client' || !user.clientId) {
    throw new AccessError('FORBIDDEN', 'This action requires a client account.');
  }
  return { ...user, clientId: user.clientId };
}

/**
 * Fetches a project and verifies the user may access it. A client requesting
 * a project that doesn't exist or belongs to another client gets the same
 * NOT_FOUND error either way, so existing IDs are never confirmed.
 */
export async function assertProjectAccess(
  user: AuthenticatedUser,
  projectId: string,
  database: Database = db,
): Promise<Project> {
  const [project] = await database
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project || !belongsToClient(user, project.clientId)) {
    throw new AccessError('NOT_FOUND', 'Project not found.');
  }

  return project;
}

export type StoredFile = typeof files.$inferSelect;

/**
 * A file is reachable through exactly one of two paths — a document or a
 * ticket attachment — each scoped to a project/client the same way any other
 * project-related data is. A file that isn't attached to either yet (the
 * moment right after confirming an upload, before it's linked to anything)
 * is admin-only: the uploading client can preview their own pending upload
 * client-side (a local object URL) without needing to re-fetch it here.
 */
export async function assertFileAccess(
  user: AuthenticatedUser,
  fileId: string,
  database: Database = db,
): Promise<StoredFile> {
  const [file] = await database.select().from(files).where(eq(files.id, fileId)).limit(1);
  if (!file) {
    throw new AccessError('NOT_FOUND', 'File not found.');
  }
  if (isAdmin(user)) {
    return file;
  }

  const [documentAccess] = await database
    .select({ clientId: projects.clientId, visibleToClient: documents.visibleToClient })
    .from(documents)
    .innerJoin(projects, eq(projects.id, documents.projectId))
    .where(eq(documents.fileId, fileId))
    .limit(1);

  if (documentAccess) {
    if (belongsToClient(user, documentAccess.clientId) && isVisibleToUser(user, documentAccess)) {
      return file;
    }
    throw new AccessError('NOT_FOUND', 'File not found.');
  }

  const [ticketAccess] = await database
    .select({ clientId: projects.clientId })
    .from(ticketAttachments)
    .innerJoin(tickets, eq(tickets.id, ticketAttachments.ticketId))
    .innerJoin(projects, eq(projects.id, tickets.projectId))
    .where(eq(ticketAttachments.fileId, fileId))
    .limit(1);

  if (ticketAccess && belongsToClient(user, ticketAccess.clientId)) {
    return file;
  }

  throw new AccessError('NOT_FOUND', 'File not found.');
}
