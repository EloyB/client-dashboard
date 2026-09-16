import { relations } from 'drizzle-orm';

import { account, session, user } from '@/db/schema/auth';
import { clients } from '@/db/schema/clients';
import { documents } from '@/db/schema/documents';
import { events } from '@/db/schema/events';
import { files } from '@/db/schema/files';
import { projects } from '@/db/schema/projects';
import { tasks } from '@/db/schema/tasks';
import { ticketAttachments } from '@/db/schema/ticket-attachments';
import { tickets } from '@/db/schema/tickets';

export const clientsRelations = relations(clients, ({ many }) => ({
  users: many(user),
  projects: many(projects),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  client: one(clients, {
    fields: [user.clientId],
    references: [clients.id],
  }),
  sessions: many(session),
  accounts: many(account),
  reportedTickets: many(tickets),
  uploadedFiles: many(files),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  tasks: many(tasks),
  tickets: many(tickets),
  events: many(events),
  documents: many(documents),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  ticket: one(tickets, {
    fields: [tasks.ticketId],
    references: [tickets.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  project: one(projects, {
    fields: [tickets.projectId],
    references: [projects.id],
  }),
  reportedBy: one(user, {
    fields: [tickets.reportedById],
    references: [user.id],
  }),
  tasks: many(tasks),
  attachments: many(ticketAttachments),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  project: one(projects, {
    fields: [events.projectId],
    references: [projects.id],
  }),
}));

export const filesRelations = relations(files, ({ one, many }) => ({
  uploadedBy: one(user, {
    fields: [files.uploadedById],
    references: [user.id],
  }),
  documents: many(documents),
  ticketAttachments: many(ticketAttachments),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
  file: one(files, {
    fields: [documents.fileId],
    references: [files.id],
  }),
}));

export const ticketAttachmentsRelations = relations(ticketAttachments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketAttachments.ticketId],
    references: [tickets.id],
  }),
  file: one(files, {
    fields: [ticketAttachments.fileId],
    references: [files.id],
  }),
}));
