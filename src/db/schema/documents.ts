import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { documentTypeEnum } from '@/db/schema/enums';
import { files } from '@/db/schema/files';
import { projects } from '@/db/schema/projects';

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    fileId: uuid('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    type: documentTypeEnum('type').notNull().default('other'),
    visibleToClient: boolean('visible_to_client').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('documents_project_id_idx').on(table.projectId),
    index('documents_file_id_idx').on(table.fileId),
  ],
);
