import { z } from 'zod';

export const uploadContexts = ['ticket_attachment', 'document'] as const;
export type UploadContext = (typeof uploadContexts)[number];

const MB = 1024 * 1024;

/** Per-context limits — used both to reject early (before upload) and to re-verify after (see confirmUpload). */
export const uploadLimits: Record<UploadContext, { mimeTypes: string[]; maxSizeBytes: number }> = {
  ticket_attachment: {
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxSizeBytes: 10 * MB,
  },
  document: {
    mimeTypes: [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    maxSizeBytes: 20 * MB,
  },
};

const uploadContext = z.enum(uploadContexts);

export const requestUploadSchema = z
  .object({
    projectId: z.uuid(),
    context: uploadContext,
    filename: z.string().trim().min(1, 'Bestandsnaam is verplicht.'),
    mimeType: z.string().trim().min(1),
    size: z.int().positive(),
  })
  .superRefine((data, ctx) => {
    const limits = uploadLimits[data.context];
    if (!limits.mimeTypes.includes(data.mimeType)) {
      ctx.addIssue({
        code: 'custom',
        path: ['mimeType'],
        message: 'Dit bestandstype is niet toegelaten.',
      });
    }
    if (data.size > limits.maxSizeBytes) {
      ctx.addIssue({
        code: 'custom',
        path: ['size'],
        message: `Bestand is te groot (max. ${limits.maxSizeBytes / MB} MB).`,
      });
    }
  });

export const confirmUploadSchema = z.object({
  projectId: z.uuid(),
  context: uploadContext,
  storageKey: z.string().trim().min(1),
  filename: z.string().trim().min(1, 'Bestandsnaam is verplicht.'),
});
