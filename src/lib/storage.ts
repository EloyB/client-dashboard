import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env } from '@/lib/env';

/**
 * The only module that talks to object storage — features call these
 * functions, never the S3 client directly (see CLAUDE.md "Components and
 * reuse"). Works against both Scaleway Object Storage (production) and the
 * local MinIO container purely through env vars, no environment branching:
 * forcePathStyle is required for MinIO and works fine against Scaleway too.
 */
const client = new S3Client({
  region: env.SCALEWAY_REGION,
  endpoint: env.SCALEWAY_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.SCALEWAY_ACCESS_KEY_ID,
    secretAccessKey: env.SCALEWAY_SECRET_ACCESS_KEY,
  },
});

/** Not guessable, no original filename, grouped per project for the bucket browser. */
export function buildStorageKey(projectId: string, folder: string): string {
  return `projects/${projectId}/${folder}/${crypto.randomUUID()}`;
}

const UPLOAD_URL_EXPIRY_SECONDS = 5 * 60;
const DOWNLOAD_URL_EXPIRY_SECONDS = 5 * 60;

/**
 * A presigned PUT URL for a direct browser upload. Deliberately doesn't sign
 * a Content-Type, so the confirming action can't be bypassed by uploading
 * something other than what was requested and just claiming otherwise — the
 * real type/size are verified server-side afterward via headObject.
 */
export async function getUploadUrl(storageKey: string): Promise<string> {
  return getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: env.SCALEWAY_BUCKET_NAME, Key: storageKey }),
    {
      expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
    },
  );
}

/**
 * RFC 5987-encoded so non-ASCII filenames survive the Content-Disposition
 * header — `filename*` for browsers that support it (all current ones),
 * `filename` as a plain-ASCII fallback for anything that doesn't.
 */
function contentDisposition(filename: string, mode: 'inline' | 'attachment'): string {
  const asciiFallback = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  const encoded = encodeURIComponent(filename);
  return `${mode}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

/**
 * A presigned GET URL, valid briefly, with the response headers set so the
 * browser shows the original filename and decides inline-vs-download based
 * on the file's real type — never the bucket's own object key or metadata.
 */
export async function getDownloadUrl(
  storageKey: string,
  { filename, mimeType }: { filename: string; mimeType: string },
): Promise<string> {
  const disposition = mimeType.startsWith('image/') ? 'inline' : 'attachment';

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: env.SCALEWAY_BUCKET_NAME,
      Key: storageKey,
      ResponseContentDisposition: contentDisposition(filename, disposition),
      ResponseContentType: mimeType,
    }),
    { expiresIn: DOWNLOAD_URL_EXPIRY_SECONDS },
  );
}

export type StoredObject = { size: number; contentType: string };

/** Null when the object doesn't exist — e.g. confirming an upload that never actually happened. */
export async function headObject(storageKey: string): Promise<StoredObject | null> {
  try {
    const result = await client.send(
      new HeadObjectCommand({ Bucket: env.SCALEWAY_BUCKET_NAME, Key: storageKey }),
    );
    return {
      size: result.ContentLength ?? 0,
      contentType: result.ContentType ?? 'application/octet-stream',
    };
  } catch (error) {
    if (error instanceof NotFound) {
      return null;
    }
    throw error;
  }
}

export async function deleteObject(storageKey: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: env.SCALEWAY_BUCKET_NAME, Key: storageKey }));
}
