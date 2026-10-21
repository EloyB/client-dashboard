'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { showErrorToast, showSuccessToast } from '@/components/shared/toast';
import { updateTicketPriority, updateTicketStatus } from '@/features/tickets/actions.admin';
import type { Priority, TicketStatus } from '@/db/schema';

const statusOptions: { value: TicketStatus; label: string }[] = [
  { value: 'new', label: 'Nieuw' },
  { value: 'in_progress', label: 'In behandeling' },
  { value: 'resolved', label: 'Opgelost' },
];

// Internal description + what the client sees — the portal wording is the
// friendlier audience label from StatusBadge (src/components/shared/StatusBadge.tsx).
const statusHints: Record<TicketStatus, string> = {
  new: 'Nog niet bekeken. De klant ziet "Ontvangen".',
  in_progress: 'Actief opgepakt. De klant ziet "We zijn ermee bezig".',
  resolved: 'Afgerond voor de klant. De klant ziet "Opgelost".',
};

const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Laag' },
  { value: 'medium', label: 'Middel' },
  { value: 'high', label: 'Hoog' },
];

export function TicketOpvolgingCard({
  ticketId,
  status: initialStatus,
  priority: initialPriority,
}: {
  ticketId: string;
  status: TicketStatus;
  priority: Priority;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState(initialPriority);
  const [isStatusPending, startStatusTransition] = useTransition();
  const [isPriorityPending, startPriorityTransition] = useTransition();

  function handleStatusChange(value: string) {
    const nextStatus = value as TicketStatus;
    const previousStatus = status;
    setStatus(nextStatus);
    startStatusTransition(async () => {
      const result = await updateTicketStatus({ ticketId, status: nextStatus });
      if (!result.success) {
        setStatus(previousStatus);
        showErrorToast('Status wijzigen mislukt', result.formError);
        return;
      }
      showSuccessToast('Status bijgewerkt');
      router.refresh();
    });
  }

  function handlePriorityChange(value: string) {
    const nextPriority = value as Priority;
    const previousPriority = priority;
    setPriority(nextPriority);
    startPriorityTransition(async () => {
      const result = await updateTicketPriority({ ticketId, priority: nextPriority });
      if (!result.success) {
        setPriority(previousPriority);
        showErrorToast('Prioriteit wijzigen mislukt', result.formError);
        return;
      }
      showSuccessToast('Prioriteit bijgewerkt');
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="border-border-subtle border-b">
        <CardTitle>Opvolging</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ticket-status">Status</Label>
          <Select value={status} onValueChange={handleStatusChange} disabled={isStatusPending}>
            <SelectTrigger id="ticket-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-small text-muted-foreground">{statusHints[status]}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ticket-priority">Prioriteit</Label>
          <Select
            value={priority}
            onValueChange={handlePriorityChange}
            disabled={isPriorityPending}
          >
            <SelectTrigger id="ticket-priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
