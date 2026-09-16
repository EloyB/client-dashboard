import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.url(),

  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url(),

  SCALEWAY_ACCESS_KEY_ID: z.string().min(1),
  SCALEWAY_SECRET_ACCESS_KEY: z.string().min(1),
  SCALEWAY_BUCKET_NAME: z.string().min(1),
  SCALEWAY_REGION: z.string().min(1),
  SCALEWAY_ENDPOINT: z.url(),

  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.email(),
  ADMIN_NOTIFICATION_EMAIL: z.email(),
});

export const env = envSchema.parse(process.env);
