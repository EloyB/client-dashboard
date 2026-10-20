import { z } from 'zod';

import { priorityEnum, taskStatusEnum } from '@/db/schema';

export const taskFormSchema = z.object({
  projectId: z.uuid(),
  title: z.string().trim().min(1, 'Titel is verplicht.'),
  description: z.string().trim(),
  status: z.enum(taskStatusEnum.enumValues),
  priority: z.enum(priorityEnum.enumValues),
  dueDate: z.date().optional(),
});

export const createTaskSchema = taskFormSchema;

export const updateTaskSchema = taskFormSchema.and(z.object({ taskId: z.uuid() }));

export const updateTaskStatusSchema = z.object({
  taskId: z.uuid(),
  status: z.enum(taskStatusEnum.enumValues),
});

export const deleteTaskSchema = z.object({ taskId: z.uuid() });
