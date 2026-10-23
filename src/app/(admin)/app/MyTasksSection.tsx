import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { headers } from 'next/headers';
import Link from 'next/link';

import { EmptyState } from '@/components/shared/EmptyState';
import { ListRow } from '@/components/shared/ListRow';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  DASHBOARD_TASK_GROUPS,
  dashboardTaskGroupLabels,
  groupTasksForDashboard,
} from '@/features/tasks/grouping';
import { listTasksForDashboard, type DashboardTaskRow } from '@/features/tasks/queries';
import { cn, formatDateOnly, parseDateOnly, todayInBrussels } from '@/lib/utils';
import { DashboardSectionCard } from './DashboardSectionCard';

function dueDateLabel(dueDate: string | null, today: string): string | null {
  if (!dueDate) return null;
  if (dueDate < today) {
    const days = differenceInCalendarDays(parseDateOnly(today)!, parseDateOnly(dueDate)!);
    return `${days} ${days === 1 ? 'dag' : 'dagen'} te laat`;
  }
  if (dueDate === today) return 'vandaag';
  if (dueDate === formatDateOnly(addDays(parseDateOnly(today)!, 1))) return 'morgen';
  return format(parseDateOnly(dueDate)!, 'EEE d MMM', { locale: nl });
}

function TaskRow({ task, today }: { task: DashboardTaskRow; today: string }) {
  const overdue = task.dueDate !== null && task.dueDate < today;
  const label = dueDateLabel(task.dueDate, today);

  return (
    <ListRow
      title={
        <Link
          href={`/app/projects/${task.projectId}/tasks?view=board`}
          className={cn('hover:underline', overdue && 'text-destructive')}
        >
          {task.title}
        </Link>
      }
      subtitle={`${task.projectName} · ${task.reference}`}
      trailing={
        <div className="flex items-center gap-3">
          <StatusBadge domain="priority" priority={task.priority} />
          {label && (
            <span
              className={cn(
                'text-small shrink-0',
                overdue ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          )}
        </div>
      }
      className="border-border-subtle border-b py-2.5 last:border-0"
    />
  );
}

export async function MyTasksSection() {
  const today = todayInBrussels();
  const tasks = await listTasksForDashboard(await headers(), today);
  const groups = groupTasksForDashboard(tasks, today);
  const total = DASHBOARD_TASK_GROUPS.reduce((sum, group) => sum + groups[group].length, 0);

  return (
    <DashboardSectionCard title="Mijn taken" actionLabel="Naar takenbord" actionHref="/app/board">
      {total === 0 ? (
        <EmptyState
          variant="positive"
          title="Niets dringends"
          description="Achterstallige, deze week vervallende en lopende taken verschijnen hier."
        />
      ) : (
        DASHBOARD_TASK_GROUPS.map((group) =>
          groups[group].length === 0 ? null : (
            <div key={group} className="flex flex-col">
              <p className="text-small text-muted-foreground px-0 pt-3 pb-1 font-semibold uppercase">
                {dashboardTaskGroupLabels[group]}
              </p>
              {groups[group].map((task) => (
                <TaskRow key={task.id} task={task} today={today} />
              ))}
            </div>
          ),
        )
      )}
    </DashboardSectionCard>
  );
}
