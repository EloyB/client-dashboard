import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/email', () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }));

const { sendEmail } = await import('@/lib/email');
const { testDb } = await import('@/db/test-client');
const { user } = await import('@/db/schema');
const {
  cleanupTestAdminUser,
  cleanupTestClient,
  createTestAdminUser,
  createTestClient,
  createTestClientUser,
} = await import('@/db/test-fixtures');
const { inviteClientUser } = await import('@/features/clients/service');

describe('inviteClientUser', () => {
  it('creates a linked, unverified client user and sends an invitation email', async () => {
    const client = await createTestClient();
    const admin = await createTestAdminUser();
    const email = `invitee-${crypto.randomUUID()}@example.test`;

    try {
      const { userId } = await inviteClientUser(
        { name: 'Jan Jansen', email, clientId: client.id },
        admin.id,
        testDb,
      );

      const [createdUser] = await testDb.select().from(user).where(eq(user.id, userId)).limit(1);
      expect(createdUser).toMatchObject({
        role: 'client',
        clientId: client.id,
        email,
        emailVerified: false,
      });

      expect(sendEmail).toHaveBeenCalledTimes(1);
      const message = vi.mocked(sendEmail).mock.calls[0][0];
      expect(message.to).toBe(email);
      expect(message.subject).toContain(client.name);

      await cleanupTestClient(client.id, [userId]);
    } finally {
      await cleanupTestAdminUser(admin.id);
    }
  });

  it('rejects an email that already belongs to a user', async () => {
    const client = await createTestClient();
    const admin = await createTestAdminUser();
    const existing = await createTestClientUser(client.id);
    vi.mocked(sendEmail).mockClear();

    try {
      await expect(
        inviteClientUser(
          { name: 'Iemand anders', email: existing.email, clientId: client.id },
          admin.id,
          testDb,
        ),
      ).rejects.toThrow('Er bestaat al een gebruiker met dit e-mailadres.');
      expect(sendEmail).not.toHaveBeenCalled();
    } finally {
      await cleanupTestClient(client.id, [existing.id]);
      await cleanupTestAdminUser(admin.id);
    }
  });
});
