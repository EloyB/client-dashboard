import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import * as schema from '@/db/schema';
import { clients, user as userTable } from '@/db/schema';
import { magicLinkEmail } from '@/emails/magic-link';
import { passwordResetEmail } from '@/emails/password-reset';
import { sendEmail } from '@/lib/email';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: {
    enabled: true,
    // No public registration path exists or ever will for admins; the seed
    // script creates the admin via direct DB inserts instead of signUpEmail
    // (which this same flag also blocks when called in-process).
    disableSignUp: true,
    minPasswordLength: 12,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      // Only admins have a password at all, but guard by role too: without
      // this, a client requesting "forgot password" here would silently
      // provision themselves a credential account (see resetPassword's
      // create-account-if-missing fallback) — harmless since AdminLayout
      // still turns them away, but needless and worth not doing.
      const [dbUser] = await db
        .select({ role: userTable.role })
        .from(userTable)
        .where(eq(userTable.id, user.id))
        .limit(1);
      if (dbUser?.role !== 'admin') return;

      await sendEmail({
        to: user.email,
        subject: 'Wachtwoord opnieuw instellen',
        html: passwordResetEmail({ name: user.name, resetUrl: url }),
      });
    },
  },
  rateLimit: {
    enabled: true,
    customRules: {
      // Matches the "3 attempts, then a 30s wait" behaviour from the login design.
      '/sign-in/email': { window: 30, max: 3 },
      '/request-password-reset': { window: 60, max: 3 },
    },
  },
  plugins: [
    magicLink({
      expiresIn: 60 * 15, // 15 minutes, single use — see the aanmeldlink email copy
      disableSignUp: true, // never creates a new user; only an invited client can sign in
      rateLimit: { window: 60, max: 3 },
      sendMagicLink: async ({ email, url }) => {
        // Matches Better Auth's own case-insensitive lookup (its internal
        // adapter lowercases email before every query) — without this, an
        // address typed with different casing than it was stored in would
        // silently get no link.
        const [recipient] = await db
          .select({ role: userTable.role, clientId: userTable.clientId })
          .from(userTable)
          .where(eq(userTable.email, email.toLowerCase()))
          .limit(1);

        // Never reveals whether the address exists: an unknown email or the
        // admin's own email both silently receive nothing.
        if (!recipient || recipient.role !== 'client' || !recipient.clientId) return;

        const [client] = await db
          .select({ name: clients.name })
          .from(clients)
          .where(eq(clients.id, recipient.clientId))
          .limit(1);

        await sendEmail({
          to: email,
          subject: 'Uw aanmeldlink voor het projectportaal',
          html: magicLinkEmail({ clientName: client?.name ?? '', signInUrl: url }),
        });
      },
    }),
  ],
  advanced: {
    database: {
      generateId: false,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'client',
        input: false,
      },
      clientId: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },
});
