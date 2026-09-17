import Link from 'next/link';

import { StatusPage } from '@/components/shared/StatusPage';
import { Button } from '@/components/ui/button';

export default function RootNotFound() {
  return (
    <StatusPage
      eyebrow={<p className="text-small text-muted-foreground font-mono">404</p>}
      title="Deze pagina bestaat niet"
      description="Controleer de link, of meld u aan om verder te gaan."
      actions={
        <Button asChild>
          <Link href="/login">Naar aanmelden</Link>
        </Button>
      }
    />
  );
}
