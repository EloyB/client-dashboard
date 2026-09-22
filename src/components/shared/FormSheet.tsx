'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useIsDesktop } from '@/components/shared/useIsDesktop';
import { cn } from '@/lib/utils';

/**
 * The Sheet form pattern from CRUD-patronen.dc.html: a right-side panel on
 * desktop (context behind it stays visible), a bottom sheet on mobile. Same
 * fixed header/scrolling middle/fixed footer shape as FormDialog.
 */
export function FormSheet({
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
  const isDesktop = useIsDesktop();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? 'right' : 'bottom'}
        className="flex flex-col gap-0 data-[side=bottom]:max-h-[85vh] data-[side=right]:sm:max-w-[460px]"
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <div className="flex-1 overflow-x-hidden overflow-y-auto px-4">
          <div className="flex flex-col gap-4 pb-4">{children}</div>
        </div>

        {/* col-reverse + row keeps one DOM order ([cancel, primary]) working for
            both layouts: mobile stacks primary on top, desktop puts it on the right. */}
        <SheetFooter className="border-border-subtle flex-col-reverse gap-2 border-t sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel ?? (() => onOpenChange(false))}
            className={cn(!isDesktop && 'w-full')}
          >
            <X strokeWidth={1.75} />
            {cancelLabel}
          </Button>
          {primaryAction}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
