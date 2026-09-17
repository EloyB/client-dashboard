import { generateRandomString } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { verification } from '@/db/schema';

const IDENTIFIER_PREFIX = 'invite:';
const EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, per the invite email copy

/**
 * A client user invitation is its own short-lived token, separate from the
 * magic-link plugin: accepting it doesn't sign the user in directly, it
 * confirms their details and then sends them the first real sign-in link
 * (see docs/design/handoff/.../Klantportaal aanmelden.dc.html, screen 1→3).
 * Reuses Better Auth's own generic `verification` table rather than adding
 * a new one, namespaced with an `invite:` identifier prefix.
 */
export async function createInviteToken(userId: string, database: Database = db): Promise<string> {
  const token = generateRandomString(32, 'a-z', 'A-Z', '0-9');
  await database.insert(verification).values({
    identifier: `${IDENTIFIER_PREFIX}${token}`,
    value: JSON.stringify({ userId }),
    expiresAt: new Date(Date.now() + EXPIRES_IN_MS),
  });
  return token;
}

/** Read-only lookup for rendering the acceptance page; does not consume the token. */
export async function peekInviteToken(
  token: string,
  database: Database = db,
): Promise<{ userId: string } | null> {
  const [row] = await database
    .select()
    .from(verification)
    .where(eq(verification.identifier, `${IDENTIFIER_PREFIX}${token}`))
    .limit(1);

  if (!row || row.expiresAt < new Date()) return null;
  return JSON.parse(row.value) as { userId: string };
}

/** Single-use: deletes the token atomically, so a second acceptance attempt fails. */
export async function consumeInviteToken(
  token: string,
  database: Database = db,
): Promise<{ userId: string } | null> {
  const [row] = await database
    .delete(verification)
    .where(eq(verification.identifier, `${IDENTIFIER_PREFIX}${token}`))
    .returning();

  if (!row || row.expiresAt < new Date()) return null;
  return JSON.parse(row.value) as { userId: string };
}
