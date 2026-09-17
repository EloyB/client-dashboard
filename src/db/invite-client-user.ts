import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { clients, user } from '@/db/schema';
import { inviteClientUser } from '@/features/clients/service';

// Local dev helper: invite a client user without going through the admin UI
// (which lands in a later slice). Usage:
//   pnpm db:invite-client "info@verlinden-zn.be" "Jan Jansen" "jan@example.com"
async function main() {
  const [clientEmail, name, email] = process.argv.slice(2);
  if (!clientEmail || !name || !email) {
    console.error('Gebruik: pnpm db:invite-client <klant-e-mailadres> <naam> <e-mailadres>');
    process.exit(1);
  }

  const [client] = await db.select().from(clients).where(eq(clients.email, clientEmail)).limit(1);
  if (!client) {
    console.error(`Geen klant gevonden met e-mailadres ${clientEmail}.`);
    process.exit(1);
  }

  const [admin] = await db.select().from(user).where(eq(user.role, 'admin')).limit(1);
  if (!admin) {
    console.error('Geen admingebruiker gevonden. Draai eerst pnpm db:seed.');
    process.exit(1);
  }

  const { userId } = await inviteClientUser({ name, email, clientId: client.id }, admin.id);
  console.log(`Uitnodiging verstuurd naar ${email} (gebruiker ${userId}).`);
  console.log('Bekijk de e-mail op http://localhost:8026 (Mailpit).');
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
