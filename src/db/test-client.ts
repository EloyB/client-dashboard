import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { z } from 'zod';

import * as schema from '@/db/schema';

/** Only import this from test files; the running app never uses the test database. */
const { TEST_DATABASE_URL } = z.object({ TEST_DATABASE_URL: z.url() }).parse(process.env);

const client = postgres(TEST_DATABASE_URL);

export const testDb = drizzle(client, { schema });
