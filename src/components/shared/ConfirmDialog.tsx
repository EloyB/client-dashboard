'use client';

import { type LucideIcon, X } from 'lucide-react';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * One dialog for every confirmation, destructive or not — only the primary
 * button's color changes (see COMPONENTS.md "Feedback" and
 * CRUD-patronen.dc.html: verwijderen vraagt de naam te typen, archiveren niet).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Bevestigen',
  confirmIcon: ConfirmIcon,
  cancelLabel = 'Annuleren',
  variant = 'default',
  confirmationText,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  /** Icon shown before confirmLabel, matching the action (e.g. Trash2, UserX). */
  confirmIcon?: LucideIcon;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  /** When set, the confirm button stays disabled until this exact text is typed. */
  confirmationText?: string;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState('');

  function handleOpenChange(next: boolean) {
    if (!next) setTyped('');
    onOpenChange(next);
  }

  const isConfirmDisabled = Boolean(confirmationText) && typed !== confirmationText;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {confirmationText && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-dialog-text">Typ {confirmationText} om te bevestigen</Label>
            <Input
              id="confirm-dialog-text"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>
            <X strokeWidth={1.75} />
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction variant={variant} disabled={isConfirmDisabled} onClick={onConfirm}>
            {ConfirmIcon && <ConfirmIcon strokeWidth={1.75} />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
