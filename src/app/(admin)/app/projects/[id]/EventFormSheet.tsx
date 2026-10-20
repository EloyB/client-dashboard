'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  DateTimeField,
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
} from '@/components/shared/FormFields';
import { FormSheet } from '@/components/shared/FormSheet';
import { showSuccessToast } from '@/components/shared/toast';
import type { EventType } from '@/db/schema';
import { createEvent, updateEvent } from '@/features/events/actions';
import { eventFormSchema } from '@/features/events/schemas';
import { applyFormActionErrors } from '@/lib/form-action';
import { parseDateOnly, splitBrusselsDateTime } from '@/lib/utils';

type EventFormInput = z.input<typeof eventFormSchema>;

const typeOptions: { value: EventType; label: string }[] = [
  { value: 'deadline', label: 'Deadline' },
  { value: 'meeting', label: 'Overleg' },
  { value: 'milestone', label: 'Mijlpaal' },
  { value: 'other', label: 'Andere' },
];

export type EditableEvent = {
  id: string;
  title: string;
  description: string | null;
  type: EventType;
  allDay: boolean;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  visibleToClient: boolean;
};

function defaultValuesFor(projectId: string, event?: EditableEvent): EventFormInput {
  if (!event) {
    return {
      projectId,
      title: '',
      description: '',
      type: 'meeting',
      allDay: false,
      startDate: undefined as unknown as Date,
      startTime: '',
      endDate: undefined,
      endTime: undefined,
      location: '',
      visibleToClient: true,
    };
  }

  const start = splitBrusselsDateTime(event.startsAt);
  const end = event.endsAt ? splitBrusselsDateTime(event.endsAt) : null;

  return {
    projectId,
    title: event.title,
    description: event.description ?? '',
    type: event.type,
    allDay: event.allDay,
    startDate: parseDateOnly(start.dateOnly)!,
    startTime: start.time,
    endDate: end ? parseDateOnly(end.dateOnly) : undefined,
    endTime: end?.time,
    location: event.location ?? '',
    visibleToClient: event.visibleToClient,
  };
}

export function EventFormSheet({
  projectId,
  event,
  open,
  onOpenChange,
}: {
  projectId: string;
  /** Present when editing an existing event; absent when creating one. */
  event?: EditableEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const isEditing = Boolean(event);
  const defaultValues = defaultValuesFor(projectId, event);

  const { control, handleSubmit, formState, setError, reset } = useForm<EventFormInput>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
  });

  const allDay = useWatch({ control, name: 'allDay' });

  function handleOpenChange(next: boolean) {
    if (!next) reset(defaultValues);
    onOpenChange(next);
  }

  async function onSubmit(data: EventFormInput) {
    const result = event
      ? await updateEvent({ ...data, eventId: event.id })
      : await createEvent(data);

    if (!result.success) {
      applyFormActionErrors(setError, result);
      return;
    }

    showSuccessToast(isEditing ? 'Agenda-item bijgewerkt' : 'Agenda-item aangemaakt');
    router.refresh();
    onOpenChange(false);
    if (!isEditing) reset(defaultValues);
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={isEditing ? 'Agenda-item bewerken' : 'Agenda-item toevoegen'}
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
      <TextField control={control} name="title" label="Titel" required />
      <TextareaField control={control} name="description" label="Beschrijving" rows={3} />
      <SelectField control={control} name="type" label="Type" required options={typeOptions} />

      <div className="border-border-subtle border-t pt-3">
        <SwitchField
          control={control}
          name="allDay"
          label="Hele dag"
          hint="Geen specifiek tijdstip, enkel de datum telt."
        />
      </div>

      <DateTimeField
        control={control}
        dateName="startDate"
        timeName="startTime"
        allDayName="allDay"
        label="Start"
        required
      />
      <DateTimeField
        control={control}
        dateName="endDate"
        timeName="endTime"
        allDayName="allDay"
        label="Einde"
        hint={allDay ? undefined : 'Optioneel.'}
      />

      <TextField control={control} name="location" label="Locatie" />

      <div className="border-border-subtle border-t pt-3">
        <SwitchField
          control={control}
          name="visibleToClient"
          label="Zichtbaar voor klant"
          hint="De klant ziet dit agenda-item in het portaal."
        />
      </div>
    </FormSheet>
  );
}
