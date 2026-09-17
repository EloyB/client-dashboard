import { Check, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type AuthNoticeVariant = 'success' | 'warning';

const iconWrapperClasses: Record<AuthNoticeVariant, string> = {
  success: 'bg-success-muted text-success',
  warning: 'bg-warning-muted text-warning',
};

function AuthNoticeIcon({ variant }: { variant: AuthNoticeVariant }) {
  const Icon = variant === 'success' ? Check : TriangleAlert;
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full',
        iconWrapperClasses[variant],
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

/** Standalone icon above a heading — e.g. "Kijk in uw mailbox", "Deze link werkt niet meer". */
export function AuthNoticeIconStandalone({ variant }: { variant: AuthNoticeVariant }) {
  return <AuthNoticeIcon variant={variant} />;
}

/** Icon plus text in a soft box — e.g. admin's "Controleer uw mailbox" confirmation. */
export function AuthNoticeBox({
  variant,
  children,
}: {
  variant: AuthNoticeVariant;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg p-4',
        variant === 'warning' ? 'bg-warning-muted' : 'bg-muted',
      )}
    >
      <AuthNoticeIcon variant={variant} />
      <div className="text-small pt-1">{children}</div>
    </div>
  );
}

/** Plain informational box without an icon — e.g. "Waarom gebeurt dit?". */
export function AuthInfoBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-muted flex flex-col gap-1 rounded-lg p-4">
      <p className="text-small font-semibold">{title}</p>
      <p className="text-small text-muted-foreground">{children}</p>
    </div>
  );
}
