'use client';

import { Download, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileRow, FileUploadField, type FileUploadCallback } from '@/components/shared/FileUpload';
import { showErrorToast, showSuccessToast } from '@/components/shared/toast';
import {
  confirmUpload,
  deleteFile,
  getFileDownloadUrl,
  requestUpload,
} from '@/features/files/actions';
import type { UploadContext } from '@/features/files/schemas';
import { getDemoProjectId } from './actions';

type UploadedFile = { id: string; name: string; size: number };

function uploadViaPresignedUrl(
  file: File,
  onProgress: (percent: number) => void,
  signal: AbortSignal,
  projectId: string,
  context: UploadContext,
): Promise<string> {
  return (async () => {
    const requested = await requestUpload({
      projectId,
      context,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
    });
    if (!requested.success) {
      const fieldError = Object.values(requested.fieldErrors)[0]?.[0];
      throw new Error(requested.formError ?? fieldError ?? 'Aanvragen van de upload mislukt.');
    }

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', requested.data.uploadUrl);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error('Uploaden naar de opslag is mislukt.'));
      };
      xhr.onerror = () => reject(new Error('Uploaden naar de opslag is mislukt.'));
      xhr.onabort = () => reject(new DOMException('Geannuleerd', 'AbortError'));
      signal.addEventListener('abort', () => xhr.abort());
      xhr.send(file);
    });

    const confirmed = await confirmUpload({
      projectId,
      context,
      storageKey: requested.data.storageKey,
      filename: file.name,
    });
    if (!confirmed.success) {
      throw new Error(confirmed.formError ?? 'Bevestigen van de upload mislukt.');
    }
    return confirmed.data.fileId;
  })();
}

function UploadedFileRow({ file, onRemoved }: { file: UploadedFile; onRemoved: () => void }) {
  async function handleDownload() {
    try {
      const url = await getFileDownloadUrl(file.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      showErrorToast('Downloaden mislukt', error instanceof Error ? error.message : undefined);
    }
  }

  async function handleDelete() {
    try {
      await deleteFile(file.id);
      showSuccessToast('Bestand verwijderd');
      onRemoved();
    } catch (error) {
      showErrorToast('Verwijderen mislukt', error instanceof Error ? error.message : undefined);
    }
  }

  return (
    <FileRow
      typeLabel="OK"
      name={file.name}
      meta={`${(file.size / 1024 / 1024).toFixed(2)} MB · bevestigd`}
      action={
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={handleDownload} aria-label="Downloaden">
            <Download className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete} aria-label="Verwijderen">
            <Trash2 className="size-4" />
          </Button>
        </div>
      }
    />
  );
}

function UploadContextDemo({
  title,
  context,
  accept,
  hint,
  multiple,
  projectId,
}: {
  title: string;
  context: UploadContext;
  accept: string;
  hint: string;
  multiple?: boolean;
  projectId: string;
}) {
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);

  const handleUpload: FileUploadCallback = async (file, onProgress, signal) => {
    const fileId = await uploadViaPresignedUrl(file, onProgress, signal, projectId, context);
    setUploaded((current) => [...current, { id: fileId, name: file.name, size: file.size }]);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-overline text-muted-foreground uppercase">{title}</p>
      <FileUploadField
        label={title}
        hint={hint}
        accept={accept}
        multiple={multiple}
        onUpload={handleUpload}
      />
      {uploaded.map((file) => (
        <UploadedFileRow
          key={file.id}
          file={file}
          onRemoved={() =>
            setUploaded((current) => current.filter((existing) => existing.id !== file.id))
          }
        />
      ))}
    </div>
  );
}

/** Working example against the real object storage (see slice 4) — admin-only, like every other action it calls. */
export function FileUploadDemo() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDemoProjectId()
      .then(setProjectId)
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Mislukt.'));
  }, []);

  if (error) {
    return (
      <Card>
        <CardContent>
          <p className="text-body text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!projectId) {
    return (
      <Card>
        <CardContent>
          <p className="text-body text-muted-foreground">Bezig met laden...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardContent>
          <UploadContextDemo
            title="Ticket-screenshot"
            context="ticket_attachment"
            accept="image/png,image/jpeg,image/webp"
            hint="PNG, JPG of WEBP, max. 10 MB"
            projectId={projectId}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <UploadContextDemo
            title="Documenten"
            context="document"
            accept="application/pdf,image/png,image/jpeg,.docx,.xlsx"
            hint="PDF, afbeelding, Word of Excel, max. 20 MB"
            multiple
            projectId={projectId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
