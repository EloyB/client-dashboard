'use client';

import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListRow } from '@/components/shared/ListRow';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { AdminLinkedTask } from '@/features/tickets/queries.admin';
import type { Priority, TicketStatus } from '@/db/schema';
import { parseDateOnly } from '@/lib/utils';
import { ConvertToTaskSheet } from './ConvertToTaskSheet';

function dueDateLabel(dueDate: string | null): string {
  const date = parseDateOnly(dueDate);
  return date ? `vervalt ${format(date, 'd MMM', { locale: nl })}` : 'geen vervaldatum';
}

/**
 * "Gekoppelde taak" (7d) — an empty state with a conversion button when no
 * task exists yet, or a link to the existing task once there is one. A
 * ticket converts to at most one task: there's no "convert again" affordance
 * here, matching the server action's own rejection of a second conversion.
 */
export function ConvertToTaskCard({
  ticket,
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
    linkedTask: AdminLinkedTask | null;
  };
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="border-border-subtle border-b">
        <CardTitle>Gekoppelde taak</CardTitle>
      </CardHeader>
      <CardContent>
        {ticket.linkedTask ? (
          <Link
            href={`/app/projects/${ticket.projectId}/tasks?view=board&status=${ticket.linkedTask.status}`}
            className="block"
          >
            <ListRow
              leading={<span className="bg-primary size-2 shrink-0 rounded-full" />}
              title={ticket.linkedTask.title}
              subtitle={`${ticket.linkedTask.reference} · ${dueDateLabel(ticket.linkedTask.dueDate)}`}
              trailing={<StatusBadge domain="task" status={ticket.linkedTask.status} />}
            />
          </Link>
        ) : (
          <EmptyState
            variant="invite"
            title="Nog geen taak gekoppeld"
            description="Zet het ticket om naar een taak om het op het bord te zetten."
            action={
              <Button size="sm" onClick={() => setSheetOpen(true)}>
                Omzetten naar taak
              </Button>
            }
          />
        )}
      </CardContent>

      {/* Always mounted (not gated on !ticket.linkedTask) — the moment the
          conversion succeeds, router.refresh() flips linkedTask to non-null,
          which would otherwise unmount the sheet mid-confirmation-screen. */}
      <ConvertToTaskSheet ticket={ticket} open={sheetOpen} onOpenChange={setSheetOpen} />
    </Card>
  );
}
