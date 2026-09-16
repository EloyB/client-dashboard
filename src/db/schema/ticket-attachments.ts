import { index, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';

import { files } from '@/db/schema/files';
import { tickets } from '@/db/schema/tickets';

export const ticketAttachments = pgTable(
  'ticket_attachments',
  {
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => tickets.id, { onDelete: 'cascade' }),
    fileId: uuid('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'restrict' }),
  },
  (table) => [
    primaryKey({ columns: [table.ticketId, table.fileId] }),
    index('ticket_attachments_file_id_idx').on(table.fileId),
  ],
);
