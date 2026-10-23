import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/** The "sectiekaart" shape from COMPONENTS.md: title (+ optional count/subtitle), a text action to the full overview, then rows. Shared by the admin (9a) and portal (9b) home page sections. */
export function DashboardSectionCard({
  title,
  count,
  subtitle,
  actionLabel,
  actionHref,
  children,
}: {
  title: string;
  count?: number;
  subtitle?: string;
  actionLabel: string;
  actionHref: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="border-border-subtle border-b">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="flex items-center gap-2">
            {title}
            {count !== undefined && (
              <span className="bg-muted text-muted-foreground rounded-full px-1.5 text-xs font-semibold">
                {count}
              </span>
            )}
          </CardTitle>
          {subtitle && <p className="text-small text-muted-foreground">{subtitle}</p>}
        </div>
        <CardAction>
          <Button size="sm" variant="outline" asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col">{children}</CardContent>
    </Card>
  );
}

export function DashboardSectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="border-border-subtle border-b">
        <div className="bg-skeleton h-5 w-32 animate-pulse rounded-md" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3 py-4">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="bg-skeleton-soft h-12 animate-pulse rounded-lg" />
        ))}
      </CardContent>
    </Card>
  );
}
