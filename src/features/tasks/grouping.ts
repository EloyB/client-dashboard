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
export function endOfWeek(today: string): string {
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

export const DASHBOARD_TASK_GROUPS = ['overdue', 'inProgress', 'thisWeek'] as const;
export type DashboardTaskGroup = (typeof DASHBOARD_TASK_GROUPS)[number];

export const dashboardTaskGroupLabels: Record<DashboardTaskGroup, string> = {
  overdue: 'Te laat',
  inProgress: 'In uitvoering',
  thisWeek: 'Deze week',
};

/**
 * For the admin home page (9a): "achterstallig of deze week, plus taken in
 * in_progress" — each task lands in exactly one bucket, by precedence
 * (overdue beats in_progress beats merely being due this week), so a task
 * that's both overdue and in progress still reads as the more urgent signal.
 * `today` also counts as "this week" here — the home page has no separate
 * "today" bucket like the full task groups above.
 */
export function groupTasksForDashboard<T extends { dueDate: string | null; status: string }>(
  tasks: T[],
  today: string,
): Record<DashboardTaskGroup, T[]> {
  const groups: Record<DashboardTaskGroup, T[]> = { overdue: [], inProgress: [], thisWeek: [] };
  for (const task of tasks) {
    if (task.status === 'done') continue;
    const deadlineGroup = deadlineGroupFor(task.dueDate, today);
    if (deadlineGroup === 'overdue') groups.overdue.push(task);
    else if (task.status === 'in_progress') groups.inProgress.push(task);
    else if (deadlineGroup === 'today' || deadlineGroup === 'thisWeek') groups.thisWeek.push(task);
  }
  return groups;
}
