import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/db';
import { account, clients as clientsTable, tickets, user as userTable } from '@/db/schema';
import { testDb } from '@/db/test-client';
import {
  cleanupTestClient,
  createTestClient,
  createTestClientUser,
  createTestProject,
} from '@/db/test-fixtures';
import { getClientById, listClients } from '@/features/clients/queries';
import { auth } from '@/lib/auth';

const ADMIN_EMAIL = 'eloy@studioswyft.be';
const ADMIN_PASSWORD = 'AdminWachtwoord123!';

async function sessionHeadersFor(email: string, password: string): Promise<Headers> {
  const response = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
  const [cookiePair] = (response.headers.get('set-cookie') ?? '').split(';');
  return new Headers({ cookie: cookiePair });
}

function adminHeaders(): Promise<Headers> {
  return sessionHeadersFor(ADMIN_EMAIL, ADMIN_PASSWORD);
}

function unique(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}@example.test`;
}

/**
 * A client-role session, backed by the real db (the same one `auth` is bound
 * to) rather than testDb — mirrors src/features/clients/actions.test.ts,
 * since resolving a session always goes through the real database regardless
 * of which `database` a query is later given for its own data.
 */
async function createTempClientSession(): Promise<{
  headers: Headers;
  cleanup: () => Promise<void>;
}> {
  const client = await db
    .insert(clientsTable)
    .values({ name: unique('Temp Client'), email: unique('temp-client') })
    .returning()
    .then(([row]) => row);
  const password = 'ClientPassword123!';
  const clientUser = await db
    .insert(userTable)
    .values({
      name: 'Temp Client User',
      email: unique('temp-client-user'),
      role: 'client',
      clientId: client.id,
      emailVerified: true,
    })
    .returning()
    .then(([row]) => row);
  await db.insert(account).values({
    accountId: clientUser.id,
    providerId: 'credential',
    userId: clientUser.id,
    password: await hashPassword(password),
  });

  const headers = await sessionHeadersFor(clientUser.email, password);
  const cleanup = async () => {
    await db.delete(clientsTable).where(eq(clientsTable.id, client.id));
    await db.delete(userTable).where(eq(userTable.id, clientUser.id));
  };

  return { headers, cleanup };
}

describe('listClients', () => {
  it('rejects a non-admin', async () => {
    const { headers, cleanup } = await createTempClientSession();
    try {
      await expect(listClients(headers, testDb)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    } finally {
      await cleanup();
    }
  });

  it('computes active-project and open-ticket counts in one query, per client', async () => {
    const client = await createTestClient();
    const clientUser = await createTestClientUser(client.id);
    const activeProject = await createTestProject(client.id, { status: 'active' });
    const completedProject = await createTestProject(client.id, { status: 'completed' });

    await testDb.insert(tickets).values([
      { projectId: activeProject.id, reportedById: clientUser.id, title: 'Open 1', status: 'new' },
      {
        projectId: activeProject.id,
        reportedById: clientUser.id,
        title: 'Open 2',
        status: 'in_progress',
      },
      {
        projectId: activeProject.id,
        reportedById: clientUser.id,
        title: 'Resolved',
        status: 'resolved',
      },
      {
        projectId: completedProject.id,
        reportedById: clientUser.id,
        title: 'Closed',
        status: 'closed',
      },
    ]);

    try {
      const rows = await listClients(await adminHeaders(), testDb);
      const row = rows.find((candidate) => candidate.id === client.id);
      expect(row).toMatchObject({ activeProjectCount: 1, openTicketCount: 2 });
    } finally {
      await cleanupTestClient(client.id, [clientUser.id]);
    }
  });

  it('reports zero for a client with no projects or tickets', async () => {
    const client = await createTestClient();

    try {
      const rows = await listClients(await adminHeaders(), testDb);
      const row = rows.find((candidate) => candidate.id === client.id);
      expect(row).toMatchObject({ activeProjectCount: 0, openTicketCount: 0 });
    } finally {
      await cleanupTestClient(client.id);
    }
  });
});

describe('getClientById', () => {
  it('rejects a non-admin', async () => {
    const client = await createTestClient();
    const { headers, cleanup } = await createTempClientSession();
    try {
      await expect(getClientById(headers, client.id, testDb)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    } finally {
      await cleanup();
      await cleanupTestClient(client.id);
    }
  });

  it('returns the client with its projects and users', async () => {
    const client = await createTestClient({ notes: 'Interne notitie' });
    const clientUser = await createTestClientUser(client.id);
    const project = await createTestProject(client.id, { status: 'active' });

    try {
      const detail = await getClientById(await adminHeaders(), client.id, testDb);
      expect(detail.client).toMatchObject({ id: client.id, notes: 'Interne notitie' });
      expect(detail.projects).toMatchObject([{ id: project.id, status: 'active' }]);
      expect(detail.users).toMatchObject([{ id: clientUser.id, emailVerified: true }]);
    } finally {
      await cleanupTestClient(client.id, [clientUser.id]);
    }
  });

  it('throws NOT_FOUND for a non-existent id', async () => {
    await expect(
      getClientById(await adminHeaders(), crypto.randomUUID(), testDb),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws NOT_FOUND for a malformed id instead of a raw database error', async () => {
    await expect(getClientById(await adminHeaders(), 'not-a-uuid', testDb)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
