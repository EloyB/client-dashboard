import { addDays, format } from 'date-fns';

import { parseDateOnly } from '@/lib/utils';

export const DEADLINE_GROUPS = ['overdue', 'today', 'thisWeek', 'later', 'noDeadline'] as const;
export type DeadlineGroup = (typeof DEADLINE_GROUPS)[number];

export const deadlineGroupLabels: Record<DeadlineGroup, string> = {
  overdue: 'Achterstallig',
  today: 'Vandaag',
  thisWeek: 'Deze week',
  later: 'Later',
  noDeadline: 'Geen deadline',
};

/** The coming Sunday's date (today itself, if today already is a Sunday) — ma–zo weeks, per nl-BE convention. */
function endOfWeek(today: string): string {
  const date = parseDateOnly(today)!;
  const daysUntilSunday = date.getDay() === 0 ? 0 : 7 - date.getDay();
  return format(addDays(date, daysUntilSunday), 'yyyy-MM-dd');
}

/**
 * Pure and independently testable (see 7e's note on timezone edge cases):
 * `today` is passed in rather than computed here, so callers control it —
 * production code passes `todayInBrussels()`, tests pass a fixed string.
 */
export function deadlineGroupFor(dueDate: string | null, today: string): DeadlineGroup {
  if (!dueDate) return 'noDeadline';
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  if (dueDate <= endOfWeek(today)) return 'thisWeek';
  return 'later';
}

export function groupTasksByDeadline<T extends { dueDate: string | null }>(
  tasks: T[],
  today: string,
): Record<DeadlineGroup, T[]> {
  const groups: Record<DeadlineGroup, T[]> = {
    overdue: [],
    today: [],
    thisWeek: [],
    later: [],
    noDeadline: [],
  };
  for (const task of tasks) {
    groups[deadlineGroupFor(task.dueDate, today)].push(task);
  }
  return groups;
}
