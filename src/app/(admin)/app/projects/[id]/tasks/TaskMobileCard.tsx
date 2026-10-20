'use client';

import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { MoreHorizontal, Trash2 } from 'lucide-react';
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
import { StatusBadge } from '@/components/shared/StatusBadge';
import { showErrorToast, showSuccessToast } from '@/components/shared/toast';
import { deleteTask } from '@/features/tasks/actions';
import { cn, parseDateOnly } from '@/lib/utils';
import type { EditableTask } from './TaskFormSheet';
import { TaskStatusSelect } from './TaskStatusSelect';
import { isOverdue } from './taskHelpers';
import type { TaskRow } from './TasksTable';

function dueDateLabel(dueDate: string | null): string {
  const date = parseDateOnly(dueDate);
  return date ? format(date, 'd MMM', { locale: nl }) : 'Geen datum';
}

export function DeleteTaskMenu({ task }: { task: TaskRow }) {
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

/**
 * The task card shown on 375px — shared between the list's own mobile cards
 * (7a, one card per task regardless of status) and the mobile kanban board
 * (7c, one card per task within the active column only). Status changes via
 * the select, never drag-and-drop, on either screen.
 */
export function TaskMobileCard({
  task,
  onEditTask,
}: {
  task: TaskRow;
  onEditTask: (task: EditableTask) => void;
}) {
  return (
    <div
      className={cn(
        'border-border-subtle bg-card flex flex-col gap-2 rounded-xl border p-3',
        isOverdue(task) && 'border-l-destructive border-l-2',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() =>
            onEditTask({
              id: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate,
            })
          }
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
        <DeleteTaskMenu task={task} />
      </div>
    </div>
  );
}
