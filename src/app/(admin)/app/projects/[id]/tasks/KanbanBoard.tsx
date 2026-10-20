'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { showErrorToast, showSuccessToast } from '@/components/shared/toast';
import type { Priority, TaskStatus } from '@/db/schema';
import { moveTask } from '@/features/tasks/actions';
import { cn, parseDateOnly } from '@/lib/utils';
import { KanbanCardContent } from './KanbanCard';
import { KanbanColumn } from './KanbanColumn';
import type { TaskRow } from './TasksTable';

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

const priorityOptions: { value: 'all' | Priority; label: string }[] = [
  { value: 'all', label: 'Alle prioriteiten' },
  { value: 'high', label: 'Hoog' },
  { value: 'medium', label: 'Middel' },
  { value: 'low', label: 'Laag' },
];

function isOverdue(task: TaskRow): boolean {
  const date = parseDateOnly(task.dueDate);
  if (!date || task.status === 'done') return false;
  return date < new Date(new Date().toDateString());
}

function groupByStatus(tasks: TaskRow[]): Record<TaskStatus, TaskRow[]> {
  const groups: Record<TaskStatus, TaskRow[]> = { todo: [], in_progress: [], review: [], done: [] };
  for (const task of tasks) groups[task.status].push(task);
  return groups;
}

function findContainer(columns: Record<TaskStatus, TaskRow[]>, id: string): TaskStatus | undefined {
  if ((STATUS_ORDER as string[]).includes(id)) return id as TaskStatus;
  return STATUS_ORDER.find((status) => columns[status].some((task) => task.id === id));
}

export function KanbanBoard({
  tasks,
  onEditTask,
  onAddTask,
}: {
  tasks: TaskRow[];
  onEditTask: (task: TaskRow) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  const router = useRouter();
  const [prevTasks, setPrevTasks] = useState(tasks);
  const [columns, setColumns] = useState<Record<TaskStatus, TaskRow[]>>(() => groupByStatus(tasks));
  const [activeTask, setActiveTask] = useState<TaskRow | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const snapshotRef = useRef(columns);

  // Re-derive columns when the server hands us a fresh `tasks` prop (after
  // router.refresh()) — adjusted during render, not in an effect, per React's
  // own guidance for state derived from props.
  if (tasks !== prevTasks) {
    setPrevTasks(tasks);
    setColumns(groupByStatus(tasks));
  }

  const filteredColumns = useMemo(() => {
    const matches = (task: TaskRow) =>
      (priorityFilter === 'all' || task.priority === priorityFilter) &&
      (!overdueOnly || isOverdue(task));

    const result: Record<TaskStatus, TaskRow[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };
    for (const status of STATUS_ORDER) {
      result[status] = columns[status].filter(matches);
    }
    return result;
  }, [columns, priorityFilter, overdueOnly]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(event: DragStartEvent) {
    snapshotRef.current = columns;
    const container = findContainer(columns, event.active.id as string);
    const task = container && columns[container].find((item) => item.id === event.active.id);
    setActiveTask(task || null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(columns, active.id as string);
    const overContainer = findContainer(columns, over.id as string);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setColumns((previous) => {
      const activeItems = previous[activeContainer];
      const overItems = previous[overContainer];
      const activeIndex = activeItems.findIndex((task) => task.id === active.id);
      if (activeIndex === -1) return previous;
      const overIndex = overItems.findIndex((task) => task.id === over.id);
      const newIndex = overIndex >= 0 ? overIndex : overItems.length;

      const movingTask = { ...activeItems[activeIndex], status: overContainer };
      return {
        ...previous,
        [activeContainer]: activeItems.filter((task) => task.id !== active.id),
        [overContainer]: [
          ...overItems.slice(0, newIndex),
          movingTask,
          ...overItems.slice(newIndex),
        ],
      };
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) {
      setColumns(snapshotRef.current);
      return;
    }

    // onDragOver already migrates the item across columns live, so by the
    // time onDragEnd fires, `columns` already reflects a cross-column move —
    // comparing containers against that mutated state would always look like
    // "same container". Compare against the pre-drag snapshot instead to
    // tell a same-column reorder (state untouched by onDragOver) apart from
    // a cross-column move (state already updated).
    const startContainer = findContainer(snapshotRef.current, active.id as string);
    if (!startContainer) return;
    const currentContainer = findContainer(columns, active.id as string) ?? startContainer;

    let finalColumns = columns;

    if (startContainer === currentContainer) {
      const items = columns[currentContainer];
      const activeIndex = items.findIndex((task) => task.id === active.id);
      let overIndex = items.findIndex((task) => task.id === over.id);
      if (overIndex === -1) overIndex = items.length - 1;
      if (activeIndex === overIndex) return;
      finalColumns = { ...columns, [currentContainer]: arrayMove(items, activeIndex, overIndex) };
      setColumns(finalColumns);
    }

    const finalList = finalColumns[currentContainer];
    const finalIndex = finalList.findIndex((task) => task.id === active.id);
    const previousTask = finalIndex > 0 ? finalList[finalIndex - 1] : null;
    const nextTask = finalIndex < finalList.length - 1 ? finalList[finalIndex + 1] : null;

    const result = await moveTask({
      taskId: active.id as string,
      status: currentContainer,
      previousTaskId: previousTask?.id ?? null,
      nextTaskId: nextTask?.id ?? null,
    });

    if (!result.success) {
      showErrorToast('Verplaatsen mislukt', result.formError);
      setColumns(snapshotRef.current);
      return;
    }
    showSuccessToast('Taak verplaatst');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Select
          value={priorityFilter}
          onValueChange={(value) => setPriorityFilter(value as 'all' | Priority)}
        >
          <SelectTrigger className="w-48" aria-label="Prioriteit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={() => setOverdueOnly((current) => !current)}
          className={cn(
            'text-body flex h-9 items-center gap-1.5 rounded-full border px-3.5 whitespace-nowrap',
            overdueOnly
              ? 'border-transparent bg-neutral-900 text-white'
              : 'border-border-strong bg-card text-foreground',
          )}
        >
          Alleen vervallen
        </button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
          {STATUS_ORDER.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={filteredColumns[status]}
              onEditTask={onEditTask}
              onAddTask={onAddTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="w-72">
              <KanbanCardContent task={activeTask} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
