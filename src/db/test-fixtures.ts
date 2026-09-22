import { eq, inArray } from 'drizzle-orm';

import { testDb } from '@/db/test-client';
import {
  clients,
  documents,
  events,
  files,
  projects,
  ticketAttachments,
  tickets,
  user,
} from '@/db/schema';

function unique(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export async function createTestClient(overrides: Partial<typeof clients.$inferInsert> = {}) {
  const [client] = await testDb
    .insert(clients)
    .values({
      name: unique('Test Client'),
      email: `${unique('client')}@example.test`,
      ...overrides,
    })
    .returning();

  return client;
}

export async function createTestClientUser(
  clientId: string,
  overrides: Partial<typeof user.$inferInsert> = {},
) {
  const [created] = await testDb
    .insert(user)
    .values({
      name: unique('Test User'),
      email: `${unique('user')}@example.test`,
      role: 'client',
      clientId,
      emailVerified: true,
      ...overrides,
    })
    .returning();

  return created;
}

export async function createTestAdminUser(overrides: Partial<typeof user.$inferInsert> = {}) {
  const [created] = await testDb
    .insert(user)
    .values({
      name: unique('Test Admin'),
      email: `${unique('admin')}@example.test`,
      role: 'admin',
      clientId: null,
      emailVerified: true,
      ...overrides,
    })
    .returning();

  return created;
}

export async function createTestProject(
  clientId: string,
  overrides: Partial<typeof projects.$inferInsert> = {},
) {
  const [created] = await testDb
    .insert(projects)
    .values({
      clientId,
      name: unique('Test Project'),
      status: 'active',
      ...overrides,
    })
    .returning();

  return created;
}

export async function createTestTicket(
  projectId: string,
  reportedById: string,
  overrides: Partial<typeof tickets.$inferInsert> = {},
) {
  const [created] = await testDb
    .insert(tickets)
    .values({
      projectId,
      reportedById,
      title: unique('Test Ticket'),
      status: 'new',
      ...overrides,
    })
    .returning();

  return created;
}

export async function createTestEvent(
  projectId: string,
  overrides: Partial<typeof events.$inferInsert> = {},
) {
  const [created] = await testDb
    .insert(events)
    .values({
      projectId,
      title: unique('Test Event'),
      type: 'other',
      startsAt: new Date(),
      ...overrides,
    })
    .returning();

  return created;
}

export async function createTestFile(
  uploadedById: string,
  overrides: Partial<typeof files.$inferInsert> = {},
) {
  const [created] = await testDb
    .insert(files)
    .values({
      storageKey: unique('test/storage-key'),
      filename: 'test-bestand.png',
      mimeType: 'image/png',
      size: 1024,
      uploadedById,
      ...overrides,
    })
    .returning();

  return created;
}

export async function createTestDocument(
  projectId: string,
  fileId: string,
  overrides: Partial<typeof documents.$inferInsert> = {},
) {
  const [created] = await testDb
    .insert(documents)
    .values({
      projectId,
      fileId,
      title: unique('Test Document'),
      type: 'other',
      visibleToClient: true,
      ...overrides,
    })
    .returning();

  return created;
}

export async function createTestTicketAttachment(ticketId: string, fileId: string) {
  const [created] = await testDb.insert(ticketAttachments).values({ ticketId, fileId }).returning();
  return created;
}

/** files has no FK to project/client, so cleanupTestClient's cascade never reaches it. */
export async function cleanupTestFile(fileId: string) {
  await testDb.delete(files).where(eq(files.id, fileId));
}

/**
 * Deletes a test client (cascades to its projects/tasks/tickets/events/documents)
 * and any standalone user rows created for it. Clients must be removed before
 * their users: `user.clientId` only sets null on client delete, so the users
 * survive that step and can be deleted safely afterwards.
 */
export async function cleanupTestClient(clientId: string, userIds: string[] = []) {
  await testDb.delete(clients).where(eq(clients.id, clientId));

  if (userIds.length > 0) {
    await cleanupTestUsers(userIds);
  }
}

/**
 * Split out from cleanupTestClient for cases that need the client gone (so a
 * files row referencing one of its users' files becomes deletable) before
 * the users themselves — files.uploadedById also restricts deleting a user
 * with files still attributed to them.
 */
export async function cleanupTestUsers(userIds: string[]) {
  await testDb.delete(user).where(inArray(user.id, userIds));
}

export async function cleanupTestAdminUser(userId: string) {
  await testDb.delete(user).where(eq(user.id, userId));
}
