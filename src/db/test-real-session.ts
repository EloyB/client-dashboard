import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { account, clients, projects, user as userTable } from '@/db/schema';
import { auth } from '@/lib/auth';

/**
 * Unlike test-client.ts/test-fixtures.ts (which target the isolated testDb),
 * these helpers create real sessions against the real db — `auth` is bound
 * to it, so resolving a session always goes through that database regardless
 * of which `database` the code under test is given for its own data. Only
 * import this from test files.
 */

export const ADMIN_EMAIL = 'eloy@studioswyft.be';
export const ADMIN_PASSWORD = 'AdminWachtwoord123!';

export function unique(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}@example.test`;
}

export async function sessionHeadersFor(email: string, password: string): Promise<Headers> {
  const response = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
  const [cookiePair] = (response.headers.get('set-cookie') ?? '').split(';');
  return new Headers({ cookie: cookiePair });
}

export function adminHeaders(): Promise<Headers> {
  return sessionHeadersFor(ADMIN_EMAIL, ADMIN_PASSWORD);
}

export async function createTempClient(overrides: Partial<typeof clients.$inferInsert> = {}) {
  const [client] = await db
    .insert(clients)
    .values({ name: unique('Temp Client'), email: unique('temp-client'), ...overrides })
    .returning();
  return client;
}

export async function createTempProject(
  clientId: string,
  overrides: Partial<typeof projects.$inferInsert> = {},
) {
  const [project] = await db
    .insert(projects)
    .values({ clientId, name: unique('Temp Project'), status: 'active', ...overrides })
    .returning();
  return project;
}

/** A client-role session for a fresh, disposable user on an existing client. */
export async function createTempClientUserSession(clientId: string): Promise<{
  userId: string;
  headers: Headers;
  cleanup: () => Promise<void>;
}> {
  const password = 'ClientPassword123!';
  const [clientUser] = await db
    .insert(userTable)
    .values({
      name: 'Temp Client User',
      email: unique('temp-client-user'),
      role: 'client',
      clientId,
      emailVerified: true,
    })
    .returning();
  await db.insert(account).values({
    accountId: clientUser.id,
    providerId: 'credential',
    userId: clientUser.id,
    password: await hashPassword(password),
  });

  const headers = await sessionHeadersFor(clientUser.email, password);
  const cleanup = async () => {
    await db.delete(userTable).where(eq(userTable.id, clientUser.id));
  };

  return { userId: clientUser.id, headers, cleanup };
}

/** A client-role session for a freshly created, disposable client + user. */
export async function createTempClientSession(): Promise<{
  headers: Headers;
  cleanup: () => Promise<void>;
}> {
  const client = await createTempClient();
  const { headers, cleanup: cleanupUser } = await createTempClientUserSession(client.id);

  const cleanup = async () => {
    await db.delete(clients).where(eq(clients.id, client.id));
    await cleanupUser();
  };

  return { headers, cleanup };
}
