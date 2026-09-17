import type { ReactNode } from 'react';

import { MobileNav } from '@/components/shared/MobileNav';
import { Sidebar } from '@/components/shared/Sidebar';

export function AppShell({
  area,
  topSlot,
  footerAvatar,
  footerDetails,
  children,
}: {
  area: 'admin' | 'portal';
  topSlot?: ReactNode;
  footerAvatar: ReactNode;
  footerDetails: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar
        area={area}
        topSlot={topSlot}
        footerAvatar={footerAvatar}
        footerDetails={footerDetails}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav area={area} />
        <main className="flex flex-1 flex-col pb-16 lg:pb-0">{children}</main>
      </div>
    </div>
  );
}
