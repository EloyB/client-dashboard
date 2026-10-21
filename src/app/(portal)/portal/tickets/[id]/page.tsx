import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataList, type DataListItem } from '@/components/shared/DataList';
import { DetailHeader } from '@/components/shared/DetailHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TicketScreenshots } from '@/components/shared/TicketScreenshots';
import { getTicketDetailForClient } from '@/features/tickets/queries';
import { AccessError, requireClientUser } from '@/lib/access';
import { cn } from '@/lib/utils';
import type { TicketStatus } from '@/db/schema';

function formatDateTime(date: Date): string {
  return format(date, 'd MMM yyyy, HH:mm', { locale: nl });
}

const STATUS_GUIDE: { status: TicketStatus; text: string }[] = [
  { status: 'new', text: 'We hebben uw melding ontvangen, maar er nog niet naar gekeken.' },
  { status: 'in_progress', text: 'We zijn ermee bezig.' },
  {
    status: 'resolved',
    text: 'Wij hebben het opgelost. Kijk gerust na of alles werkt zoals u verwacht. Blijft het probleem terugkomen, maak dan een nieuwe melding.',
  },
];

export default async function PortalTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const requestHeaders = await headers();
  const user = await requireClientUser(requestHeaders);

  let ticket;
  try {
    ticket = await getTicketDetailForClient(user, id);
  } catch (error) {
    if (error instanceof AccessError && error.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  const details: DataListItem[] = [
    { label: 'Nummer', value: ticket.reference, mono: true },
    { label: 'Project', value: ticket.projectName },
    { label: 'Gemeld door', value: ticket.reporterName },
    { label: 'Gemeld op', value: formatDateTime(ticket.createdAt) },
    { label: 'Laatste update', value: formatDateTime(ticket.updatedAt) },
    ...(ticket.resolvedAt
      ? [{ label: 'Opgelost op', value: formatDateTime(ticket.resolvedAt) }]
      : []),
  ];

  return (
    <>
      <DetailHeader
        breadcrumbs={[
          { label: 'Mijn meldingen', href: '/portal/tickets' },
          { label: ticket.reference },
        ]}
        title={ticket.title}
        badge={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge domain="ticket" status={ticket.status} audience="portal" />
            <StatusBadge domain="priority" priority={ticket.priority} />
            <span className="text-small text-muted-foreground">{ticket.projectName}</span>
          </div>
        }
        primaryAction={
          <Button variant="outline" asChild>
            <Link href="/portal/tickets/new">Nieuwe melding maken</Link>
          </Button>
        }
      />

      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-3 lg:p-8">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader className="border-border-subtle border-b">
              <CardTitle>Wat u meldde</CardTitle>
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
          <Card>
            <CardHeader className="border-border-subtle border-b">
              <CardTitle>Gegevens</CardTitle>
            </CardHeader>
            <CardContent>
              <DataList items={details} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-border-subtle border-b">
              <CardTitle>Wat betekent de status?</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {STATUS_GUIDE.map((entry) => (
                <div
                  key={entry.status}
                  className={cn(
                    'flex flex-col gap-1.5 rounded-lg border border-transparent px-3 py-2.5',
                    entry.status === ticket.status && 'border-border-subtle bg-muted/40',
                  )}
                >
                  <StatusBadge domain="ticket" status={entry.status} audience="portal" />
                  <p
                    className={cn(
                      'text-small',
                      entry.status === ticket.status ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {entry.text}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
