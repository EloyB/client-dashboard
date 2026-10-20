'use client';

import { LayoutGrid, List, Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { useIsDesktop } from '@/components/shared/useIsDesktop';
import type { TaskStatus } from '@/db/schema';
import { KanbanBoard } from './KanbanBoard';
import { MobileKanbanBoard } from './MobileKanbanBoard';
import { TaskFormSheet, type EditableTask } from './TaskFormSheet';
import { TasksTable, type TaskRow } from './TasksTable';

const VIEW_VALUES = ['list', 'board'] as const;
type View = (typeof VIEW_VALUES)[number];

function isView(value: string | null): value is View {
  return (VIEW_VALUES as readonly string[]).includes(value ?? '');
}

/**
 * Lijst and bord are two views of the same route, per INDEX.md's note — not
 * two nav destinations. `?view=` keeps the choice in the URL; list (7a) stays
 * the default for a bare URL, board (7b) is opt-in via the toggle.
 */
export function TasksPageContent({
  tasks,
  projectId,
  projectName,
}: {
  tasks: TaskRow[];
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view: View = isView(searchParams.get('view')) ? (searchParams.get('view') as View) : 'list';
  // The board renders differently per breakpoint (side-by-side columns on
  // desktop, one column at a time with a switcher on mobile — see 7c) —
  // the `view` choice itself is the same for both.
  const isDesktop = useIsDesktop();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EditableTask | undefined>(undefined);
  const [createStatus, setCreateStatus] = useState<TaskStatus>('todo');

  function setView(next: View) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'list') params.delete('view');
    else params.set('view', next);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function openCreate(status: TaskStatus = 'todo') {
    setEditingTask(undefined);
    setCreateStatus(status);
    setFormOpen(true);
  }

  function openEdit(task: EditableTask) {
    setEditingTask(task);
    setFormOpen(true);
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Projecten', href: '/app/projects' },
          { label: projectName, href: `/app/projects/${projectId}` },
          { label: 'Taken' },
        ]}
        title="Taken"
        badges={
          tasks.length > 0 && (
            <span className="text-body text-muted-foreground font-normal">
              {tasks.length} {tasks.length === 1 ? 'taak' : 'taken'} · {projectName}
            </span>
          )
        }
        secondaryAction={
          <div className="flex overflow-hidden rounded-lg border">
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-none"
              aria-label="Lijst"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
            >
              <List strokeWidth={1.75} />
            </Button>
            <Button
              variant={view === 'board' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-none"
              aria-label="Bord"
              aria-pressed={view === 'board'}
              onClick={() => setView('board')}
            >
              <LayoutGrid strokeWidth={1.75} />
            </Button>
          </div>
        }
        primaryAction={
          <Button onClick={() => openCreate()}>
            <Plus strokeWidth={1.75} />
            Taak toevoegen
          </Button>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8">
        {tasks.length === 0 ? (
          <EmptyState
            variant="invite"
            title="Nog geen taken"
            description="Taken voor dit project komen hier terecht."
            action={
              <Button onClick={() => openCreate()}>
                <Plus strokeWidth={1.75} />
                Taak toevoegen
              </Button>
            }
          />
        ) : view === 'board' ? (
          isDesktop ? (
            <KanbanBoard tasks={tasks} onEditTask={openEdit} onAddTask={openCreate} />
          ) : (
            <MobileKanbanBoard tasks={tasks} onEditTask={openEdit} onAddTask={openCreate} />
          )
        ) : (
          <TasksTable tasks={tasks} onEditTask={openEdit} />
        )}
      </div>

      <TaskFormSheet
        key={editingTask?.id ?? `new-${createStatus}`}
        projectId={projectId}
        task={editingTask}
        defaultStatus={createStatus}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </>
  );
}
