import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import type { BrowserContext } from '@playwright/test';

import { db } from '@/db';
import { account, clients, files, projects, user as userTable } from '@/db/schema';
import { auth } from '@/lib/auth';

const SESSION_COOKIE_NAME = 'better-auth.session_token';

const ADMIN_EMAIL = 'eloy@studioswyft.be';
const ADMIN_PASSWORD = 'AdminWachtwoord123!';

// Seeded client users only support magic-link sign-in (no password), so e2e
// tests use a dedicated password-enabled client account instead, patched
// onto a seeded client so its data (name, projects, ...) still shows up.
const CLIENT_TEST_EMAIL = 'e2e-client-test@studioswyft.be';
const CLIENT_TEST_PASSWORD = 'ClientTestWachtwoord123!';
const CLIENT_TEST_NAME = 'E2E Client Test';
const SEEDED_CLIENT_EMAIL = 'info@verlinden-zn.be';

export const CLIENT_TEST_CLIENT_NAME = 'Meubelmakerij Verlinden';

async function signInAndExtractCookie(email: string, password: string) {
  const response = await auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  });

  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error(`Sign-in for ${email} did not return a session cookie`);
  }

  const [, value] = setCookie.split(';')[0].split('=');
  return decodeURIComponent(value);
}

async function addSessionCookie(context: BrowserContext, token: string) {
  await context.addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

export async function loginAsAdmin(context: BrowserContext) {
  const token = await signInAndExtractCookie(ADMIN_EMAIL, ADMIN_PASSWORD);
  await addSessionCookie(context, token);
}

async function ensureClientTestUser() {
  const [existing] = await db
    .select({ id: userTable.id, role: userTable.role, clientId: userTable.clientId })
    .from(userTable)
    .where(eq(userTable.email, CLIENT_TEST_EMAIL))
    .limit(1);

  const [seededClient] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.email, SEEDED_CLIENT_EMAIL))
    .limit(1);
  if (!seededClient) {
    throw new Error(`Seeded client with email ${SEEDED_CLIENT_EMAIL} not found — run pnpm db:seed`);
  }

  if (!existing) {
    // Direct insert, not signUpEmail: slice 1a disables sign-up everywhere,
    // in-process calls included (see src/db/seed.ts for the same pattern).
    const [newUser] = await db
      .insert(userTable)
      .values({ name: CLIENT_TEST_NAME, email: CLIENT_TEST_EMAIL, emailVerified: true })
      .returning();
    await db.insert(account).values({
      accountId: newUser.id,
      providerId: 'credential',
      userId: newUser.id,
      password: await hashPassword(CLIENT_TEST_PASSWORD),
    });
  }

  if (!existing || existing.role !== 'client' || existing.clientId !== seededClient.id) {
    await db
      .update(userTable)
      .set({ role: 'client', clientId: seededClient.id, emailVerified: true })
      .where(eq(userTable.email, CLIENT_TEST_EMAIL));
  }
}

export async function loginAsClient(context: BrowserContext) {
  await ensureClientTestUser();
  const token = await signInAndExtractCookie(CLIENT_TEST_EMAIL, CLIENT_TEST_PASSWORD);
  await addSessionCookie(context, token);
}

/**
 * A fresh, disposable client with exactly `projectCount` active projects,
 * logged in as a new client user — for scenarios the shared
 * `CLIENT_TEST_CLIENT_NAME` fixture can't cover (it always has multiple
 * projects), such as the single-selectable-project prefill.
 */
export async function loginAsTempClient(
  context: BrowserContext,
  projectCount: number,
): Promise<{
  clientName: string;
  userEmail: string;
  projectNames: string[];
  cleanup: () => Promise<void>;
}> {
  // Desktop and Mobile projects run this in parallel, so Date.now() alone
  // can collide between workers started in the same millisecond.
  const unique = `${Date.now()}-${crypto.randomUUID()}`;
  const password = 'ZzzTempClientWachtwoord123!';
  const clientName = `Zzz Temp Client ${unique}`;

  const [client] = await db
    .insert(clients)
    .values({ name: clientName, email: `zzz-temp-client-${unique}@example.test` })
    .returning();

  const projectNames = Array.from(
    { length: projectCount },
    (_, index) => `Zzz Project ${index + 1}`,
  );
  if (projectNames.length > 0) {
    await db
      .insert(projects)
      .values(
        projectNames.map((name) => ({ clientId: client.id, name, status: 'active' as const })),
      );
  }

  const [clientUser] = await db
    .insert(userTable)
    .values({
      name: 'Zzz Temp Client User',
      email: `zzz-temp-user-${unique}@example.test`,
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

  const token = await signInAndExtractCookie(clientUser.email, password);
  await addSessionCookie(context, token);

  const cleanup = async () => {
    // Projects first (cascades any tickets/attachments created during the
    // test), then files uploaded by this user (files.uploadedById
    // restricts), then the user, then the client.
    await db.delete(projects).where(eq(projects.clientId, client.id));
    await db.delete(files).where(eq(files.uploadedById, clientUser.id));
    await db.delete(userTable).where(eq(userTable.id, clientUser.id));
    await db.delete(clients).where(eq(clients.id, client.id));
  };

  return { clientName, userEmail: clientUser.email, projectNames, cleanup };
}
