'use client';

import { useState } from 'react';

import { showErrorToast } from '@/components/shared/toast';
import { getFileDownloadUrl } from '@/features/files/actions';

/**
 * Resolves a short-lived presigned URL on click rather than ahead of time —
 * consistent with TicketScreenshots. Shared by every document list that
 * opens a file by clicking its row (the full project document list and the
 * compact Documenten tab on project detail), instead of a dedicated
 * "Openen" button.
 */
export function useOpenFile() {
  const [openingId, setOpeningId] = useState<string | null>(null);

  async function open(id: string, fileId: string) {
    setOpeningId(id);
    try {
      const url = await getFileDownloadUrl(fileId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      showErrorToast('Openen mislukt', 'Probeer opnieuw.');
    } finally {
      setOpeningId(null);
    }
  }

  return { open, openingId };
}
