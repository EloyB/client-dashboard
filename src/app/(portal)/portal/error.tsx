'use client';

import { Home, RefreshCw, TriangleAlert } from 'lucide-react';
import Link from 'next/link';

import { StatusPage } from '@/components/shared/StatusPage';
import { Button } from '@/components/ui/button';

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const timestamp = new Intl.DateTimeFormat('nl-BE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Brussels',
  }).format(new Date());

  return (
    <StatusPage
      eyebrow={
        <div className="bg-destructive-muted text-destructive flex size-10 items-center justify-center rounded-full">
          <TriangleAlert className="size-5" />
        </div>
      }
      title="Er ging iets mis"
      description="We konden deze pagina niet laden. Probeer het opnieuw; blijft het misgaan, dan is de melding al bij ons binnengekomen."
      meta={`Foutcode ${error.digest ?? '500'} · ${timestamp}`}
      actions={
        <>
          <Button onClick={reset}>
            <RefreshCw strokeWidth={1.75} />
            Opnieuw proberen
          </Button>
          <Button variant="outline" asChild>
            <Link href="/portal">
              <Home strokeWidth={1.75} />
              Naar start
            </Link>
          </Button>
        </>
      }
    />
  );
}
