'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { cn, parseDateOnly } from '@/lib/utils';
import { isOverdue } from './taskHelpers';
import type { TaskRow } from './TasksTable';

function dueDateLabel(task: TaskRow): string | null {
  const date = parseDateOnly(task.dueDate);
  if (!date) return null;
  return isOverdue(task)
    ? `Vervallen sinds ${format(date, 'd MMM', { locale: nl })}`
    : `Vervalt ${format(date, 'd MMM', { locale: nl })}`;
}

/** One card body — shared between the real sortable card and the drag overlay's floating copy. */
export function KanbanCardContent({ task }: { task: TaskRow }) {
  const dueLabel = dueDateLabel(task);

  return (
    <div className="border-border bg-card flex flex-col gap-2 rounded-xl border p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-small text-muted-foreground font-mono">{task.reference}</span>
        <StatusBadge domain="priority" priority={task.priority} />
      </div>
      <p className="text-body font-medium">{task.title}</p>
      {(dueLabel || task.ticketReference) && (
        <div className="flex items-center justify-between gap-2">
          {dueLabel && (
            <span
              className={cn(
                'text-small',
                isOverdue(task) ? 'text-destructive font-semibold' : 'text-muted-foreground',
              )}
            >
              {dueLabel}
            </span>
          )}
          {task.ticketReference && (
            <span className="text-small text-muted-foreground font-mono">
              {task.ticketReference}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function KanbanCard({ task, onClick }: { task: TaskRow; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onClick}
      className={cn('block w-full text-left', isDragging && 'opacity-40')}
      {...attributes}
      {...listeners}
    >
      <KanbanCardContent task={task} />
    </button>
  );
}
