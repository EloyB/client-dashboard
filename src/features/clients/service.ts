import { eq } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { clients, user as userTable } from '@/db/schema';
import { inviteEmail } from '@/emails/invite';
import { env } from '@/lib/env';
import { createInviteToken } from '@/lib/invite-token';
import { sendEmail } from '@/lib/email';

// Core invite logic shared by the admin-facing server actions
// (src/features/clients/actions.ts, which add the requireAdmin check) and the
// local dev script (src/db/invite-client-user.ts, which has no request/admin
// session to check against).

export async function getAdminName(adminId: string, database: Database = db): Promise<string> {
  const [admin] = await database
    .select({ name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, adminId))
    .limit(1);
  return admin?.name ?? 'Studio';
}

export async function sendInvitationEmail(
  input: {
    recipientEmail: string;
    clientName: string;
    invitedByName: string;
    userId: string;
  },
  database: Database = db,
): Promise<void> {
  const token = await createInviteToken(input.userId, database);
  const acceptUrl = `${env.BETTER_AUTH_URL}/uitnodiging/${token}`;

  await sendEmail({
    to: input.recipientEmail,
    subject: `Uitnodiging voor het projectportaal van ${input.clientName}`,
    html: inviteEmail({
      clientName: input.clientName,
      invitedByName: input.invitedByName,
      recipientEmail: input.recipientEmail,
      acceptUrl,
    }),
  });
}

export async function inviteClientUser(
  data: { name: string; email: string; clientId: string },
  invitedByAdminId: string,
  database: Database = db,
): Promise<{ userId: string }> {
  // Normalized here too (not just in the Zod schema at the actions.ts
  // boundary) since the dev script (src/db/invite-client-user.ts) calls this
  // directly with raw CLI input — see src/lib/auth.ts's sendMagicLink hook
  // for why storage must match Better Auth's case-insensitive lookups.
  const email = data.email.trim().toLowerCase();

  const [client] = await database
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.id, data.clientId))
    .limit(1);
  if (!client) {
    throw new Error('Klant niet gevonden.');
  }

  const [existing] = await database
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);
  if (existing) {
    throw new Error('Er bestaat al een gebruiker met dit e-mailadres.');
  }

  const [invitedUser] = await database
    .insert(userTable)
    .values({
      name: data.name,
      email,
      role: 'client',
      clientId: client.id,
      emailVerified: false,
    })
    .returning();

  const invitedByName = await getAdminName(invitedByAdminId, database);
  await sendInvitationEmail(
    {
      recipientEmail: email,
      clientName: client.name,
      invitedByName,
      userId: invitedUser.id,
    },
    database,
  );

  return { userId: invitedUser.id };
}
