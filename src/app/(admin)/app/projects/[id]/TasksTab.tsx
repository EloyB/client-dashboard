import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListRow } from '@/components/shared/ListRow';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Priority, TaskStatus } from '@/db/schema';
import { cn, parseDateOnly } from '@/lib/utils';

export type OpenTaskRow = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
};

function isOverdue(dueDate: string | null): boolean {
  const date = parseDateOnly(dueDate);
  return date ? date < new Date(new Date().toDateString()) : false;
}

/** Compact view of the project's open tasks — the full list lives at /app/projects/[id]/tasks. */
export function TasksTab({ tasks, projectId }: { tasks: OpenTaskRow[]; projectId: string }) {
  return (
    <Card>
      <CardHeader className="border-border-subtle border-b">
        <CardTitle>Taken</CardTitle>
        {tasks.length > 0 && (
          <CardAction>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/app/projects/${projectId}/tasks`}>Alles bekijken</Link>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col">
        {tasks.length === 0 ? (
          <EmptyState
            variant="positive"
            title="Geen openstaande taken"
            description="Alles is afgerond, of er zijn nog geen taken aangemaakt."
          />
        ) : (
          tasks.map((task) => (
            <ListRow
              key={task.id}
              title={task.title}
              subtitle={
                <span className={cn(isOverdue(task.dueDate) && 'text-destructive font-semibold')}>
                  {task.dueDate
                    ? format(parseDateOnly(task.dueDate)!, 'd MMM yyyy', { locale: nl })
                    : 'Geen vervaldatum'}
                </span>
              }
              trailing={
                <div className="flex items-center gap-1.5">
                  <StatusBadge domain="priority" priority={task.priority} />
                  <StatusBadge domain="task" status={task.status} />
                </div>
              }
              className="border-border-subtle border-b py-3 last:border-0"
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
