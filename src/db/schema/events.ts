import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { eventTypeEnum } from '@/db/schema/enums';
import { projects } from '@/db/schema/projects';

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    type: eventTypeEnum('type').notNull().default('other'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    allDay: boolean('all_day').notNull().default(false),
    location: text('location'),
    visibleToClient: boolean('visible_to_client').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('events_project_id_idx').on(table.projectId),
    index('events_starts_at_idx').on(table.startsAt),
  ],
);
