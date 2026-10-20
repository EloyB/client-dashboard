'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { DateField, SelectField, TextareaField, TextField } from '@/components/shared/FormFields';
import { FormSheet } from '@/components/shared/FormSheet';
import { showSuccessToast } from '@/components/shared/toast';
import type { Priority, TaskStatus } from '@/db/schema';
import { createTask, updateTask } from '@/features/tasks/actions';
import { taskFormSchema } from '@/features/tasks/schemas';
import { applyFormActionErrors } from '@/lib/form-action';
import { parseDateOnly } from '@/lib/utils';

type TaskFormInput = z.input<typeof taskFormSchema>;

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'Te doen' },
  { value: 'in_progress', label: 'Bezig' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Klaar' },
];

const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Laag' },
  { value: 'medium', label: 'Middel' },
  { value: 'high', label: 'Hoog' },
];

export type EditableTask = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
};

export function TaskFormSheet({
  projectId,
  projects,
  task,
  defaultStatus = 'todo',
  open,
  onOpenChange,
}: {
  /** Fixed project (project-detail context, 7a/7b/7c). */
  projectId?: string;
  /** Project picker instead, for "al mijn taken" (7e) — required whenever `projectId` is omitted. */
  projects?: { id: string; name: string }[];
  /** Present when editing an existing task; absent when creating one. */
  task?: EditableTask;
  /** Pre-fills status when creating from a specific kanban column (7b). Ignored when editing. */
  defaultStatus?: TaskStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const isEditing = Boolean(task);
  const showProjectPicker = !isEditing && !projectId;

  const defaultValues: TaskFormInput = {
    projectId: task?.projectId ?? projectId ?? '',
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? defaultStatus,
    priority: task?.priority ?? 'medium',
    dueDate: task ? parseDateOnly(task.dueDate) : undefined,
  };

  const { control, handleSubmit, formState, setError, reset } = useForm<TaskFormInput>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  });

  function handleOpenChange(next: boolean) {
    if (!next) reset(defaultValues);
    onOpenChange(next);
  }

  async function onSubmit(data: TaskFormInput) {
    const result = task ? await updateTask({ ...data, taskId: task.id }) : await createTask(data);

    if (!result.success) {
      applyFormActionErrors(setError, result);
      return;
    }

    showSuccessToast(isEditing ? 'Taak bijgewerkt' : 'Taak aangemaakt');
    router.refresh();
    onOpenChange(false);
    if (!isEditing) reset(defaultValues);
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={isEditing ? 'Taak bewerken' : 'Taak toevoegen'}
      primaryAction={
        <Button type="button" onClick={handleSubmit(onSubmit)} disabled={formState.isSubmitting}>
          {formState.isSubmitting ? (
            <Loader2 className="animate-spin" strokeWidth={1.75} />
          ) : (
            <Save strokeWidth={1.75} />
          )}
          Opslaan
        </Button>
      }
    >
      {showProjectPicker && (
        <SelectField
          control={control}
          name="projectId"
          label="Project"
          required
          options={(projects ?? []).map((project) => ({ value: project.id, label: project.name }))}
        />
      )}
      <TextField control={control} name="title" label="Titel" required />
      <TextareaField control={control} name="description" label="Beschrijving" rows={4} />
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          control={control}
          name="status"
          label="Status"
          required
          options={statusOptions}
        />
        <SelectField
          control={control}
          name="priority"
          label="Prioriteit"
          required
          options={priorityOptions}
        />
      </div>
      <DateField control={control} name="dueDate" label="Vervaldatum" />
    </FormSheet>
  );
}
