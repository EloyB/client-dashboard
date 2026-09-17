'use client';

import { PanelLeft, PanelLeftClose } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  adminSidebarItems,
  isNavItemActive,
  portalSidebarItems,
} from '@/components/shared/navigation-items';
import { UserMenu } from '@/components/shared/UserMenu';
import { cn } from '@/lib/utils';

const COLLAPSED_STORAGE_KEY = 'studio-sidebar-collapsed';
const COLLAPSED_CHANGE_EVENT = 'studio-sidebar-collapsed-change';

const sectionLabelByArea = { admin: 'Beheer', portal: 'Portaal' } as const;

function subscribeToCollapsed(onChange: () => void) {
  window.addEventListener(COLLAPSED_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(COLLAPSED_CHANGE_EVENT, onChange);
}

function getCollapsedSnapshot() {
  try {
    return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function getCollapsedServerSnapshot() {
  return false;
}

export function Sidebar({
  area,
  topSlot,
  footerAvatar,
  footerDetails,
}: {
  area: 'admin' | 'portal';
  topSlot?: ReactNode;
  footerAvatar: ReactNode;
  footerDetails: ReactNode;
}) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    subscribeToCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );
  const items = area === 'admin' ? adminSidebarItems : portalSidebarItems;
  const sectionLabel = sectionLabelByArea[area];
  const logoLabel = 'Studio';

  function toggleCollapsed() {
    try {
      window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(!collapsed));
      window.dispatchEvent(new Event(COLLAPSED_CHANGE_EVENT));
    } catch {
      // Private browsing or blocked storage: toggle has no persisted effect.
    }
  }

  return (
    <aside
      className={cn(
        'bg-sidebar border-sidebar-border sticky top-0 hidden h-dvh shrink-0 flex-col border-r lg:flex',
        collapsed ? 'w-17' : 'w-62',
      )}
    >
      <div className={cn('flex items-center gap-2 px-4 py-4', collapsed && 'justify-center px-0')}>
        {!collapsed && (
          <>
            <div className="bg-primary text-primary-foreground text-small flex size-7 shrink-0 items-center justify-center rounded-md font-semibold">
              {logoLabel.charAt(0)}
            </div>
            <span className="font-display flex-1 truncate font-semibold">{logoLabel}</span>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Zijbalk uitklappen' : 'Zijbalk inklappen'}
        >
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>

      {!collapsed && topSlot}

      {!collapsed && (
        <p className="text-overline text-muted-foreground px-4 pb-1 uppercase">{sectionLabel}</p>
      )}

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {items.map((item) => {
          const active = isNavItemActive(item, pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'text-body flex h-10 items-center gap-2.5 rounded-md px-2.5',
                collapsed && 'justify-center px-0',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-sidebar-border flex items-center gap-2 border-t px-2 py-2">
        {collapsed ? (
          footerAvatar
        ) : (
          <UserMenu
            avatar={footerAvatar}
            details={<div className="min-w-0 flex-1">{footerDetails}</div>}
          />
        )}
      </div>
    </aside>
  );
}
