import { z } from 'zod';

import { documentTypeEnum } from '@/db/schema';

export const createDocumentSchema = z.object({
  projectId: z.uuid(),
  fileId: z.uuid(),
  title: z.string().trim().min(1, 'Titel is verplicht.'),
  type: z.enum(documentTypeEnum.enumValues),
  visibleToClient: z.boolean(),
});

export const updateDocumentVisibilitySchema = z.object({
  documentId: z.uuid(),
  visibleToClient: z.boolean(),
});

export const deleteDocumentSchema = z.object({
  documentId: z.uuid(),
});
