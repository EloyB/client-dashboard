'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * The Dialog form pattern from CRUD-patronen.dc.html: one decision or one
 * field (rename, choose status) — never a full multi-section form, that's
 * FormSheet or a full page instead.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  primaryAction,
  cancelLabel = 'Annuleren',
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  primaryAction: ReactNode;
  cancelLabel?: string;
  onCancel?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="flex flex-col gap-4">{children}</div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel ?? (() => onOpenChange(false))}>
            {cancelLabel}
          </Button>
          {primaryAction}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
