import { date, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { clients } from '@/db/schema/clients';
import { projectStatusEnum } from '@/db/schema/enums';

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    websiteUrl: text('website_url'),
    status: projectStatusEnum('status').notNull().default('planned'),
    startDate: date('start_date'),
    dueDate: date('due_date'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('projects_client_id_idx').on(table.clientId),
    index('projects_status_idx').on(table.status),
  ],
);
