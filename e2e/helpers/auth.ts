import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import type { BrowserContext } from '@playwright/test';

import { db } from '@/db';
import { account, clients, user as userTable } from '@/db/schema';
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
