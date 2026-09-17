import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { db } from '@/db';
import { user as userTable } from '@/db/schema';
import { AppShell } from '@/components/shared/AppShell';
import { InitialsAvatar } from '@/components/shared/InitialsAvatar';
import { getCurrentUser } from '@/lib/access';

function initialsFor(name: string): string {
  const [first, second] = name.split(' ');
  return `${first?.charAt(0) ?? ''}${second?.charAt(0) ?? ''}`.toUpperCase();
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser(await headers());

  if (!currentUser) {
    redirect('/login');
  }
  if (currentUser.role !== 'admin') {
    redirect('/portal');
  }

  const [admin] = await db
    .select({ name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, currentUser.id))
    .limit(1);

  return (
    <AppShell
      area="admin"
      footerAvatar={
        <InitialsAvatar
          initials={initialsFor(admin.name)}
          shape="circle"
          className="bg-neutral-200 text-neutral-800"
        />
      }
      footerDetails={
        <div className="min-w-0">
          <p className="text-small truncate font-medium">{admin.name}</p>
          <p className="text-small text-muted-foreground truncate">Beheerder</p>
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
