import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { afterAll, describe, expect, it, vi } from 'vitest';

// Captures the URL each template would embed, instead of building real HTML —
// these tests care about the sign-in/reset flow, not the email markup (see
// src/emails/templates.test.ts for that).
vi.mock('@/emails/magic-link', () => ({
  magicLinkEmail: ({ signInUrl }: { signInUrl: string }) => signInUrl,
}));
vi.mock('@/emails/password-reset', () => ({
  passwordResetEmail: ({ resetUrl }: { resetUrl: string }) => resetUrl,
}));
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }));

const { sendEmail } = await import('@/lib/email');
const { db } = await import('@/db');
const { account, clients, user: userTable } = await import('@/db/schema');
const { getCurrentUser } = await import('@/lib/access');
const { auth } = await import('@/lib/auth');

const ADMIN_EMAIL = 'eloy@studioswyft.be';

function sessionHeaders(setCookieHeader: string | null): Headers {
  const [cookiePair] = (setCookieHeader ?? '').split(';');
  return new Headers({ cookie: cookiePair });
}

function unique(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}@example.test`;
}

function tokenFromUrl(url: string): string {
  return new URL(url).searchParams.get('token') ?? '';
}

async function createTempClientUser() {
  const [client] = await db
    .insert(clients)
    .values({ name: unique('Temp Client'), email: unique('temp-client') })
    .returning();
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
  return { client, clientUser };
}

async function deleteClientAndUser(clientId: string, userId: string) {
  await db.delete(clients).where(eq(clients.id, clientId));
  await db.delete(userTable).where(eq(userTable.id, userId));
}

describe('magic-link sign-in', () => {
  it('sends no link for an unknown email', async () => {
    vi.mocked(sendEmail).mockClear();

    await auth.api.signInMagicLink({
      body: { email: unique('unknown'), callbackURL: '/portal' },
      headers: new Headers(),
    });

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('sends no link for an admin, even though the account exists', async () => {
    vi.mocked(sendEmail).mockClear();

    await auth.api.signInMagicLink({
      body: { email: ADMIN_EMAIL, callbackURL: '/portal' },
      headers: new Headers(),
    });

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('works once, and a second use of the same link fails', async () => {
    const { client, clientUser } = await createTempClientUser();
    vi.mocked(sendEmail).mockClear();

    try {
      await auth.api.signInMagicLink({
        body: { email: clientUser.email, callbackURL: '/portal' },
        headers: new Headers(),
      });
      expect(sendEmail).toHaveBeenCalledTimes(1);
      const signInUrl = vi.mocked(sendEmail).mock.calls[0][0].html;
      const token = tokenFromUrl(signInUrl);
      expect(token).toBeTruthy();

      const firstUse = await auth.api.magicLinkVerify({
        query: { token, callbackURL: '/portal' },
        headers: new Headers(),
        asResponse: true,
      });
      expect(firstUse.status).toBe(302);
      expect(firstUse.headers.get('location')).toContain('/portal');

      const secondUse = await auth.api.magicLinkVerify({
        query: { token, callbackURL: '/portal' },
        headers: new Headers(),
        asResponse: true,
      });
      expect(secondUse.headers.get('location')).toContain('error=INVALID_TOKEN');
    } finally {
      await deleteClientAndUser(client.id, clientUser.id);
    }
  });
});

describe('password reset', () => {
  it('ends the user’s other sessions once the password is reset', async () => {
    const password = 'OldPassword123!';
    const [tempAdmin] = await db
      .insert(userTable)
      .values({
        name: 'Temp Admin',
        email: unique('temp-admin'),
        role: 'admin',
        emailVerified: true,
      })
      .returning();
    await db.insert(account).values({
      accountId: tempAdmin.id,
      providerId: 'credential',
      userId: tempAdmin.id,
      password: await hashPassword(password),
    });

    try {
      const sessionA = sessionHeaders(
        (
          await auth.api.signInEmail({
            body: { email: tempAdmin.email, password },
            asResponse: true,
          })
        ).headers.get('set-cookie'),
      );
      const sessionB = sessionHeaders(
        (
          await auth.api.signInEmail({
            body: { email: tempAdmin.email, password },
            asResponse: true,
          })
        ).headers.get('set-cookie'),
      );
      expect(await getCurrentUser(sessionA)).toMatchObject({ id: tempAdmin.id });
      expect(await getCurrentUser(sessionB)).toMatchObject({ id: tempAdmin.id });

      vi.mocked(sendEmail).mockClear();
      await auth.api.requestPasswordReset({
        body: { email: tempAdmin.email, redirectTo: '/login/wachtwoord-resetten' },
      });
      expect(sendEmail).toHaveBeenCalledTimes(1);
      const resetUrl = vi.mocked(sendEmail).mock.calls[0][0].html;
      // The reset token sits in the path (/reset-password/:token), unlike
      // the magic-link token which is a query param.
      const token = new URL(resetUrl).pathname.split('/').pop() ?? '';
      expect(token).toBeTruthy();

      await auth.api.resetPassword({ body: { newPassword: 'NewPassword123!', token } });

      expect(await getCurrentUser(sessionA)).toBeNull();
      expect(await getCurrentUser(sessionB)).toBeNull();
    } finally {
      await db.delete(userTable).where(eq(userTable.id, tempAdmin.id));
    }
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});
