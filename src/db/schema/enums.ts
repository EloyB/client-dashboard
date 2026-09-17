import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'client']);

export const projectStatusEnum = pgEnum('project_status', [
  'planned',
  'active',
  'maintenance',
  'completed',
  'archived',
]);

export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'review', 'done']);

export const ticketStatusEnum = pgEnum('ticket_status', [
  'new',
  'in_progress',
  'resolved',
  'closed',
]);

export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);

export const eventTypeEnum = pgEnum('event_type', ['deadline', 'meeting', 'milestone', 'other']);

export const documentTypeEnum = pgEnum('document_type', ['invoice', 'quote', 'contract', 'other']);

export const activityTypeEnum = pgEnum('activity_type', [
  'ticket_created',
  'ticket_status_changed',
  'ticket_priority_changed',
  'ticket_comment_added',
  'task_status_changed',
  'document_added',
]);

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type ProjectStatus = (typeof projectStatusEnum.enumValues)[number];
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type TicketStatus = (typeof ticketStatusEnum.enumValues)[number];
export type Priority = (typeof priorityEnum.enumValues)[number];
export type EventType = (typeof eventTypeEnum.enumValues)[number];
export type DocumentType = (typeof documentTypeEnum.enumValues)[number];
export type ActivityType = (typeof activityTypeEnum.enumValues)[number];
