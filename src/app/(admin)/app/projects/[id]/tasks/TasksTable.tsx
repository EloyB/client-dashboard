'use client';

import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import Link from 'next/link';

import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge, taskStatusConfig } from '@/components/shared/StatusBadge';
import type { Priority, TaskStatus } from '@/db/schema';
import { cn, parseDateOnly } from '@/lib/utils';
import { DeleteTaskMenu, TaskMobileCard } from './TaskMobileCard';
import type { EditableTask } from './TaskFormSheet';
import { TaskStatusSelect } from './TaskStatusSelect';
import { isOverdue } from './taskHelpers';

export type TaskRow = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  reference: string;
  ticketId: string | null;
  ticketReference: string | null;
};

const priorityLabels: Record<Priority, string> = { low: 'Laag', medium: 'Middel', high: 'Hoog' };
const statusOrder: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

function dueDateLabel(dueDate: string | null): string {
  const date = parseDateOnly(dueDate);
  return date ? format(date, 'd MMM', { locale: nl }) : 'Geen datum';
}

export function TasksTable({
  tasks,
  onEditTask,
}: {
  tasks: TaskRow[];
  onEditTask: (task: EditableTask) => void;
}) {
  const openCount = tasks.filter((task) => task.status !== 'done').length;

  const columns: DataTableColumn<TaskRow>[] = [
    {
      key: 'title',
      header: 'Taak',
      sortValue: (task) => task.title.toLowerCase(),
      cell: (task) => (
        <div className="flex flex-col gap-0.5">
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
            className={cn(
              'text-left font-medium underline-offset-2 hover:underline',
              task.status === 'done' && 'text-muted-foreground line-through',
            )}
          >
            {task.title}
          </button>
          <p className="text-small text-muted-foreground font-mono">{task.reference}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (task) => <TaskStatusSelect taskId={task.id} status={task.status} />,
    },
    {
      key: 'priority',
      header: 'Prioriteit',
      sortValue: (task) => priorityLabels[task.priority],
      cell: (task) => <StatusBadge domain="priority" priority={task.priority} />,
    },
    {
      key: 'dueDate',
      header: 'Vervaldatum',
      sortValue: (task) => task.dueDate ?? '',
      cell: (task) => (
        <span className={cn(isOverdue(task) && 'text-destructive font-semibold')}>
          {dueDateLabel(task.dueDate)}
        </span>
      ),
    },
    {
      key: 'ticket',
      header: 'Ticket',
      cell: (task) =>
        task.ticketId ? (
          <Link
            href={`/app/tickets/${task.ticketId}`}
            className="text-primary font-mono underline"
            onClick={(event) => event.stopPropagation()}
          >
            {task.ticketReference}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      cell: (task) => <DeleteTaskMenu task={task} />,
    },
  ];

  const filters: DataTableFilter<TaskRow>[] = [
    {
      key: 'status',
      label: 'Status',
      getValue: (task) => task.status,
      options: [
        { value: 'all', label: 'Alle' },
        ...statusOrder.map((status) => ({ value: status, label: taskStatusConfig[status].label })),
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-small text-muted-foreground">
        {openCount} openstaand van {tasks.length}
      </p>
      <DataTable
        columns={columns}
        rows={tasks}
        getRowKey={(task) => task.id}
        filters={filters}
        emptyState={
          <EmptyState
            variant="filtered"
            title="Geen taken met deze filters"
            description="Pas de filters aan om meer resultaten te zien."
          />
        }
        renderMobileCard={(task) => <TaskMobileCard task={task} onEditTask={onEditTask} />}
      />
    </div>
  );
}
