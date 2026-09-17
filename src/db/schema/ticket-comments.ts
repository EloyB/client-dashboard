import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { user } from '@/db/schema/auth';
import { tickets } from '@/db/schema/tickets';

export const ticketComments = pgTable(
  'ticket_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => tickets.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('ticket_comments_ticket_id_idx').on(table.ticketId),
    index('ticket_comments_author_id_idx').on(table.authorId),
  ],
);
