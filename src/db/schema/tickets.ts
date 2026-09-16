import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { user } from '@/db/schema/auth';
import { priorityEnum, ticketStatusEnum } from '@/db/schema/enums';
import { projects } from '@/db/schema/projects';

export const tickets = pgTable(
  'tickets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    reportedById: uuid('reported_by_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    description: text('description'),
    pageUrl: text('page_url'),
    status: ticketStatusEnum('status').notNull().default('new'),
    priority: priorityEnum('priority').notNull().default('medium'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('tickets_project_id_idx').on(table.projectId),
    index('tickets_reported_by_id_idx').on(table.reportedById),
    index('tickets_status_idx').on(table.status),
  ],
);
