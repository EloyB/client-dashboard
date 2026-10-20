'use client';

import { Calendar, FolderPlus, ListTodo } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EventFormSheet } from '@/app/(admin)/app/projects/[id]/EventFormSheet';
import { TaskFormSheet } from '@/app/(admin)/app/projects/[id]/tasks/TaskFormSheet';

export function QuickActions({ projects }: { projects: { id: string; name: string }[] }) {
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [eventSheetOpen, setEventSheetOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:flex">
        <Button onClick={() => setTaskSheetOpen(true)}>
          <ListTodo strokeWidth={1.75} />
          Taak
        </Button>
        <Button variant="outline" asChild>
          <Link href="/app/projects/new">
            <FolderPlus strokeWidth={1.75} />
            Project
          </Link>
        </Button>
        <Button variant="outline" onClick={() => setEventSheetOpen(true)}>
          <Calendar strokeWidth={1.75} />
          Agenda-item
        </Button>
      </div>

      <TaskFormSheet projects={projects} open={taskSheetOpen} onOpenChange={setTaskSheetOpen} />
      <EventFormSheet projects={projects} open={eventSheetOpen} onOpenChange={setEventSheetOpen} />
    </>
  );
}
