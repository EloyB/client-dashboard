'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { taskStatusConfig } from '@/components/shared/StatusBadge';
import { showErrorToast, showSuccessToast } from '@/components/shared/toast';
import type { TaskStatus } from '@/db/schema';
import { updateTaskStatus } from '@/features/tasks/actions';
import { cn } from '@/lib/utils';

const statusOrder: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

/** Statusselect gekleurd naar de status (see COMPONENTS.md) — the takenlijst's quick inline status change. */
export function TaskStatusSelect({ taskId, status }: { taskId: string; status: TaskStatus }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: string) {
    const nextStatus = next as TaskStatus;
    const previous = value;
    setValue(nextStatus);
    startTransition(async () => {
      const result = await updateTaskStatus({ taskId, status: nextStatus });
      if (!result.success) {
        setValue(previous);
        showErrorToast('Status wijzigen mislukt', result.formError);
        return;
      }
      showSuccessToast('Status bijgewerkt');
      router.refresh();
    });
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger
        className={cn(
          'h-9 w-full border-transparent font-semibold sm:h-[34px] sm:w-36',
          taskStatusConfig[value].className,
        )}
        aria-label="Status"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusOrder.map((option) => (
          <SelectItem key={option} value={option}>
            {taskStatusConfig[option].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
