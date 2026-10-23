'use client';

import { Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { taskStatusConfig } from '@/components/shared/StatusBadge';
import type { TaskStatus } from '@/db/schema';
import { Pill } from '@/components/shared/Pill';
import { TaskMobileCard } from './TaskMobileCard';
import type { EditableTask } from './TaskFormSheet';
import type { TaskRow } from './TasksTable';

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

function isTaskStatus(value: string | null): value is TaskStatus {
  return (STATUS_ORDER as string[]).includes(value ?? '');
}

/**
 * The 375px kanban: one column at a time with a pill switcher instead of
 * side-by-side columns (see CLAUDE.md's "Complex views get a dedicated
 * mobile layout" rule) — status changes via TaskMobileCard's own select,
 * never drag-and-drop. Reuses the exact same card as the list view (7a)
 * rather than a separate mobile card design.
 */
export function MobileKanbanBoard({
  tasks,
  onEditTask,
  onAddTask,
}: {
  tasks: TaskRow[];
  onEditTask: (task: EditableTask) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeStatus: TaskStatus = isTaskStatus(searchParams.get('status'))
    ? (searchParams.get('status') as TaskStatus)
    : 'todo';

  function setActiveStatus(status: TaskStatus) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', status);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const tasksByStatus = STATUS_ORDER.reduce(
    (groups, status) => {
      groups[status] = tasks.filter((task) => task.status === status);
      return groups;
    },
    {} as Record<TaskStatus, TaskRow[]>,
  );
  const activeTasks = tasksByStatus[activeStatus];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 flex-wrap gap-2">
          {STATUS_ORDER.map((status) => (
            <Pill
              key={status}
              label={taskStatusConfig[status].label}
              count={tasksByStatus[status].length}
              active={status === activeStatus}
              onClick={() => setActiveStatus(status)}
            />
          ))}
        </div>
        <Button
          size="icon"
          className="size-11 shrink-0"
          aria-label={`Taak toevoegen in ${taskStatusConfig[activeStatus].label}`}
          onClick={() => onAddTask(activeStatus)}
        >
          <Plus strokeWidth={1.75} />
        </Button>
      </div>

      {activeTasks.length === 0 ? (
        <EmptyState
          variant="neutral"
          title="Geen taken in deze kolom"
          description="Verplaats een taak hierheen, of maak er hier een aan."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {activeTasks.map((task) => (
            <TaskMobileCard key={task.id} task={task} onEditTask={onEditTask} />
          ))}
        </div>
      )}
    </div>
  );
}
