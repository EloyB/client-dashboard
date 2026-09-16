import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { user } from '@/db/schema/auth';

export const files = pgTable(
  'files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storageKey: text('storage_key').notNull().unique(),
    filename: text('filename').notNull(),
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull(),
    uploadedById: uuid('uploaded_by_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('files_uploaded_by_id_idx').on(table.uploadedById)],
);
