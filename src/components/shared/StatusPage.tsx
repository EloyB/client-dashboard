import type { ReactNode } from 'react';

export function StatusPage({
  eyebrow,
  title,
  description,
  meta,
  actions,
}: {
  eyebrow?: ReactNode;
  title: string;
  description: string;
  meta?: string;
  actions: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="border-border bg-card shadow-card flex w-full max-w-md flex-col items-center gap-3 rounded-xl border px-6 py-12 text-center">
        {eyebrow}
        <h1 className="text-h2 font-display">{title}</h1>
        <p className="text-body text-muted-foreground max-w-sm">{description}</p>
        {meta && <p className="text-small text-muted-foreground font-mono">{meta}</p>}
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">{actions}</div>
      </div>
    </div>
  );
}
