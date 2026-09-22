import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { TimelineItem } from '@/components/shared/ListRow';
import type { activityLog } from '@/db/schema';

export function OverviewTab({ activity }: { activity: (typeof activityLog.$inferSelect)[] }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-border-subtle border-b">
          <CardTitle>Komende agenda</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            variant="neutral"
            title="Niets gepland"
            description="Agenda-items voor dit project komen hier terecht."
          />
        </CardContent>
      </Card>

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
