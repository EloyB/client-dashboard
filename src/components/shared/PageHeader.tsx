import { MoreHorizontal } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type Breadcrumb = { label: string; href?: string };

/**
 * The page header pattern from COMPONENTS.md: breadcrumb, title, optional
 * badges, one primary action, an always-visible secondary action, and a
 * "..." overflow menu for anything destructive. All three stay visible on
 * mobile (stacked below the header), not just the primary action.
 */
export function PageHeader({
  breadcrumbs,
  title,
  badges,
  primaryAction,
  secondaryAction,
  overflowActions,
}: {
  breadcrumbs?: Breadcrumb[];
  title: string;
  badges?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  /** Menu items (e.g. DropdownMenuItem) shown behind a "..." trigger — for destructive or secondary actions. */
  overflowActions?: ReactNode;
}) {
  const overflowTrigger = overflowActions && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Meer acties">
          <MoreHorizontal strokeWidth={1.75} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{overflowActions}</DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="border-border-subtle flex flex-col gap-3 border-b px-4 py-4 sm:px-6 lg:px-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={crumb.label}>
                {index > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-h1 font-display">{title}</h1>
          {badges}
        </div>
        {(primaryAction || secondaryAction || overflowActions) && (
          <div className="hidden items-center gap-2 sm:flex">
            {secondaryAction}
            {primaryAction}
            {overflowTrigger}
          </div>
        )}
      </div>

      {(primaryAction || secondaryAction || overflowActions) && (
        <div className="flex flex-col gap-2 sm:hidden [&>*]:w-full">
          {primaryAction}
          {secondaryAction}
          {overflowTrigger && <div className="w-full [&>button]:w-full">{overflowTrigger}</div>}
        </div>
      )}
    </div>
  );
}
