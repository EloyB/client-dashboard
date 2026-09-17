import { eq } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { clients, user as userTable } from '@/db/schema';
import { peekInviteToken } from '@/lib/invite-token';

export type Invitation = {
  userId: string;
  name: string;
  email: string;
  clientId: string;
  clientName: string;
};

/** Read-only: used to prefill the acceptance page. Does not consume the token. */
export async function getInvitationByToken(
  token: string,
  database: Database = db,
): Promise<Invitation | null> {
  const peeked = await peekInviteToken(token, database);
  if (!peeked) return null;

  const [invitedUser] = await database
    .select({ name: userTable.name, email: userTable.email, clientId: userTable.clientId })
    .from(userTable)
    .where(eq(userTable.id, peeked.userId))
    .limit(1);
  if (!invitedUser || !invitedUser.clientId) return null;

  const [client] = await database
    .select({ name: clients.name })
    .from(clients)
    .where(eq(clients.id, invitedUser.clientId))
    .limit(1);
  if (!client) return null;

  return {
    userId: peeked.userId,
    name: invitedUser.name,
    email: invitedUser.email,
    clientId: invitedUser.clientId,
    clientName: client.name,
  };
}
