import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

// Every action reads the session via next/headers' headers(), which throws
// outside a real request. Mocking it lets these tests drive requireAdmin's
// actual FORBIDDEN/UNAUTHENTICATED behaviour through the real actions
// instead of only through their underlying helpers.
let currentHeaders = new Headers();
vi.mock('next/headers', () => ({
  headers: async () => currentHeaders,
}));

// revalidatePath needs a real Next.js request/render context, which a
// plain vitest run doesn't have — the actions call it for real, so it's
// mocked here rather than removed.
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const { db } = await import('@/db');
const { account, clients, session, user: userTable } = await import('@/db/schema');
const { auth } = await import('@/lib/auth');
const { adminHeaders, createTempClientSession, unique } = await import('@/db/test-real-session');
const { createClient, inviteClientUser, resendInvitation, revokeClientUserAccess, updateClient } =
  await import('@/features/clients/actions');

async function createTempClient(overrides: Partial<typeof clients.$inferInsert> = {}) {
  const [client] = await db
    .insert(clients)
    .values({ name: unique('Temp Client'), email: unique('temp-client'), ...overrides })
    .returning();
  return client;
}

async function createTempClientUser(
  clientId: string,
  overrides: Partial<typeof userTable.$inferInsert> = {},
) {
  const [clientUser] = await db
    .insert(userTable)
    .values({
      name: 'Temp Client User',
      email: unique('temp-client-user'),
      role: 'client',
      clientId,
      emailVerified: true,
      ...overrides,
    })
    .returning();
  return clientUser;
}

describe('inviteClientUser (server action, admin gate)', () => {
  it('rejects a request with no session', async () => {
    currentHeaders = new Headers();

    const result = await inviteClientUser({
      name: 'Iemand',
      email: unique('invitee'),
      clientId: crypto.randomUUID(),
    });

    expect(result).toMatchObject({ success: false, formError: 'You must be signed in.' });
  });

  it('rejects a signed-in client user', async () => {
    const client = await createTempClient();
    const { headers, cleanup } = await createTempClientSession();

    try {
      currentHeaders = headers;

      const result = await inviteClientUser({
        name: 'Iemand',
        email: unique('invitee'),
        clientId: client.id,
      });

      expect(result).toMatchObject({
        success: false,
        formError: 'This action requires an admin account.',
      });
    } finally {
      await cleanup();
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });
});

describe('createClient (server action)', () => {
  it('rejects a non-admin', async () => {
    const { headers, cleanup } = await createTempClientSession();
    try {
      currentHeaders = headers;
      const result = await createClient({
        name: 'Nieuwe Klant',
        email: unique('nieuwe-klant'),
        vatNumber: '',
        phone: '',
        address: '',
        notes: '',
      });
      expect(result).toMatchObject({
        success: false,
        formError: 'This action requires an admin account.',
      });
    } finally {
      await cleanup();
    }
  });

  it('creates a client with valid input', async () => {
    currentHeaders = await adminHeaders();
    const email = unique('nieuwe-klant');

    const result = await createClient({
      name: 'Nieuwe Klant',
      email,
      vatNumber: 'BE 0999.999.999',
      phone: '050 12 34 56',
      address: 'Teststraat 1, 9000 Gent',
      notes: 'Een notitie',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    try {
      const [created] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, result.data.clientId))
        .limit(1);
      expect(created).toMatchObject({ name: 'Nieuwe Klant', email, vatNumber: 'BE 0999.999.999' });
    } finally {
      await db.delete(clients).where(eq(clients.id, result.data.clientId));
    }
  });

  it('rejects invalid input (missing name, invalid email)', async () => {
    currentHeaders = await adminHeaders();

    const result = await createClient({
      name: '',
      email: 'not-an-email',
      vatNumber: '',
      phone: '',
      address: '',
      notes: '',
    });

    expect(result).toMatchObject({
      success: false,
      fieldErrors: {
        name: [expect.any(String)],
        email: [expect.any(String)],
      },
    });
  });

  it('rejects an email that already belongs to another client', async () => {
    const existing = await createTempClient();
    currentHeaders = await adminHeaders();

    try {
      const result = await createClient({
        name: 'Andere Klant',
        email: existing.email,
        vatNumber: '',
        phone: '',
        address: '',
        notes: '',
      });

      expect(result).toMatchObject({
        success: false,
        formError: 'Er bestaat al een klant met dit e-mailadres.',
      });
    } finally {
      await db.delete(clients).where(eq(clients.id, existing.id));
    }
  });
});

describe('updateClient (server action)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const { headers, cleanup } = await createTempClientSession();

    try {
      currentHeaders = headers;
      const result = await updateClient({
        clientId: client.id,
        name: client.name,
        email: client.email,
        vatNumber: '',
        phone: '',
        address: '',
        notes: '',
      });
      expect(result).toMatchObject({
        success: false,
        formError: 'This action requires an admin account.',
      });
    } finally {
      await cleanup();
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  it('updates a client with valid input', async () => {
    const client = await createTempClient();
    currentHeaders = await adminHeaders();

    try {
      const result = await updateClient({
        clientId: client.id,
        name: 'Bijgewerkte Naam',
        email: client.email,
        vatNumber: '',
        phone: '',
        address: 'Nieuw adres 1',
        notes: '',
      });

      expect(result.success).toBe(true);
      const [updated] = await db.select().from(clients).where(eq(clients.id, client.id)).limit(1);
      expect(updated).toMatchObject({ name: 'Bijgewerkte Naam', address: 'Nieuw adres 1' });
    } finally {
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  it('rejects an email that already belongs to a different client', async () => {
    const clientA = await createTempClient();
    const clientB = await createTempClient();
    currentHeaders = await adminHeaders();

    try {
      const result = await updateClient({
        clientId: clientB.id,
        name: clientB.name,
        email: clientA.email,
        vatNumber: '',
        phone: '',
        address: '',
        notes: '',
      });

      expect(result).toMatchObject({
        success: false,
        formError: 'Er bestaat al een klant met dit e-mailadres.',
      });
    } finally {
      await db.delete(clients).where(eq(clients.id, clientA.id));
      await db.delete(clients).where(eq(clients.id, clientB.id));
    }
  });
});

describe('resendInvitation (server action)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const invitedUser = await createTempClientUser(client.id, { emailVerified: false });
    const { headers, cleanup } = await createTempClientSession();

    try {
      currentHeaders = headers;
      await expect(resendInvitation(client.id, invitedUser.id)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    } finally {
      await cleanup();
      await db.delete(userTable).where(eq(userTable.id, invitedUser.id));
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  it('works for an invited (not yet active) user', async () => {
    const client = await createTempClient();
    const invitedUser = await createTempClientUser(client.id, { emailVerified: false });
    currentHeaders = await adminHeaders();

    try {
      await expect(resendInvitation(client.id, invitedUser.id)).resolves.toBeUndefined();
    } finally {
      await db.delete(userTable).where(eq(userTable.id, invitedUser.id));
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  it('rejects an already-active user', async () => {
    const client = await createTempClient();
    const activeUser = await createTempClientUser(client.id, { emailVerified: true });
    currentHeaders = await adminHeaders();

    try {
      await expect(resendInvitation(client.id, activeUser.id)).rejects.toThrow(
        'Deze gebruiker is al actief',
      );
    } finally {
      await db.delete(userTable).where(eq(userTable.id, activeUser.id));
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  it('rejects a user id that belongs to a different client', async () => {
    const clientA = await createTempClient();
    const clientB = await createTempClient();
    const userOfA = await createTempClientUser(clientA.id, { emailVerified: false });
    currentHeaders = await adminHeaders();

    try {
      // clientB's page passing userOfA's id must not manage a client A user.
      await expect(resendInvitation(clientB.id, userOfA.id)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    } finally {
      await db.delete(userTable).where(eq(userTable.id, userOfA.id));
      await db.delete(clients).where(eq(clients.id, clientA.id));
      await db.delete(clients).where(eq(clients.id, clientB.id));
    }
  });
});

describe('revokeClientUserAccess (server action)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const targetUser = await createTempClientUser(client.id);
    const { headers, cleanup } = await createTempClientSession();

    try {
      currentHeaders = headers;
      await expect(revokeClientUserAccess(client.id, targetUser.id)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    } finally {
      await cleanup();
      await db.delete(userTable).where(eq(userTable.id, targetUser.id));
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });

  it('rejects a user id that belongs to a different client', async () => {
    const clientA = await createTempClient();
    const clientB = await createTempClient();
    const userOfA = await createTempClientUser(clientA.id);
    currentHeaders = await adminHeaders();

    try {
      await expect(revokeClientUserAccess(clientB.id, userOfA.id)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
      const [stillThere] = await db
        .select({ clientId: userTable.clientId })
        .from(userTable)
        .where(eq(userTable.id, userOfA.id))
        .limit(1);
      expect(stillThere.clientId).toBe(clientA.id);
    } finally {
      await db.delete(userTable).where(eq(userTable.id, userOfA.id));
      await db.delete(clients).where(eq(clients.id, clientA.id));
      await db.delete(clients).where(eq(clients.id, clientB.id));
    }
  });

  it('ends sessions and blocks future sign-in for the revoked user', async () => {
    const client = await createTempClient();
    const password = 'ClientPassword123!';
    const targetUser = await createTempClientUser(client.id, { emailVerified: true });
    await db.insert(account).values({
      accountId: targetUser.id,
      providerId: 'credential',
      userId: targetUser.id,
      password: await hashPassword(password),
    });

    try {
      // A real session, created before the revoke, must not survive it.
      await auth.api.signInEmail({ body: { email: targetUser.email, password } });
      const [sessionBefore] = await db
        .select()
        .from(session)
        .where(eq(session.userId, targetUser.id))
        .limit(1);
      expect(sessionBefore).toBeTruthy();

      currentHeaders = await adminHeaders();
      await revokeClientUserAccess(client.id, targetUser.id);

      const remainingSessions = await db
        .select()
        .from(session)
        .where(eq(session.userId, targetUser.id));
      expect(remainingSessions).toHaveLength(0);

      const [updatedUser] = await db
        .select({ clientId: userTable.clientId })
        .from(userTable)
        .where(eq(userTable.id, targetUser.id))
        .limit(1);
      expect(updatedUser.clientId).toBeNull();
    } finally {
      await db.delete(userTable).where(eq(userTable.id, targetUser.id));
      await db.delete(clients).where(eq(clients.id, client.id));
    }
  });
});
