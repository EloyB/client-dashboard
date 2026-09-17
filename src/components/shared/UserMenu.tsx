'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/auth-client';

/**
 * Sidebar footer as a dropdown trigger (see COMPONENTS.md "Voetblok met
 * avatar en gebruikersmenu"). Only "Afmelden" for now — Profiel/Instellingen
 * aren't in CLAUDE.md's slice plan, so no dead menu items for them.
 */
export function UserMenu({ avatar, details }: { avatar: ReactNode; details: ReactNode }) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push('/login');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex min-w-0 flex-1 items-center gap-2 text-left">
        {avatar}
        {details}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top">
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOut className="size-4" />
          Afmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
