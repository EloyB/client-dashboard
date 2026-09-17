import { Fragment, type ReactNode } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export type Breadcrumb = { label: string; href?: string };

/**
 * The page header pattern from COMPONENTS.md: breadcrumb, title, optional
 * badges, one primary action plus an overflow menu for the rest. On mobile
 * the primary action repeats as a full-width button below the header.
 */
export function PageHeader({
  breadcrumbs,
  title,
  badges,
  primaryAction,
  overflowActions,
}: {
  breadcrumbs?: Breadcrumb[];
  title: string;
  badges?: ReactNode;
  primaryAction?: ReactNode;
  overflowActions?: ReactNode;
}) {
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
        {(primaryAction || overflowActions) && (
          <div className="hidden items-center gap-2 sm:flex">
            {primaryAction}
            {overflowActions}
          </div>
        )}
      </div>

      {primaryAction && <div className="sm:hidden [&>*]:w-full">{primaryAction}</div>}
    </div>
  );
}
