import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

// inviteClientUser (the server action) reads the session via next/headers'
// headers(), which throws outside a real request. Mocking it lets these
// tests drive requireAdmin's actual FORBIDDEN/UNAUTHENTICATED behaviour
// through the real action instead of only through its underlying helpers.
let currentHeaders = new Headers();
vi.mock('next/headers', () => ({
  headers: async () => currentHeaders,
}));

const { db } = await import('@/db');
const { account, clients, user: userTable } = await import('@/db/schema');
const { auth } = await import('@/lib/auth');
const { inviteClientUser } = await import('@/features/clients/actions');

function unique(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}@example.test`;
}

async function sessionHeadersFor(email: string, password: string): Promise<Headers> {
  const response = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
  const [cookiePair] = (response.headers.get('set-cookie') ?? '').split(';');
  return new Headers({ cookie: cookiePair });
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
    const [client] = await db
      .insert(clients)
      .values({ name: unique('Temp Client'), email: unique('temp-client') })
      .returning();
    const password = 'ClientPassword123!';
    const [clientUser] = await db
      .insert(userTable)
      .values({
        name: 'Temp Client User',
        email: unique('temp-client-user'),
        role: 'client',
        clientId: client.id,
        emailVerified: true,
      })
      .returning();
    await db.insert(account).values({
      accountId: clientUser.id,
      providerId: 'credential',
      userId: clientUser.id,
      password: await hashPassword(password),
    });

    try {
      currentHeaders = await sessionHeadersFor(clientUser.email, password);

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
      await db.delete(clients).where(eq(clients.id, client.id));
      await db.delete(userTable).where(eq(userTable.id, clientUser.id));
    }
  });
});
