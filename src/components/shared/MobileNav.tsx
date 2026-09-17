'use client';

import { ChevronLeft, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  adminOverflowItems,
  adminTabItems,
  isNavItemActive,
  portalTabItems,
  type NavItem,
} from '@/components/shared/navigation-items';
import { cn } from '@/lib/utils';

function findActiveItem(items: NavItem[], pathname: string): NavItem | undefined {
  return items.find((item) => isNavItemActive(item, pathname));
}

export function MobileNav({ area }: { area: 'admin' | 'portal' }) {
  const pathname = usePathname();
  const router = useRouter();

  const tabItems = area === 'admin' ? adminTabItems : portalTabItems;
  const overflowItems = area === 'admin' ? adminOverflowItems : undefined;

  const activeTab = findActiveItem(tabItems, pathname);
  const activeOverflow = overflowItems && findActiveItem(overflowItems, pathname);
  const currentLabel = activeTab?.label ?? activeOverflow?.label ?? '';
  const isOnTabRoute = Boolean(activeTab) && !activeOverflow;

  return (
    <>
      <div className="border-border-subtle bg-background sticky top-0 z-30 flex h-10 items-center gap-2 border-b px-2 lg:hidden">
        {!isOnTabRoute && (
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={() => router.back()}
            aria-label="Vorige pagina"
          >
            <ChevronLeft className="size-4" />
          </Button>
        )}
        <span className={cn('text-body flex-1 truncate font-semibold', isOnTabRoute && 'ml-1')}>
          {currentLabel}
        </span>
        {overflowItems && overflowItems.length > 0 && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9" aria-label="Meer">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Meer</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4 pb-4">
                {overflowItems.map((item) => {
                  const Icon = item.icon;
                  const active = isNavItemActive(item, pathname);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'text-body flex h-11 items-center gap-3 rounded-md px-2.5',
                        active
                          ? 'bg-accent text-accent-foreground font-semibold'
                          : 'text-foreground',
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        )}
      </div>

      <nav
        className="border-border-subtle bg-background fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Hoofdnavigatie"
      >
        {tabItems.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(item, pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'text-small flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-1.5',
                active ? 'text-primary font-semibold' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
