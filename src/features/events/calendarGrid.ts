import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { nl } from 'date-fns/locale';

import { formatDateOnly, parseDateOnly, splitBrusselsDateTime } from '@/lib/utils';

export type MonthGrid = {
  label: string;
  /** 7 columns (Mon..Sun), each cell a 'yyyy-MM-dd' day in the month or null for the leading/trailing blanks. */
  weeks: (string | null)[][];
  rangeStart: string;
  /** Exclusive — the first day of the next month. */
  rangeEndExclusive: string;
};

export function getMonthGrid(anchorDateOnly: string): MonthGrid {
  const anchor = parseDateOnly(anchorDateOnly)!;
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd }).map((date) =>
    formatDateOnly(date)!,
  );

  // getDay(): 0 = Sunday .. 6 = Saturday. The grid starts on Monday, so shift by one.
  const leadingBlanks = (getDay(monthStart) + 6) % 7;
  const cells: (string | null)[] = [...Array<null>(leadingBlanks).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return {
    label: format(monthStart, 'MMMM yyyy', { locale: nl }),
    weeks,
    rangeStart: formatDateOnly(monthStart)!,
    rangeEndExclusive: formatDateOnly(addMonths(monthStart, 1))!,
  };
}

export function shiftMonth(anchorDateOnly: string, delta: number): string {
  return formatDateOnly(addMonths(parseDateOnly(anchorDateOnly)!, delta))!;
}

export type WeekGrid = {
  label: string;
  /** Monday through Friday — this is an internal work-week agenda, see COMPONENTS.md handoff. */
  days: string[];
  rangeStart: string;
  /** Exclusive — the Saturday after this work week. */
  rangeEndExclusive: string;
};

export function getWeekGrid(anchorDateOnly: string): WeekGrid {
  const anchor = parseDateOnly(anchorDateOnly)!;
  const monday = startOfWeek(anchor, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: monday, end: addDays(monday, 4) }).map((date) =>
    formatDateOnly(date)!,
  );

  return {
    label: `Week van ${format(monday, 'd MMMM yyyy', { locale: nl })}`,
    days,
    rangeStart: formatDateOnly(monday)!,
    rangeEndExclusive: formatDateOnly(addDays(monday, 5))!,
  };
}

export function shiftWeek(anchorDateOnly: string, delta: number): string {
  return formatDateOnly(addWeeks(parseDateOnly(anchorDateOnly)!, delta))!;
}

/** Today through the next 7 days, inclusive — for the admin home page (9a). */
export function getUpcomingWeekRange(todayDateOnly: string): {
  rangeStart: string;
  rangeEndExclusive: string;
} {
  const today = parseDateOnly(todayDateOnly)!;
  return {
    rangeStart: todayDateOnly,
    rangeEndExclusive: formatDateOnly(addDays(today, 8))!,
  };
}

/** Groups events under their Brussels start day — a multi-day event is shown once, on its start day, with the end communicated in its subtitle text (same simplification as the project-detail agenda, 8a). */
export function groupEventsByDay<T extends { startsAt: Date }>(events: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const event of events) {
    const day = splitBrusselsDateTime(event.startsAt).dateOnly;
    const existing = map.get(day);
    if (existing) existing.push(event);
    else map.set(day, [event]);
  }
  return map;
}
