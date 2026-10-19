'use client';

import { Loader2 } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * Full-size image preview from a thumbnail click, per COMPONENTS.md
 * ("Lightbox — schermafbeelding op volle grootte, portaal en beheer") — a
 * thin wrapper around the shared Dialog primitive rather than a bespoke
 * overlay, so it gets focus-trapping and Escape-to-close for free.
 */
export function Lightbox({
  open,
  onOpenChange,
  filename,
  imageUrl,
  meta,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filename: string;
  imageUrl: string | null;
  meta?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-border-subtle flex-row items-center gap-2 border-b p-4">
          <DialogTitle className="truncate pr-6 text-left">{filename}</DialogTitle>
        </DialogHeader>
        <div className="bg-muted flex min-h-80 items-center justify-center">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- a short-lived presigned URL, not a static/optimizable asset
            <img src={imageUrl} alt={filename} className="max-h-[70vh] w-full object-contain" />
          ) : (
            <Loader2 className="text-muted-foreground size-6 animate-spin" strokeWidth={1.75} />
          )}
        </div>
        {meta && (
          <div className="text-small text-muted-foreground flex items-center justify-between gap-3 p-4">
            <span>{meta}</span>
            {imageUrl && (
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold"
              >
                Downloaden
              </a>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
