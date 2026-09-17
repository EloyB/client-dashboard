'use server';

import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

import { db } from '@/db';
import { clients, user as userTable } from '@/db/schema';
import { acceptInvitationSchema, inviteClientUserSchema } from '@/features/clients/schemas';
import {
  getAdminName,
  inviteClientUser as inviteClientUserCore,
  sendInvitationEmail,
} from '@/features/clients/service';
import { AccessError, requireAdmin } from '@/lib/access';
import { auth } from '@/lib/auth';
import { createFormAction } from '@/lib/form-action';
import { consumeInviteToken } from '@/lib/invite-token';

export const inviteClientUser = createFormAction(inviteClientUserSchema, async (data) => {
  const admin = await requireAdmin(await headers());
  return inviteClientUserCore(data, admin.id);
});

export async function resendInvitation(userId: string): Promise<void> {
  const admin = await requireAdmin(await headers());

  const [invitedUser] = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      clientId: userTable.clientId,
      emailVerified: userTable.emailVerified,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  if (!invitedUser || !invitedUser.clientId) {
    throw new AccessError('NOT_FOUND', 'Client user not found.');
  }
  if (invitedUser.emailVerified) {
    throw new Error(
      'Deze gebruiker is al actief; een uitnodiging opnieuw versturen is niet nodig.',
    );
  }

  const [client] = await db
    .select({ name: clients.name })
    .from(clients)
    .where(eq(clients.id, invitedUser.clientId))
    .limit(1);
  if (!client) {
    throw new AccessError('NOT_FOUND', 'Client not found.');
  }

  const invitedByName = await getAdminName(admin.id);
  await sendInvitationEmail({
    recipientEmail: invitedUser.email,
    clientName: client.name,
    invitedByName,
    userId: invitedUser.id,
  });
}

export const acceptInvitation = createFormAction(acceptInvitationSchema, async (data) => {
  const consumed = await consumeInviteToken(data.token);
  if (!consumed) {
    throw new Error('Deze uitnodiging is niet meer geldig.');
  }

  const [updatedUser] = await db
    .update(userTable)
    .set({ name: data.name, email: data.email, emailVerified: true })
    .where(eq(userTable.id, consumed.userId))
    .returning();

  // Triggers the first real sign-in link through the same path a returning
  // client uses (see src/lib/auth.ts's sendMagicLink hook). Calls the
  // endpoint's own handler directly — the client SDK's relative fetch has
  // no origin to resolve against from a server action.
  await auth.api.signInMagicLink({
    body: { email: updatedUser.email, callbackURL: '/portal' },
    headers: await headers(),
  });

  return { email: updatedUser.email };
});
