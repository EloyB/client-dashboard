import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { headers } from 'next/headers';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { listNewTicketsForAdmin } from '@/features/tickets/queries.admin';
import { DashboardSectionCard } from '@/components/shared/DashboardSectionCard';

const SECTION_LIMIT = 5;

export async function NewTicketsSection() {
  const tickets = await listNewTicketsForAdmin(await headers(), SECTION_LIMIT);

  return (
    <DashboardSectionCard
      title="Nieuwe tickets"
      count={tickets.length}
      actionLabel="Alle tickets"
      actionHref="/app/tickets?status=new"
    >
      {tickets.length === 0 ? (
        <EmptyState
          variant="positive"
          title="Geen nieuwe tickets"
          description="Nieuwe meldingen van klanten verschijnen hier."
        />
      ) : (
        tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="border-border-subtle flex flex-col gap-2 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{ticket.title}</span>
                <span className="text-small text-muted-foreground font-mono">
                  {ticket.reference}
                </span>
              </div>
              <p className="text-small text-muted-foreground">
                {ticket.clientName} · {ticket.projectName}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
              <StatusBadge domain="priority" priority={ticket.priority} />
              <span className="text-small text-muted-foreground">
                {formatDistanceToNow(ticket.createdAt, { locale: nl, addSuffix: true })}
              </span>
              {ticket.linkedTask && (
                <Button size="sm" variant="outline" asChild>
                  <Link
                    href={`/app/projects/${ticket.projectId}/tasks?view=board&status=${ticket.linkedTask.status}`}
                  >
                    Naar taak
                  </Link>
                </Button>
              )}
              <Button size="sm" asChild>
                <Link href={`/app/tickets/${ticket.id}`}>Openen</Link>
              </Button>
            </div>
          </div>
        ))
      )}
    </DashboardSectionCard>
  );
}
