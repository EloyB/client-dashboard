import { date, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { priorityEnum, taskStatusEnum } from '@/db/schema/enums';
import { projects } from '@/db/schema/projects';
import { tickets } from '@/db/schema/tickets';

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    status: taskStatusEnum('status').notNull().default('todo'),
    priority: priorityEnum('priority').notNull().default('medium'),
    position: text('position').notNull(),
    dueDate: date('due_date'),
    ticketId: uuid('ticket_id').references(() => tickets.id, { onDelete: 'set null' }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('tasks_project_id_idx').on(table.projectId),
    index('tasks_status_idx').on(table.status),
    index('tasks_ticket_id_idx').on(table.ticketId),
  ],
);
