import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from '@/db';
import * as schema from '@/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: {
    enabled: true,
    // No public registration path exists or ever will for admins; the seed
    // script creates the admin via direct DB inserts instead of signUpEmail
    // (which this same flag also blocks when called in-process).
    disableSignUp: true,
  },
  rateLimit: {
    enabled: true,
    customRules: {
      // Matches the "3 attempts, then a 30s wait" behaviour from the login design.
      '/sign-in/email': { window: 30, max: 3 },
    },
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
