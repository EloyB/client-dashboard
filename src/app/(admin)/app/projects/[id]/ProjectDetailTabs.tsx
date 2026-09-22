'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TAB_VALUES = ['overzicht', 'taken', 'tickets', 'documenten'] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isTabValue(value: string | null): value is TabValue {
  return TAB_VALUES.includes(value as TabValue);
}

/**
 * Keeps the active tab in the URL (`?tab=`) so it survives a reload, the
 * same idea as ProjectsTable's `?archived=` — plain useSearchParams rather
 * than useDataTableUrlState, since this isn't a DataTable filter.
 */
export function ProjectDetailTabs({
  overzicht,
  taken,
  tickets,
  documenten,
}: {
  overzicht: ReactNode;
  taken: ReactNode;
  tickets: ReactNode;
  documenten: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab: TabValue = isTabValue(searchParams.get('tab'))
    ? (searchParams.get('tab') as TabValue)
    : 'overzicht';

  function setActiveTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'overzicht') params.delete('tab');
    else params.set('tab', value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="overzicht">Overzicht</TabsTrigger>
        <TabsTrigger value="taken">Taken</TabsTrigger>
        <TabsTrigger value="tickets">Tickets</TabsTrigger>
        <TabsTrigger value="documenten">Documenten</TabsTrigger>
      </TabsList>
      <TabsContent value="overzicht">{overzicht}</TabsContent>
      <TabsContent value="taken">{taken}</TabsContent>
      <TabsContent value="tickets">{tickets}</TabsContent>
      <TabsContent value="documenten">{documenten}</TabsContent>
    </Tabs>
  );
}
