'use client';

import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge, taskStatusConfig } from '@/components/shared/StatusBadge';
import { showErrorToast, showSuccessToast } from '@/components/shared/toast';
import type { Priority, TaskStatus } from '@/db/schema';
import { deleteTask } from '@/features/tasks/actions';
import { cn, parseDateOnly } from '@/lib/utils';
import type { EditableTask } from './TaskFormSheet';
import { TaskStatusSelect } from './TaskStatusSelect';

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  reference: string;
  ticketReference: string | null;
};

const priorityLabels: Record<Priority, string> = { low: 'Laag', medium: 'Middel', high: 'Hoog' };
const statusOrder: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

function dueDateLabel(dueDate: string | null): string {
  const date = parseDateOnly(dueDate);
  return date ? format(date, 'd MMM', { locale: nl }) : 'Geen datum';
}

function isOverdue(task: TaskRow): boolean {
  const date = parseDateOnly(task.dueDate);
  if (!date || task.status === 'done') return false;
  return date < new Date(new Date().toDateString());
}

function toEditableTask(task: TaskRow): EditableTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
  };
}

function TaskRowActions({
  task,
  onEditTask,
}: {
  task: TaskRow;
  onEditTask: (task: EditableTask) => void;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteTask({ taskId: task.id });
      if (!result.success) {
        showErrorToast('Verwijderen mislukt', result.formError);
        return;
      }
      showSuccessToast('Taak verwijderd');
      setConfirmOpen(false);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Meer acties">
            <MoreHorizontal strokeWidth={1.75} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEditTask(toEditableTask(task))}>
            <Pencil strokeWidth={1.75} />
            Bewerken
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
            <Trash2 strokeWidth={1.75} />
            Verwijderen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Taak verwijderen?"
        description={`${task.title} wordt definitief verwijderd.`}
        confirmLabel={isDeleting ? 'Bezig...' : 'Verwijderen'}
        confirmIcon={Trash2}
        variant="destructive"
        confirmationText={task.title}
        onConfirm={handleDelete}
      />
    </>
  );
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
            onClick={() => onEditTask(toEditableTask(task))}
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
      cell: (task) => <span className="text-muted-foreground">{task.ticketReference ?? '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      cell: (task) => <TaskRowActions task={task} onEditTask={onEditTask} />,
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
        renderMobileCard={(task) => (
          <div
            className={cn(
              'border-border-subtle bg-card flex flex-col gap-2 rounded-xl border p-3',
              isOverdue(task) && 'border-l-destructive border-l-2',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => onEditTask(toEditableTask(task))}
                className="flex flex-col gap-0.5 text-left"
              >
                <span
                  className={cn(
                    'font-medium',
                    task.status === 'done' && 'text-muted-foreground line-through',
                  )}
                >
                  {task.title}
                </span>
                <span className="text-small text-muted-foreground font-mono">{task.reference}</span>
              </button>
              <StatusBadge domain="priority" priority={task.priority} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  'text-small text-muted-foreground',
                  isOverdue(task) && 'text-destructive font-semibold',
                )}
              >
                {dueDateLabel(task.dueDate)}
              </span>
              {task.ticketReference && (
                <span className="text-small text-muted-foreground">{task.ticketReference}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <TaskStatusSelect taskId={task.id} status={task.status} />
              </div>
              <TaskRowActions task={task} onEditTask={onEditTask} />
            </div>
          </div>
        )}
      />
    </div>
  );
}
