'use client';

import { Camera, FileUp, Image as ImageIcon, Upload, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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

type FileUploadFieldState = 'idle' | 'uploading' | 'uploaded' | 'error';

/**
 * Full upload field with all states from COMPONENTS.md "Bestandsupload":
 * empty, uploading (progress bar), uploaded, error (two ways out). Desktop
 * shows the dropzone; mobile shows three 44px buttons (Bestanden/Foto's/Foto
 * maken) instead. UI only — `onUpload` decides success/failure, nothing is
 * actually stored (object storage lands in slice 4).
 */
export function FileUploadField({
  label,
  hint = 'PNG of JPG, max. 10 MB',
  accept = 'image/*',
  onUpload,
  className,
}: {
  label: string;
  hint?: string;
  accept?: string;
  onUpload: (file: File) => Promise<void>;
  className?: string;
}) {
  const [state, setState] = useState<FileUploadFieldState>('idle');
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(selected: File | undefined) {
    if (!selected) return;
    setFile(selected);
    setState('uploading');
    setProgress(10);
    setError(null);

    const interval = window.setInterval(() => {
      setProgress((current) => Math.min(current + 20, 90));
    }, 150);

    try {
      await onUpload(selected);
      window.clearInterval(interval);
      setProgress(100);
      setState('uploaded');
    } catch (uploadError) {
      window.clearInterval(interval);
      setState('error');
      setError(uploadError instanceof Error ? uploadError.message : 'Uploaden mislukt.');
    }
  }

  function reset() {
    setState('idle');
    setFile(null);
    setProgress(0);
    setError(null);
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label>{label}</Label>

      {state === 'idle' && (
        <>
          <FileDropzone
            accept={accept}
            hint={hint}
            className="hidden sm:flex"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
          <div className="flex gap-2 sm:hidden">
            <Button variant="outline" className="h-11 flex-1 gap-1.5" asChild>
              <label>
                <FileUp className="size-4" />
                Bestanden
                <input
                  type="file"
                  accept={accept}
                  className="sr-only"
                  onChange={(event) => handleFile(event.target.files?.[0])}
                />
              </label>
            </Button>
            <Button variant="outline" className="h-11 flex-1 gap-1.5" asChild>
              <label>
                <ImageIcon className="size-4" />
                Foto&apos;s
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => handleFile(event.target.files?.[0])}
                />
              </label>
            </Button>
            <Button variant="outline" className="h-11 flex-1 gap-1.5" asChild>
              <label>
                <Camera className="size-4" />
                Foto maken
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(event) => handleFile(event.target.files?.[0])}
                />
              </label>
            </Button>
          </div>
        </>
      )}

      {state === 'uploading' && file && (
        <div className="border-border flex flex-col gap-2 rounded-lg border px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-body truncate">{file.name}</span>
            <span className="text-small text-muted-foreground shrink-0">Bezig...</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {state === 'uploaded' && file && (
        <FileRow
          typeLabel={file.type.split('/')[1]?.toUpperCase().slice(0, 4) || 'BESTAND'}
          name={file.name}
          meta={`${(file.size / 1024 / 1024).toFixed(1)} MB · geüpload`}
          className="border-success"
          action={
            <Button variant="ghost" size="icon" onClick={reset} aria-label="Verwijderen">
              <X className="size-4" />
            </Button>
          }
        />
      )}

      {state === 'error' && (
        <div className="bg-destructive-muted flex flex-col gap-2 rounded-lg px-3 py-2.5">
          <p className="text-small text-destructive">{error}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleFile(file ?? undefined)}>
              Opnieuw proberen
            </Button>
            <Button size="sm" variant="ghost" onClick={reset}>
              Ander bestand kiezen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
