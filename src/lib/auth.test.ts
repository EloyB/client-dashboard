import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/db';
import { user as userTable } from '@/db/schema';
import { getCurrentUser } from '@/lib/access';
import { auth } from '@/lib/auth';

const ADMIN_EMAIL = 'eloy@studioswyft.be';
const ADMIN_PASSWORD = 'AdminWachtwoord123!';

function sessionHeaders(setCookieHeader: string | null): Headers {
  const [cookiePair] = (setCookieHeader ?? '').split(';');
  return new Headers({ cookie: cookiePair });
}

describe('signInEmail', () => {
  it('creates a real session for the correct admin credentials', async () => {
    const response = await auth.api.signInEmail({
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      asResponse: true,
    });

    expect(response.status).toBe(200);
    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();

    const currentUser = await getCurrentUser(sessionHeaders(setCookie));
    expect(currentUser).toMatchObject({ role: 'admin' });
  });

  it('gives the same neutral error for an unknown email and a wrong password', async () => {
    const unknownEmail = auth.api
      .signInEmail({ body: { email: 'does-not-exist@example.com', password: 'Whatever123!' } })
      .catch((error) => error);
    const wrongPassword = auth.api
      .signInEmail({ body: { email: ADMIN_EMAIL, password: 'WrongPassword123!' } })
      .catch((error) => error);

    const [unknownEmailError, wrongPasswordError] = await Promise.all([
      unknownEmail,
      wrongPassword,
    ]);

    expect(unknownEmailError.status).toBe('UNAUTHORIZED');
    expect(wrongPasswordError.status).toBe('UNAUTHORIZED');
    expect(unknownEmailError.body?.message).toBe(wrongPasswordError.body?.message);
  });

  it('cannot sign in a client user, who has no password-based account', async () => {
    const [existingClientUser] = await db
      .select({ email: userTable.email })
      .from(userTable)
      .where(eq(userTable.role, 'client'))
      .limit(1);
    expect(existingClientUser).toBeTruthy();

    await expect(
      auth.api.signInEmail({
        body: { email: existingClientUser.email, password: 'AnyPassword123!' },
      }),
    ).rejects.toMatchObject({ status: 'UNAUTHORIZED' });
  });
});

describe('signUpEmail', () => {
  it('is disabled, even when called in-process', async () => {
    await expect(
      auth.api.signUpEmail({
        body: { name: 'Nieuwe gebruiker', email: 'nieuw@example.com', password: 'Whatever123!' },
      }),
    ).rejects.toMatchObject({ status: 'BAD_REQUEST' });
  });
});

describe('signOut', () => {
  it('ends the session so getCurrentUser no longer resolves it', async () => {
    const signInResponse = await auth.api.signInEmail({
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      asResponse: true,
    });
    const headers = sessionHeaders(signInResponse.headers.get('set-cookie'));

    expect(await getCurrentUser(headers)).toMatchObject({ role: 'admin' });

    await auth.api.signOut({ headers });

    expect(await getCurrentUser(headers)).toBeNull();
  });
});
