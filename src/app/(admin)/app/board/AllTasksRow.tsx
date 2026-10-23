'use client';

import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { TaskStatusSelect } from '@/app/(admin)/app/projects/[id]/tasks/TaskStatusSelect';
import { isOverdue } from '@/app/(admin)/app/projects/[id]/tasks/taskHelpers';
import type { EditableTask } from '@/app/(admin)/app/projects/[id]/tasks/TaskFormSheet';
import type { AllTasksRow as AllTasksRowData } from '@/features/tasks/queries';
import { cn, parseDateOnly } from '@/lib/utils';

const priorityDot: Record<string, string> = {
  low: 'bg-neutral-400',
  medium: 'bg-warning-solid',
  high: 'bg-destructive',
};

function dueDateLabel(task: AllTasksRowData): string {
  const date = parseDateOnly(task.dueDate);
  if (!date) return 'Geen datum';
  const formatted = format(date, 'd MMM', { locale: nl });
  return isOverdue(task) ? `Te laat · ${formatted}` : formatted;
}

export function AllTasksRow({
  task,
  onEditTask,
}: {
  task: AllTasksRowData;
  onEditTask: (task: EditableTask) => void;
}) {
  return (
    <div
      data-testid={`task-row-${task.id}`}
      className="border-border-subtle flex flex-col gap-2 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2.5">
        <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', priorityDot[task.priority])} />
        <button
          type="button"
          onClick={() =>
            onEditTask({
              id: task.id,
              projectId: task.projectId,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate,
            })
          }
          className="text-left"
        >
          <p
            className={cn(
              'font-medium',
              task.status === 'done' && 'text-muted-foreground line-through',
            )}
          >
            {task.title}
          </p>
          <p className="text-small text-muted-foreground">
            {task.clientName} · {task.projectName} · {task.reference}
          </p>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 pl-4 sm:pl-0">
        <TaskStatusSelect taskId={task.id} status={task.status} />
        <StatusBadge domain="priority" priority={task.priority} />
        <span
          className={cn(
            'text-small whitespace-nowrap',
            isOverdue(task) ? 'text-destructive font-semibold' : 'text-muted-foreground',
          )}
        >
          {dueDateLabel(task)}
        </span>
        {task.ticketReference && (
          <span className="text-small text-muted-foreground font-mono">{task.ticketReference}</span>
        )}
      </div>
    </div>
  );
}
