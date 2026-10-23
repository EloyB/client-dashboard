'use client';

import { Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { taskStatusConfig } from '@/components/shared/StatusBadge';
import {
  TaskFormSheet,
  type EditableTask,
} from '@/app/(admin)/app/projects/[id]/tasks/TaskFormSheet';
import { Pill } from '@/app/(admin)/app/projects/[id]/tasks/Pill';
import type { TaskStatus } from '@/db/schema';
import {
  DEADLINE_GROUPS,
  deadlineGroupLabels,
  groupTasksByDeadline,
} from '@/features/tasks/grouping';
import type { AllTasksRow as AllTasksRowData } from '@/features/tasks/queries';
import { AllTasksRow } from './AllTasksRow';

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

function isTaskStatus(value: string | null): value is TaskStatus {
  return (STATUS_ORDER as string[]).includes(value ?? '');
}

export function AllTasksPageContent({
  tasks,
  today,
  projects,
}: {
  tasks: AllTasksRowData[];
  /** Europe/Brussels' today, computed server-side (7e). */
  today: string;
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const statusFilter: TaskStatus | 'all' = isTaskStatus(searchParams.get('status'))
    ? (searchParams.get('status') as TaskStatus)
    : 'all';
  const projectFilter = searchParams.get('project') ?? 'all';
  const clientFilter = searchParams.get('client') ?? 'all';

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EditableTask | undefined>(undefined);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function openCreate() {
    setEditingTask(undefined);
    setFormOpen(true);
  }

  function openEdit(task: EditableTask) {
    setEditingTask(task);
    setFormOpen(true);
  }

  const clientOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const task of tasks) seen.set(task.clientId, task.clientName);
    return Array.from(seen, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [tasks]);

  const statusCounts = useMemo(() => {
    const counts: Record<TaskStatus, number> = { todo: 0, in_progress: 0, review: 0, done: 0 };
    for (const task of tasks) counts[task.status]++;
    return counts;
  }, [tasks]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (statusFilter === 'all' || task.status === statusFilter) &&
          (projectFilter === 'all' || task.projectId === projectFilter) &&
          (clientFilter === 'all' || task.clientId === clientFilter),
      ),
    [tasks, statusFilter, projectFilter, clientFilter],
  );

  const groups = useMemo(() => groupTasksByDeadline(filteredTasks, today), [filteredTasks, today]);

  return (
    <>
      <PageHeader
        title="Al mijn taken"
        badges={
          tasks.length > 0 && (
            <span className="text-body text-muted-foreground font-normal">
              {tasks.length} {tasks.length === 1 ? 'taak' : 'taken'} over alle projecten
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

      <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
        {tasks.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Pill
                label="Alle"
                count={tasks.length}
                active={statusFilter === 'all'}
                onClick={() => setParam('status', 'all')}
              />
              {STATUS_ORDER.map((status) => (
                <Pill
                  key={status}
                  label={taskStatusConfig[status].label}
                  count={statusCounts[status]}
                  active={statusFilter === status}
                  onClick={() => setParam('status', status)}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Select value={clientFilter} onValueChange={(value) => setParam('client', value)}>
                <SelectTrigger className="w-full sm:w-48" aria-label="Alle klanten">
                  <SelectValue placeholder="Alle klanten" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle klanten</SelectItem>
                  {clientOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={projectFilter} onValueChange={(value) => setParam('project', value)}>
                <SelectTrigger className="w-full sm:w-48" aria-label="Alle projecten">
                  <SelectValue placeholder="Alle projecten" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle projecten</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {tasks.length === 0 ? (
          <EmptyState
            variant="positive"
            title="Geen taken"
            description="Taken verschijnen hier zodra je er één aanmaakt, voor eender welk project."
          />
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            variant="filtered"
            title="Geen taken met deze filters"
            description="Pas de filters aan om meer resultaten te zien."
          />
        ) : (
          DEADLINE_GROUPS.map((group) =>
            groups[group].length === 0 ? null : (
              <div key={group} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-h3">{deadlineGroupLabels[group]}</h2>
                  <span className="text-small text-muted-foreground">{groups[group].length}</span>
                </div>
                <div className="border-border bg-card rounded-xl border px-4">
                  {groups[group].map((task) => (
                    <AllTasksRow key={task.id} task={task} onEditTask={openEdit} />
                  ))}
                </div>
              </div>
            ),
          )
        )}
      </div>

      <TaskFormSheet
        key={editingTask?.id ?? 'new'}
        projects={projects}
        task={editingTask}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </>
  );
}
