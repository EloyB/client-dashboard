'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbox } from '@/components/shared/Lightbox';
import { getFileDownloadUrl } from '@/features/files/actions';
import type { PortalTicketAttachment } from '@/features/tickets/queries';

function sizeLabel(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Fetches a presigned URL per attachment once, on mount — used for both the
 * thumbnail and the lightbox (there's no separate thumbnail asset, it's the
 * same image). URLs expire after 5 minutes (see slice 4's storage.ts); a
 * page left open longer than that needs a refresh before opening one.
 */
export function TicketScreenshots({ attachments }: { attachments: PortalTicketAttachment[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      attachments.map(async (attachment) => {
        try {
          const url = await getFileDownloadUrl(attachment.id);
          return [attachment.id, url] as const;
        } catch {
          return [attachment.id, null] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      const resolved = entries.filter((entry): entry is [string, string] => entry[1] !== null);
      setUrls(Object.fromEntries(resolved));
    });
    return () => {
      cancelled = true;
    };
  }, [attachments]);

  const openAttachment = openIndex !== null ? attachments[openIndex] : null;

  return (
    <Card>
      <CardHeader className="border-border-subtle border-b">
        <CardTitle>Schermafbeeldingen</CardTitle>
        <p className="text-small text-muted-foreground">
          Klik een afbeelding om ze groter te bekijken.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          {attachments.map((attachment, index) => (
            <button
              key={attachment.id}
              type="button"
              onClick={() => setOpenIndex(index)}
              className="flex w-40 flex-col gap-1.5 text-left"
            >
              <div className="bg-muted border-border flex h-28 items-center justify-center overflow-hidden rounded-lg border">
                {urls[attachment.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a short-lived presigned URL, not a static/optimizable asset
                  <img
                    src={urls[attachment.id]}
                    alt={attachment.filename}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Loader2
                    className="text-muted-foreground size-5 animate-spin"
                    strokeWidth={1.75}
                  />
                )}
              </div>
              <span className="text-small text-muted-foreground truncate">
                {attachment.filename}
              </span>
            </button>
          ))}
        </div>
      </CardContent>

      <Lightbox
        open={openAttachment !== null}
        onOpenChange={(next) => {
          if (!next) setOpenIndex(null);
        }}
        filename={openAttachment?.filename ?? ''}
        imageUrl={openAttachment ? (urls[openAttachment.id] ?? null) : null}
        meta={openAttachment ? sizeLabel(openAttachment.size) : undefined}
      />
    </Card>
  );
}
