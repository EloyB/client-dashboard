import type { ReactNode } from 'react';

import { PageHeader, type Breadcrumb } from '@/components/shared/PageHeader';

/**
 * The Detail pattern's header from CRUD-patronen.dc.html: breadcrumb, title
 * with a status badge, one primary action plus an overflow for the rest.
 * Thin wrapper around 0a's PageHeader — no new markup, just detail-page
 * ergonomics (a `badge` slot instead of plumbing `badges` yourself).
 */
export function DetailHeader({
  breadcrumbs,
  title,
  badge,
  primaryAction,
  secondaryAction,
  overflowActions,
}: {
  breadcrumbs?: Breadcrumb[];
  title: string;
  badge?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  overflowActions?: ReactNode;
}) {
  return (
    <PageHeader
      breadcrumbs={breadcrumbs}
      title={title}
      badges={badge}
      primaryAction={primaryAction}
      overflowActions={
        (secondaryAction || overflowActions) && (
          <>
            {secondaryAction}
            {overflowActions}
          </>
        )
      }
    />
  );
}
