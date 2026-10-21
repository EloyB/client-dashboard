import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataList, type DataListItem } from '@/components/shared/DataList';
import { DetailHeader } from '@/components/shared/DetailHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TicketScreenshots } from '@/components/shared/TicketScreenshots';
import { getTicketByIdForAdmin } from '@/features/tickets/queries.admin';
import { AccessError } from '@/lib/access';
import { TicketOpvolgingCard } from './TicketOpvolgingCard';

function formatDateTime(date: Date): string {
  return format(date, 'd MMM yyyy, HH:mm', { locale: nl });
}

function attachmentLabel(count: number): string {
  if (count === 0) return 'Geen';
  return count === 1 ? '1 schermafbeelding' : `${count} schermafbeeldingen`;
}

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const requestHeaders = await headers();

  let ticket;
  try {
    ticket = await getTicketByIdForAdmin(requestHeaders, id);
  } catch (error) {
    if (error instanceof AccessError && error.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  const details: DataListItem[] = [
    { label: 'Ticket', value: ticket.reference, mono: true },
    {
      label: 'Klant',
      value: (
        <Link href={`/app/clients/${ticket.clientId}`} className="text-primary underline">
          {ticket.clientName}
        </Link>
      ),
    },
    {
      label: 'Project',
      value: (
        <Link href={`/app/projects/${ticket.projectId}`} className="text-primary underline">
          {ticket.projectName}
        </Link>
      ),
    },
    { label: 'Gemeld door', value: ticket.reporterName },
    { label: 'Gemeld op', value: formatDateTime(ticket.createdAt) },
    { label: 'Laatste update', value: formatDateTime(ticket.updatedAt) },
    ...(ticket.resolvedAt
      ? [{ label: 'Opgelost op', value: formatDateTime(ticket.resolvedAt) }]
      : []),
    { label: 'Bijlagen', value: attachmentLabel(ticket.attachments.length) },
  ];

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Tickets', href: '/app/tickets' }, { label: ticket.reference }]}
        title={ticket.title}
        badge={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge domain="ticket" status={ticket.status} />
            <StatusBadge domain="priority" priority={ticket.priority} />
            <span className="text-small text-muted-foreground">
              {ticket.clientName} · {ticket.projectName}
            </span>
          </div>
        }
      />

      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-3 lg:p-8">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader className="border-border-subtle border-b">
              <CardTitle>Melding van de klant</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3.5">
              <p className="text-body whitespace-pre-wrap">
                {ticket.description || 'Geen extra omschrijving.'}
              </p>
              {ticket.pageUrl && (
                <div className="border-border bg-muted/40 flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
                  <span className="text-overline text-muted-foreground shrink-0 uppercase">
                    Pagina
                  </span>
                  <a
                    href={ticket.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary truncate font-mono text-sm underline"
                  >
                    {ticket.pageUrl}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {ticket.attachments.length > 0 && <TicketScreenshots attachments={ticket.attachments} />}
        </div>

        <div className="flex flex-col gap-4">
          <TicketOpvolgingCard
            ticketId={ticket.id}
            status={ticket.status}
            priority={ticket.priority}
          />

          <Card>
            <CardHeader className="border-border-subtle border-b">
              <CardTitle>Gegevens</CardTitle>
            </CardHeader>
            <CardContent>
              <DataList items={details} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
