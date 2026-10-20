'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  DateField,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from '@/components/shared/FormFields';
import { FormSheet } from '@/components/shared/FormSheet';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Priority, TaskStatus, TicketStatus } from '@/db/schema';
import { convertTicketToTask } from '@/features/tasks/actions';
import { convertTicketToTaskFormSchema } from '@/features/tasks/schemas';
import { applyFormActionErrors } from '@/lib/form-action';
import { taskReference } from '@/lib/task-links';

type FormInput = z.input<typeof convertTicketToTaskFormSchema>;

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

type ConvertedTask = { id: string; title: string; status: TaskStatus };

export function ConvertToTaskSheet({
  ticket,
  open,
  onOpenChange,
}: {
  ticket: {
    id: string;
    reference: string;
    title: string;
    description: string | null;
    priority: Priority;
    status: TicketStatus;
    projectId: string;
    projectName: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [convertedTask, setConvertedTask] = useState<ConvertedTask | null>(null);

  const defaultValues: FormInput = {
    title: ticket.title,
    description: ticket.description
      ? `Uit melding ${ticket.reference}: ${ticket.description}`
      : `Uit melding ${ticket.reference}`,
    status: 'in_progress',
    priority: ticket.priority,
    dueDate: undefined,
    setTicketInProgress: ticket.status !== 'in_progress',
  };

  const { control, handleSubmit, formState, setError, reset } = useForm<FormInput>({
    resolver: zodResolver(convertTicketToTaskFormSchema),
    defaultValues,
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setConvertedTask(null);
      reset(defaultValues);
    }
    onOpenChange(next);
  }

  async function onSubmit(data: FormInput) {
    const result = await convertTicketToTask({ ...data, ticketId: ticket.id });
    if (!result.success) {
      applyFormActionErrors(setError, result);
      return;
    }
    setConvertedTask(result.data);
    router.refresh();
  }

  if (convertedTask) {
    return (
      <FormSheet
        open={open}
        onOpenChange={handleOpenChange}
        title="Taak aangemaakt"
        cancelLabel="Bij ticket blijven"
        primaryAction={
          <Button type="button" asChild>
            <Link
              href={`/app/projects/${ticket.projectId}/tasks?view=board&status=${convertedTask.status}`}
            >
              <ArrowRight strokeWidth={1.75} />
              Naar de taak
            </Link>
          </Button>
        }
      >
        <div className="border-border bg-muted/40 flex items-center gap-3 rounded-lg border p-3">
          <div className="flex-1">
            <p className="text-body font-medium">{taskReference(convertedTask.id)} aangemaakt</p>
            <p className="text-small text-muted-foreground">
              De taak staat in de kolom{' '}
              {statusOptions.find((o) => o.value === convertedTask.status)?.label} van{' '}
              {ticket.projectName} en is gekoppeld aan dit ticket.
            </p>
          </div>
          <StatusBadge domain="task" status={convertedTask.status} />
        </div>
      </FormSheet>
    );
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Omzetten naar taak"
      description={`Uit ${ticket.reference} · ${ticket.projectName}`}
      primaryAction={
        <Button type="button" onClick={handleSubmit(onSubmit)} disabled={formState.isSubmitting}>
          {formState.isSubmitting ? (
            <Loader2 className="animate-spin" strokeWidth={1.75} />
          ) : (
            <Save strokeWidth={1.75} />
          )}
          Taak aanmaken
        </Button>
      }
    >
      <p className="text-small text-muted-foreground">
        Titel en omschrijving komen uit het ticket. Pas ze aan naar iets waar u zelf mee verder
        kunt; de klant ziet deze taak niet.
      </p>
      <TextField control={control} name="title" label="Titel" required />
      <TextareaField control={control} name="description" label="Omschrijving" rows={5} />
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
      <div className="border-border-subtle border-t pt-3">
        <SwitchField
          control={control}
          name="setTicketInProgress"
          label='Ticket op "In behandeling" zetten'
          hint="De klant ziet dat er aan gewerkt wordt."
        />
      </div>
    </FormSheet>
  );
}
