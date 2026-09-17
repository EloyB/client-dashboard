'use client';

import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';

export function BackButton({ children, ...props }: Omit<ComponentProps<typeof Button>, 'onClick'>) {
  const router = useRouter();

  return (
    <Button {...props} onClick={() => router.back()}>
      {children}
    </Button>
  );
}
