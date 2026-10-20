import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

import { parseDateOnly, splitBrusselsDateTime } from '@/lib/utils';

export type AgendaEvent = {
  id: string;
  title: string;
  description: string | null;
  type: 'deadline' | 'meeting' | 'milestone' | 'other';
  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
  location: string | null;
  visibleToClient: boolean;
};

/** An event without an explicit end is "past" once it starts; one with an end stays current until that end passes. */
export function isPastEvent(event: AgendaEvent, now: Date): boolean {
  return (event.endsAt ?? event.startsAt) < now;
}

/** A missed deadline stays in the upcoming list (styled destructive) rather than fading into "past" — it still needs attention. */
export function isOverdueDeadline(event: AgendaEvent, now: Date): boolean {
  return event.type === 'deadline' && isPastEvent(event, now);
}

export function splitUpcomingAndPast<T extends AgendaEvent>(
  events: T[],
  now: Date,
): { upcoming: T[]; past: T[] } {
  const upcoming = events
    .filter((event) => !isPastEvent(event, now) || isOverdueDeadline(event, now))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const past = events
    .filter((event) => isPastEvent(event, now) && event.type !== 'deadline')
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
  return { upcoming, past };
}

export function dateBlockParts(event: AgendaEvent): { month: string; day: string } {
  const { dateOnly } = splitBrusselsDateTime(event.startsAt);
  const date = parseDateOnly(dateOnly)!;
  return { month: format(date, 'MMM', { locale: nl }), day: format(date, 'd') };
}

export const typeLabels: Record<AgendaEvent['type'], string> = {
  deadline: 'Deadline',
  meeting: 'Overleg',
  milestone: 'Mijlpaal',
  other: 'Andere',
};

export const typeOrder: AgendaEvent['type'][] = ['deadline', 'meeting', 'milestone', 'other'];

/** "10:00 – 11:00 · videocall" / "Hele dag · intern kantoor" / "Hele dag · t/m 3 okt". */
export function eventSubtitle(event: AgendaEvent): string {
  const start = splitBrusselsDateTime(event.startsAt);
  const end = event.endsAt ? splitBrusselsDateTime(event.endsAt) : null;

  let timeLabel: string;
  if (event.allDay) {
    timeLabel =
      end && end.dateOnly !== start.dateOnly
        ? `Hele dag · t/m ${format(parseDateOnly(end.dateOnly)!, 'd MMM', { locale: nl })}`
        : 'Hele dag';
  } else if (!end) {
    timeLabel = start.time;
  } else if (end.dateOnly === start.dateOnly) {
    timeLabel = `${start.time} – ${end.time}`;
  } else {
    timeLabel = `${start.time} – ${format(parseDateOnly(end.dateOnly)!, 'd MMM', { locale: nl })} ${end.time}`;
  }

  return event.location ? `${timeLabel} · ${event.location}` : timeLabel;
}

/** "10:00 – 11:00" / "Hele dag" — just the time portion, for compact calendar chips. */
export function eventTimeLabel(event: AgendaEvent): string {
  const start = splitBrusselsDateTime(event.startsAt);
  const end = event.endsAt ? splitBrusselsDateTime(event.endsAt) : null;

  if (event.allDay) return 'Hele dag';
  if (!end) return start.time;
  if (end.dateOnly === start.dateOnly) return `${start.time} – ${end.time}`;
  return `${start.time} – ${format(parseDateOnly(end.dateOnly)!, 'd MMM', { locale: nl })} ${end.time}`;
}
