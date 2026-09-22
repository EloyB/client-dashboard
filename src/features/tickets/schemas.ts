import { z } from 'zod';

import { priorityEnum } from '@/db/schema';

const MAX_ATTACHMENTS = 10;

// The form always shows a fixed "https://" prefix next to the input (see
// UrlField, reused from the project form), so the stored value either starts
// with it or is empty — never a bare domain.
const pageUrl = z
  .string()
  .trim()
  .refine((value) => !value || z.url().safeParse(value).success, 'Vul een geldige URL in.');

export const createTicketSchema = z.object({
  projectId: z.uuid('Kies een project.'),
  title: z.string().trim().min(1, 'Titel is verplicht.'),
  description: z.string().trim(),
  pageUrl,
  priority: z.enum(priorityEnum.enumValues),
  fileIds: z.array(z.uuid()).max(MAX_ATTACHMENTS, 'Maximaal 10 schermafbeeldingen per melding.'),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
