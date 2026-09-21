import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { db } from '@/db';
import { clients, user as userTable } from '@/db/schema';
import { AppShell } from '@/components/shared/AppShell';
import { InitialsAvatar } from '@/components/shared/InitialsAvatar';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/access';
import { initialsFromName } from '@/lib/utils';

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser(await headers());

  if (!currentUser) {
    redirect('/login');
  }
  if (currentUser.role !== 'client' || !currentUser.clientId) {
    redirect('/app');
  }

  const [[client], [clientUser]] = await Promise.all([
    db
      .select({ name: clients.name })
      .from(clients)
      .where(eq(clients.id, currentUser.clientId))
      .limit(1),
    db
      .select({ name: userTable.name })
      .from(userTable)
      .where(eq(userTable.id, currentUser.id))
      .limit(1),
  ]);

  return (
    <AppShell
      area="portal"
      topSlot={
        <div className="flex flex-col gap-2 px-4 pb-3">
          <div>
            <p className="text-overline text-muted-foreground uppercase">Klant</p>
            <p className="text-body truncate font-semibold">{client.name}</p>
          </div>
          <Button asChild>
            <Link href="/portal/tickets">Bug melden</Link>
          </Button>
        </div>
      }
      footerAvatar={
        <InitialsAvatar
          initials={initialsFromName(clientUser.name)}
          shape="circle"
          className="bg-neutral-200 text-neutral-800"
        />
      }
      footerDetails={
        <div className="min-w-0">
          <p className="text-small truncate font-medium">{clientUser.name}</p>
          <p className="text-small text-muted-foreground truncate">{client.name}</p>
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
