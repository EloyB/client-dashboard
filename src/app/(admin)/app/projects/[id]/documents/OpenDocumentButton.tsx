'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { showErrorToast } from '@/components/shared/toast';
import { getFileDownloadUrl } from '@/features/files/actions';

/**
 * Resolves a short-lived presigned URL on click rather than ahead of time —
 * consistent with TicketScreenshots (slice 4/5c/5d). Images and PDFs open
 * inline (see storage.ts's disposition logic); everything else downloads.
 */
export function OpenDocumentButton({
  fileId,
  variant = 'ghost',
}: {
  fileId: string;
  variant?: 'ghost' | 'outline';
}) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    try {
      const url = await getFileDownloadUrl(fileId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      showErrorToast('Openen mislukt', 'Probeer opnieuw.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button type="button" variant={variant} size="sm" onClick={handleClick} disabled={isLoading}>
      {isLoading ? <Loader2 className="animate-spin" strokeWidth={1.75} /> : null}
      Openen
    </Button>
  );
}
