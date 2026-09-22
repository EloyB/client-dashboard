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

// Kept as plain strings (never transformed to undefined) so the schema's
// input and output shapes match exactly — react-hook-form's Control type
// needs that symmetry. Empty optional fields are converted to null right
// before the database call instead (see toNullable in actions.ts).

// Only Belgian numbers (recognized by the "BE" prefix) are format-checked —
// a foreign client's VAT number is accepted as-is, per CLAUDE.md's "not too
// strict for foreign clients".
const vatNumber = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) return true;
    const normalized = value.replace(/[\s.]/g, '').toUpperCase();
    if (!normalized.startsWith('BE')) return true;
    return /^BE\d{10}$/.test(normalized);
  }, 'Een Belgisch btw-nummer heeft tien cijfers, bijvoorbeeld BE 0652.874.109.');

const phone = z
  .string()
  .trim()
  .refine(
    (value) => !value || /^[0-9+()./\s-]{6,20}$/.test(value),
    'Vul een geldig telefoonnummer in.',
  );

export const clientFormSchema = z.object({
  name: z.string().trim().min(1, 'Bedrijfsnaam is verplicht'),
  email,
  vatNumber,
  phone,
  address: z.string().trim(),
  notes: z.string().trim(),
});

export const updateClientSchema = clientFormSchema.extend({
  clientId: z.uuid(),
});
