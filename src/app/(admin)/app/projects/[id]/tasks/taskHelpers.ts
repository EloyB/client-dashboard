import { parseDateOnly } from '@/lib/utils';
import type { EditableTask } from './TaskFormSheet';
import type { TaskRow } from './TasksTable';

/** Shared across the list, the desktop board, and the mobile board — a done task is never "overdue". */
export function isOverdue(task: Pick<TaskRow, 'dueDate' | 'status'>): boolean {
  const date = parseDateOnly(task.dueDate);
  if (!date || task.status === 'done') return false;
  return date < new Date(new Date().toDateString());
}

export function toEditableTask(task: TaskRow): EditableTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
  };
}
