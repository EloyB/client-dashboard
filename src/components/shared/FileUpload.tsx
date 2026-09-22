'use client';

import { Camera, FileUp, Image as ImageIcon, RefreshCw, RotateCcw, Upload, X } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';

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

/**
 * What FileUploadField hands off for each file: report progress as it
 * happens, react to cancellation, throw on failure (its message becomes the
 * shown error). Storage specifics (presigned URLs, confirm step) live in the
 * caller — this component only knows about files and progress.
 */
export type FileUploadCallback = (
  file: File,
  onProgress: (percent: number) => void,
  signal: AbortSignal,
) => Promise<void>;

type UploadState = 'uploading' | 'uploaded' | 'error';

type UploadEntry = {
  id: string;
  file: File;
  state: UploadState;
  progress: number;
  error: string | null;
};

function typeLabelFor(file: File): string {
  return file.type.split('/')[1]?.toUpperCase().slice(0, 4) || 'BESTAND';
}

function UploadEntryRow({
  entry,
  onCancel,
  onRetry,
  onRemove,
}: {
  entry: UploadEntry;
  onCancel: () => void;
  onRetry: () => void;
  onRemove: () => void;
}) {
  if (entry.state === 'uploading') {
    return (
      <div className="border-border flex flex-col gap-2 rounded-lg border px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-body truncate">{entry.file.name}</span>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-small text-muted-foreground">Bezig...</span>
            <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Annuleren">
              <X className="size-4" />
            </Button>
          </div>
        </div>
        <Progress value={entry.progress} className="h-1.5" />
      </div>
    );
  }

  if (entry.state === 'uploaded') {
    return (
      <FileRow
        typeLabel={typeLabelFor(entry.file)}
        name={entry.file.name}
        meta={`${(entry.file.size / 1024 / 1024).toFixed(1)} MB · geüpload`}
        className="border-success"
        action={
          <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Verwijderen">
            <X className="size-4" />
          </Button>
        }
      />
    );
  }

  return (
    <div className="bg-destructive-muted flex flex-col gap-2 rounded-lg px-3 py-2.5">
      <p className="text-small text-destructive">{entry.error}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw strokeWidth={1.75} />
          Opnieuw proberen
        </Button>
        <Button size="sm" variant="ghost" onClick={onRemove}>
          <RotateCcw strokeWidth={1.75} />
          Ander bestand kiezen
        </Button>
      </div>
    </div>
  );
}

/**
 * Full upload field with all states from COMPONENTS.md "Bestandsupload":
 * empty, uploading (real progress, cancellable), uploaded, error (two ways
 * out). Desktop shows the dropzone; mobile shows three 44px buttons
 * (Bestanden/Foto's/Foto maken) instead. `multiple` keeps the dropzone
 * available after each upload instead of hiding it once one file is present.
 */
export function FileUploadField({
  label,
  hint = 'PNG of JPG, max. 10 MB',
  accept = 'image/*',
  multiple = false,
  onUpload,
  className,
}: {
  label: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  onUpload: FileUploadCallback;
  className?: string;
}) {
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const controllers = useRef(new Map<string, AbortController>());

  function updateEntry(id: string, patch: Partial<UploadEntry>) {
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );
  }

  function startUpload(file: File) {
    const id = crypto.randomUUID();
    const controller = new AbortController();
    controllers.current.set(id, controller);
    setEntries((current) => [
      ...current,
      { id, file, state: 'uploading', progress: 0, error: null },
    ]);

    onUpload(file, (percent) => updateEntry(id, { progress: percent }), controller.signal)
      .then(() => updateEntry(id, { state: 'uploaded', progress: 100 }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setEntries((current) => current.filter((entry) => entry.id !== id));
          return;
        }
        updateEntry(id, {
          state: 'error',
          error: error instanceof Error ? error.message : 'Uploaden mislukt.',
        });
      })
      .finally(() => controllers.current.delete(id));
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    Array.from(fileList).forEach(startUpload);
  }

  function retry(id: string) {
    const entry = entries.find((existing) => existing.id === id);
    if (!entry) return;
    setEntries((current) => current.filter((existing) => existing.id !== id));
    startUpload(entry.file);
  }

  function remove(id: string) {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  const showPicker = multiple || entries.length === 0;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label>{label}</Label>

      {showPicker && (
        <>
          <FileDropzone
            accept={accept}
            hint={hint}
            multiple={multiple}
            className="hidden sm:flex"
            onChange={(event) => {
              handleFiles(event.target.files);
              event.target.value = '';
            }}
          />
          <div className="flex gap-2 sm:hidden">
            <Button variant="outline" className="h-11 flex-1 gap-1.5" asChild>
              <label>
                <FileUp className="size-4" />
                Bestanden
                <input
                  type="file"
                  accept={accept}
                  multiple={multiple}
                  className="sr-only"
                  onChange={(event) => {
                    handleFiles(event.target.files);
                    event.target.value = '';
                  }}
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
                  multiple={multiple}
                  className="sr-only"
                  onChange={(event) => {
                    handleFiles(event.target.files);
                    event.target.value = '';
                  }}
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
                  onChange={(event) => {
                    handleFiles(event.target.files);
                    event.target.value = '';
                  }}
                />
              </label>
            </Button>
          </div>
        </>
      )}

      {entries.length > 0 && (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <UploadEntryRow
              key={entry.id}
              entry={entry}
              onCancel={() => controllers.current.get(entry.id)?.abort()}
              onRetry={() => retry(entry.id)}
              onRemove={() => remove(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
