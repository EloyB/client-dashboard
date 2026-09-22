'use client';

import { Archive } from 'lucide-react';
import { useState } from 'react';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { showErrorToast, showSuccessToast } from '@/components/shared/toast';
import { archiveProject } from '@/features/projects/actions';
import type { ProjectStatus } from '@/db/schema';

/**
 * Shared between ProjectForm's overflow menu and the project detail page's —
 * both need the same "Archiveren" menu item + confirmation dialog, per
 * CLAUDE.md's "extract on second occurrence".
 */
export function useArchiveProjectAction({
  projectId,
  projectName,
  currentStatus,
  onArchived,
}: {
  projectId: string;
  projectName: string;
  currentStatus: ProjectStatus;
  onArchived: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  async function handleConfirm() {
    setIsArchiving(true);
    try {
      await archiveProject(projectId);
      showSuccessToast('Project gearchiveerd');
      setOpen(false);
      onArchived();
    } catch (error) {
      showErrorToast('Archiveren mislukt', error instanceof Error ? error.message : undefined);
    } finally {
      setIsArchiving(false);
    }
  }

  const menuItem = currentStatus !== 'archived' && (
    <DropdownMenuItem onSelect={() => setOpen(true)}>
      <Archive strokeWidth={1.75} />
      Archiveren
    </DropdownMenuItem>
  );

  const dialog = (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title="Project archiveren?"
      description={`${projectName} verdwijnt uit het standaardoverzicht, maar blijft bewaard.`}
      confirmLabel={isArchiving ? 'Bezig...' : 'Archiveren'}
      confirmIcon={Archive}
      onConfirm={handleConfirm}
    />
  );

  return { menuItem, dialog };
}
