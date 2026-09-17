import { createAuthClient } from 'better-auth/react';

// No baseURL: this is a same-origin app, so the client defaults to the
// relative "/api/auth" path — and importing server-only env vars here would
// leak into the browser bundle.
export const authClient = createAuthClient();
