import { confirmUpload, requestUpload } from '@/features/files/actions';
import type { UploadContext } from '@/features/files/schemas';

/**
 * The full slice-4 upload flow for one file: request a presigned URL, PUT
 * the file to storage with real progress via XHR (fetch has no upload
 * progress event), then confirm. Shared by every FileUploadField usage that
 * needs to attach the resulting file id to something (tickets, documents).
 */
export function uploadViaPresignedUrl(
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
