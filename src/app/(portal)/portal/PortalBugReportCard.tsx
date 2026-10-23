import { Bug } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

/** The "actiekaart" from COMPONENTS.md: accent surface, white (inverse) button, at most one per page. */
export function PortalBugReportCard() {
  return (
    <div className="bg-primary text-primary-foreground flex flex-col gap-4 rounded-xl p-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-h3">Ziet u iets dat niet werkt op uw website?</h2>
        <p className="text-primary-foreground/80">
          Beschrijf kort wat er gebeurt en voeg eventueel een schermafbeelding toe. Wij bekijken het
          en laten u weten wanneer het opgelost is.
        </p>
      </div>
      <div className="flex flex-col items-start gap-2">
        <Button variant="inverse" asChild>
          <Link href="/portal/tickets/new">
            <Bug strokeWidth={1.75} />
            Bug melden
          </Link>
        </Button>
        <span className="text-small text-primary-foreground/70">Duurt één minuut</span>
      </div>
    </div>
  );
}
