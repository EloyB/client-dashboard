'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { taskStatusConfig } from '@/components/shared/StatusBadge';
import type { TaskStatus } from '@/db/schema';
import { cn } from '@/lib/utils';
import { KanbanCard } from './KanbanCard';
import type { TaskRow } from './TasksTable';

const dotClassName: Record<TaskStatus, string> = {
  todo: 'bg-neutral-400',
  in_progress: 'bg-accent-foreground',
  review: 'bg-warning-solid',
  done: 'bg-success',
};

export function KanbanColumn({
  status,
  tasks,
  onEditTask,
  onAddTask,
}: {
  status: TaskStatus;
  tasks: TaskRow[];
  onEditTask: (task: TaskRow) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="bg-card border-border flex w-72 shrink-0 flex-col gap-3 rounded-xl border p-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className={cn('size-2 rounded-full', dotClassName[status])} />
          <span className="font-semibold">{taskStatusConfig[status].label}</span>
          <span className="text-muted-foreground">{tasks.length}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Taak toevoegen in ${taskStatusConfig[status].label}`}
          onClick={() => onAddTask(status)}
        >
          <Plus strokeWidth={1.75} />
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-20 flex-1 flex-col gap-2 rounded-lg p-1',
          isOver && 'bg-accent/40',
        )}
      >
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={() => onEditTask(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
