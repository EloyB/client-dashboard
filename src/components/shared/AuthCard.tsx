import type { ReactNode } from 'react';

// The centered card shell shared by every logged-out auth screen (admin
// login/forgot/reset password, client invite/sign-in) — see
// docs/design/handoff/client-dashboard/project/Admin login.dc.html and
// Klantportaal aanmelden.dc.html.
export function AuthCard({
  variant,
  children,
}: {
  variant: 'admin' | 'portal';
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-2">
        <div className="bg-primary text-primary-foreground text-small flex size-7 items-center justify-center rounded-md font-semibold">
          S
        </div>
        <div className="flex flex-col">
          <span className="font-display font-semibold">Studio</span>
          {variant === 'portal' && (
            <span className="text-small text-muted-foreground -mt-0.5">
              Projectportaal voor klanten
            </span>
          )}
        </div>
      </div>

      <div className="border-border bg-card shadow-card w-full max-w-md rounded-xl border px-6 py-8">
        {children}
      </div>

      <div className="text-small text-muted-foreground flex w-full max-w-md items-center justify-between">
        {variant === 'admin' ? (
          <>
            <span>Studio · projectbeheer</span>
            <span>Hulp nodig?</span>
          </>
        ) : (
          <>
            <span>Studio · Gent</span>
            <span>Privacy</span>
          </>
        )}
      </div>
    </div>
  );
}
