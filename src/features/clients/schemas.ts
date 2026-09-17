import { z } from 'zod';

// Lowercased so a stored address always matches Better Auth's own
// case-insensitive lookups (its internal adapter lowercases email before
// every query) — see src/lib/auth.ts's sendMagicLink hook for the other half
// of this normalization.
const email = z.email('Vul een geldig e-mailadres in.').trim().toLowerCase();

export const inviteClientUserSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  email,
  clientId: z.uuid('Kies een klant.'),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1, 'Naam is verplicht'),
  email,
});
