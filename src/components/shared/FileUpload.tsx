import type { ReactNode } from 'react';
import { Upload } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Dropzone for a new upload (see COMPONENTS.md "Bestandsupload"). Uses a native
 * `<label>` + hidden file input so it works without client-side JavaScript;
 * wire up `onChange`/`accept`/`capture` per use case where it's rendered.
 */
export function FileDropzone({
  accept = 'image/*',
  hint = 'PNG of JPG, max. 10 MB',
  className,
  ...inputProps
}: {
  accept?: string;
  hint?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      className={cn(
        'flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center',
        className,
      )}
    >
      <input type="file" accept={accept} className="sr-only" {...inputProps} />
      <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-md">
        <Upload className="size-4" />
      </div>
      <p className="text-body font-medium">Sleep een afbeelding hierheen</p>
      <p className="text-small text-muted-foreground">
        of <span className="font-semibold underline">kies een bestand</span> · {hint}
      </p>
    </label>
  );
}

/** A single uploaded/attached file, with a trailing action slot (remove button, "Openen" link, ...). */
export function FileRow({
  typeLabel,
  name,
  meta,
  action,
  className,
}: {
  typeLabel: string;
  name: string;
  meta: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border flex items-center justify-between rounded-lg border px-3 py-2',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="text-small text-muted-foreground flex size-9 items-center justify-center rounded-md bg-neutral-100 font-medium">
          {typeLabel}
        </div>
        <div>
          <p className="text-body">{name}</p>
          <p className="text-small text-muted-foreground">{meta}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
