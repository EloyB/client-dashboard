'use server';

import { and, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import type { z } from 'zod';

import { db } from '@/db';
import { clients, session, user as userTable } from '@/db/schema';
import {
  acceptInvitationSchema,
  clientFormSchema,
  inviteClientUserSchema,
  updateClientSchema,
} from '@/features/clients/schemas';
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

async function assertEmailAvailable(email: string, excludeClientId?: string): Promise<void> {
  const conditions = excludeClientId
    ? and(eq(clients.email, email), ne(clients.id, excludeClientId))
    : eq(clients.email, email);

  const [existing] = await db.select({ id: clients.id }).from(clients).where(conditions).limit(1);
  if (existing) {
    throw new Error('Er bestaat al een klant met dit e-mailadres.');
  }
}

/** The form always sends a string for optional fields — empty means "not set". */
function toNullable(value: string): string | null {
  return value === '' ? null : value;
}

function toClientFields(data: z.infer<typeof clientFormSchema>) {
  return {
    name: data.name,
    email: data.email,
    vatNumber: toNullable(data.vatNumber),
    phone: toNullable(data.phone),
    address: toNullable(data.address),
    notes: toNullable(data.notes),
  };
}

export const createClient = createFormAction(clientFormSchema, async (data) => {
  await requireAdmin(await headers());
  await assertEmailAvailable(data.email);

  const [client] = await db.insert(clients).values(toClientFields(data)).returning();

  revalidatePath('/app/clients');
  return { clientId: client.id };
});

export const updateClient = createFormAction(updateClientSchema, async (data) => {
  await requireAdmin(await headers());

  const { clientId, ...fields } = data;
  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  if (!existing) {
    throw new AccessError('NOT_FOUND', 'Client not found.');
  }
  await assertEmailAvailable(fields.email, clientId);

  await db.update(clients).set(toClientFields(fields)).where(eq(clients.id, clientId));

  revalidatePath('/app/clients');
  revalidatePath(`/app/clients/${clientId}`);
  return { clientId };
});

async function getClientUserOrThrow(clientId: string, userId: string) {
  const [clientUser] = await db
    .select({
      id: userTable.id,
      email: userTable.email,
      clientId: userTable.clientId,
      emailVerified: userTable.emailVerified,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  // A missing user and a user belonging to a different client are the same
  // NOT_FOUND — never confirms whether a manipulated id exists elsewhere.
  if (!clientUser || clientUser.clientId !== clientId) {
    throw new AccessError('NOT_FOUND', 'Client user not found.');
  }

  return clientUser;
}

export async function resendInvitation(clientId: string, userId: string): Promise<void> {
  const admin = await requireAdmin(await headers());
  const invitedUser = await getClientUserOrThrow(clientId, userId);

  if (invitedUser.emailVerified) {
    throw new Error(
      'Deze gebruiker is al actief; een uitnodiging opnieuw versturen is niet nodig.',
    );
  }

  const [client] = await db
    .select({ name: clients.name })
    .from(clients)
    .where(eq(clients.id, clientId))
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

/**
 * "Revokes" access by clearing clientId rather than deleting the row: tickets,
 * ticket_comments and files all reference the user with onDelete: 'restrict',
 * so a hard delete would fail once the user has any activity. This mirrors
 * what already happens when a client itself is deleted (onDelete: 'set null'),
 * and immediately locks the account out of every clientId-gated check.
 */
export async function revokeClientUserAccess(clientId: string, userId: string): Promise<void> {
  await requireAdmin(await headers());
  await getClientUserOrThrow(clientId, userId);

  await db.delete(session).where(eq(session.userId, userId));
  await db.update(userTable).set({ clientId: null }).where(eq(userTable.id, userId));

  revalidatePath(`/app/clients/${clientId}`);
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
