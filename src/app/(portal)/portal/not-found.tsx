import Link from 'next/link';

import { BackButton } from '@/components/shared/BackButton';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusPage } from '@/components/shared/StatusPage';
import { Button } from '@/components/ui/button';

export default function PortalNotFound() {
  return (
    <>
      <PageHeader breadcrumbs={[{ label: 'Niet gevonden' }]} title="Pagina niet gevonden" />
      <StatusPage
        eyebrow={<p className="text-small text-muted-foreground font-mono">404</p>}
        title="Deze pagina bestaat niet"
        description="Mogelijk is de pagina verwijderd of is de link verouderd. Controleer de link of ga terug naar het overzicht."
        actions={
          <>
            <Button asChild>
              <Link href="/portal">Naar start</Link>
            </Button>
            <BackButton variant="outline">Vorige pagina</BackButton>
          </>
        }
      />
    </>
  );
}
