import { afterEach, describe, expect, it } from 'vitest';

import { cleanupTestClient, createTestClient, createTestClientUser } from '@/db/test-fixtures';
import { testDb } from '@/db/test-client';
import { consumeInviteToken, createInviteToken, peekInviteToken } from '@/lib/invite-token';

describe('invite tokens', () => {
  let client: Awaited<ReturnType<typeof createTestClient>>;
  let clientUser: Awaited<ReturnType<typeof createTestClientUser>>;

  afterEach(async () => {
    if (client) await cleanupTestClient(client.id, [clientUser.id]);
  });

  it('peeking returns the user without consuming the token', async () => {
    client = await createTestClient();
    clientUser = await createTestClientUser(client.id, { emailVerified: false });

    const token = await createInviteToken(clientUser.id, testDb);

    expect(await peekInviteToken(token, testDb)).toEqual({ userId: clientUser.id });
    expect(await peekInviteToken(token, testDb)).toEqual({ userId: clientUser.id });
  });

  it('consuming the token works once and fails on a second attempt', async () => {
    client = await createTestClient();
    clientUser = await createTestClientUser(client.id, { emailVerified: false });

    const token = await createInviteToken(clientUser.id, testDb);

    expect(await consumeInviteToken(token, testDb)).toEqual({ userId: clientUser.id });
    expect(await consumeInviteToken(token, testDb)).toBeNull();
  });

  it('rejects an unknown token', async () => {
    expect(await peekInviteToken('does-not-exist', testDb)).toBeNull();
    expect(await consumeInviteToken('does-not-exist', testDb)).toBeNull();
  });
});
