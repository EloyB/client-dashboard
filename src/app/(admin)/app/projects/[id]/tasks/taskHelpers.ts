import { todayInBrussels } from '@/lib/utils';
import type { TaskRow } from './TasksTable';

/**
 * Shared across the list, both boards, and "al mijn taken" (7e) — a done
 * task is never "overdue". Compares plain date strings (both already
 * 'yyyy-MM-dd') against Europe/Brussels' own today, not the server's local
 * date — the two can disagree right around midnight.
 */
export function isOverdue(task: Pick<TaskRow, 'dueDate' | 'status'>): boolean {
  if (!task.dueDate || task.status === 'done') return false;
  return task.dueDate < todayInBrussels();
}
