import { headers } from 'next/headers';

import type { EventType } from '@/db/schema';
import { getMonthGrid, getWeekGrid } from '@/features/events/calendarGrid';
import { listEventsForCalendar } from '@/features/events/queries.admin';
import { listProjects } from '@/features/projects/queries';
import { combineBrusselsDateTime, todayInBrussels } from '@/lib/utils';
import { CalendarPageContent } from './CalendarPageContent';

const EVENT_TYPES: EventType[] = ['deadline', 'meeting', 'milestone', 'other'];

function isEventType(value: string | undefined): value is EventType {
  return EVENT_TYPES.includes(value as EventType);
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const today = todayInBrussels();

  const view = params.view === 'week' ? 'week' : 'month';
  const dateParam = typeof params.date === 'string' ? params.date : undefined;
  const anchor = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;
  const projectParam = typeof params.project === 'string' ? params.project : undefined;
  const projectId = projectParam && projectParam !== 'all' ? projectParam : undefined;
  const typeParam = typeof params.type === 'string' ? params.type : undefined;
  const type = isEventType(typeParam) ? typeParam : undefined;

  const monthGrid = getMonthGrid(anchor);
  const weekGrid = getWeekGrid(anchor);
  const activeGrid = view === 'week' ? weekGrid : monthGrid;

  const [events, projectRows] = await Promise.all([
    listEventsForCalendar(requestHeaders, {
      start: combineBrusselsDateTime(activeGrid.rangeStart),
      end: combineBrusselsDateTime(activeGrid.rangeEndExclusive),
      projectId,
      type,
    }),
    listProjects(requestHeaders),
  ]);

  const projects = projectRows.map((project) => ({ id: project.id, name: project.name }));

  return (
    <CalendarPageContent
      view={view}
      anchor={anchor}
      monthGrid={monthGrid}
      weekGrid={weekGrid}
      events={events}
      today={today}
      projects={projects}
      activeProjectId={projectId}
      activeType={type}
    />
  );
}
