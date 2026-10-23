import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { headers } from 'next/headers';

import { DashboardSectionCard } from '@/components/shared/DashboardSectionCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { listTicketsForClient } from '@/features/tickets/queries';
import { requireClientUser } from '@/lib/access';
import type { TicketStatus } from '@/db/schema';

const SECTION_LIMIT = 5;

/** Explains the status in one friendly sentence — no ticket jargon. */
const statusExplanation: Record<TicketStatus, string> = {
  new: 'Uw melding is bij ons binnen. We bekijken ze zo snel mogelijk.',
  in_progress: 'We werken eraan. U krijgt een e-mail zodra het opgelost is.',
  resolved: 'Dit is opgelost. Kijk gerust na of alles werkt zoals verwacht.',
};

export async function PortalTicketsSection() {
  const user = await requireClientUser(await headers());
  const tickets = (await listTicketsForClient(user)).slice(0, SECTION_LIMIT);

  return (
    <DashboardSectionCard
      title="Uw meldingen"
      subtitle="Ook wat uw collega's meldden."
      actionLabel="Alle meldingen"
      actionHref="/portal/tickets"
    >
      {tickets.length === 0 ? (
        <EmptyState
          variant="invite"
          title="Nog geen meldingen"
          description="Ziet u iets dat niet werkt? Meld het via de knop hierboven."
        />
      ) : (
        tickets.map((ticket) => {
          const timestampLabel =
            ticket.status === 'resolved'
              ? `opgelost ${formatDistanceToNow(ticket.updatedAt, { locale: nl, addSuffix: true })}`
              : `bijgewerkt ${formatDistanceToNow(ticket.updatedAt, { locale: nl, addSuffix: true })}`;

          return (
            <div
              key={ticket.id}
              className="border-border-subtle flex flex-col gap-1.5 border-b py-3 last:border-0"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="font-medium">{ticket.title}</span>
                <StatusBadge domain="ticket" status={ticket.status} audience="portal" />
              </div>
              <p className="text-body text-muted-foreground">{statusExplanation[ticket.status]}</p>
              <p className="text-small text-muted-foreground">
                {ticket.projectName} · gemeld door{' '}
                {ticket.reporterId === user.id ? 'u' : ticket.reporterName} · {timestampLabel}
              </p>
            </div>
          );
        })
      )}
    </DashboardSectionCard>
  );
}
