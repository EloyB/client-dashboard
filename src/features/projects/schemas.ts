import { z } from 'zod';

import { projectStatusEnum } from '@/db/schema';

// The form always shows a fixed "https://" prefix next to the input (see
// ProjectForm's UrlField), so the stored value either starts with it or is
// empty — never a bare domain.
const websiteUrl = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) return true;
    return z.url().safeParse(value).success;
  }, 'Vul een geldige website-URL in.');

export const statusesRequiringDueDate = ['planned', 'active'] as const;
const statusesRequiringDueDateSet: Set<string> = new Set(statusesRequiringDueDate);

export const projectFormSchema = z
  .object({
    clientId: z.uuid('Kies een klant.'),
    name: z.string().trim().min(1, 'Projectnaam is verplicht'),
    description: z.string().trim(),
    websiteUrl,
    status: z.enum(projectStatusEnum.enumValues),
    startDate: z.date().optional(),
    dueDate: z.date().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.startDate) {
      ctx.addIssue({ code: 'custom', path: ['startDate'], message: 'Startdatum is verplicht.' });
    }
    if (!data.dueDate && statusesRequiringDueDateSet.has(data.status)) {
      ctx.addIssue({
        code: 'custom',
        path: ['dueDate'],
        message: 'Verplicht bij een gepland of actief project.',
      });
    }
    if (data.startDate && data.dueDate && data.dueDate < data.startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['dueDate'],
        message: 'Opleverdatum moet na de startdatum liggen.',
      });
    }
  });

export const updateProjectSchema = projectFormSchema.and(z.object({ projectId: z.uuid() }));
