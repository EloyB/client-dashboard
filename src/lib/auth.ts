import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from '@/db';
import * as schema from '@/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  // Enabled so the seed script can create the admin through Better Auth's own
  // password hashing. The actual sign-in page/flow is built separately.
  emailAndPassword: {
    enabled: true,
  },
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
