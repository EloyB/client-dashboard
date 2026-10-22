'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { TaskFormSheet, type EditableTask } from './TaskFormSheet';
import { TasksTable, type TaskRow } from './TasksTable';

export function TasksPageContent({
  tasks,
  projectId,
  projectName,
}: {
  tasks: TaskRow[];
  projectId: string;
  projectName: string;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EditableTask | undefined>(undefined);

  function openCreate() {
    setEditingTask(undefined);
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
        primaryAction={
          <Button onClick={openCreate}>
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
              <Button onClick={openCreate}>
                <Plus strokeWidth={1.75} />
                Taak toevoegen
              </Button>
            }
          />
        ) : (
          <TasksTable tasks={tasks} onEditTask={openEdit} />
        )}
      </div>

      <TaskFormSheet
        key={editingTask?.id ?? 'new'}
        projectId={projectId}
        task={editingTask}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </>
  );
}
