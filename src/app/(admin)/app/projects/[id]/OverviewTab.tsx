import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimelineItem } from '@/components/shared/ListRow';
import type { activityLog } from '@/db/schema';
import type { AgendaEvent } from '@/features/events/helpers';
import { AgendaCard } from './AgendaCard';

export function OverviewTab({
  activity,
  events,
  projectId,
}: {
  activity: (typeof activityLog.$inferSelect)[];
  events: AgendaEvent[];
  projectId: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <AgendaCard events={events} projectId={projectId} />

      <Card>
        <CardHeader className="border-border-subtle border-b">
          <CardTitle>Recente activiteit</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-body text-muted-foreground">Nog geen activiteit.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {activity.map((entry) => (
                <TimelineItem
                  key={entry.id}
                  timestamp={formatDistanceToNow(entry.createdAt, { locale: nl, addSuffix: true })}
                >
                  {entry.description}
                </TimelineItem>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
