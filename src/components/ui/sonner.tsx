'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from 'lucide-react';

import { useIsDesktop } from '@/components/shared/useIsDesktop';

const Toaster = ({ ...props }: ToasterProps) => {
  const isDesktop = useIsDesktop();

  return (
    <Sonner
      theme="light"
      position={isDesktop ? 'bottom-right' : 'top-center'}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          // --popover/--popover-foreground/--border are raw HSL triplets
          // (e.g. "0 0% 100%"), meant to be wrapped in hsl(...) — Sonner
          // applies --normal-bg etc. directly as CSS colors, so without the
          // wrapper here the value is invalid CSS and renders transparent.
          '--normal-bg': 'hsl(var(--popover))',
          '--normal-text': 'hsl(var(--popover-foreground))',
          '--normal-border': 'hsl(var(--border))',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      toastOptions={{
        // Sonner injects its own unlayered <style> tag for the base toast
        // background/border, which always wins over Tailwind's @layer
        // utilities classes regardless of specificity — the `!` modifier
        // forces !important so these actually override it.
        classNames: {
          toast: 'cn-toast border-none!',
          success: 'bg-success-muted!',
          error: 'bg-destructive-muted!',
          warning: 'bg-warning-muted!',
          info: 'bg-info-muted!',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
