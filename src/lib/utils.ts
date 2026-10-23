import { createCn } from 'cn/config';
import { format } from 'date-fns';

// Our custom type-scale utilities (overline/small/body/h3/h2/h1/display, see
// docs/design/globals.css) share the "text-" prefix with color utilities.
// Without this, cn() treats them as conflicting text-color classes and
// silently drops whichever comes first (e.g. `text-primary-foreground
// text-small` loses the color).
export const cn = createCn({
  extend: {
    classGroups: {
      'font-size': [{ text: ['overline', 'small', 'body', 'h3', 'h2', 'h1', 'display'] }],
    },
  },
});

/** First letter of the first two words, e.g. "Verlinden & Zn" -> "VZ". */
export function initialsFromName(name: string): string {
  const [first, second] = name.split(' ');
  return `${first?.charAt(0) ?? ''}${second?.charAt(0) ?? ''}`.toUpperCase();
}

/**
 * A `date`-column value ('yyyy-MM-dd') <-> the `Date` object DateField needs.
 * Parsing with an explicit local midnight (rather than a bare date string,
 * which JS parses as UTC) and formatting with date-fns (local time, unlike
 * `toISOString`) keeps this stable across Europe/Brussels' UTC+1/+2 offset —
 * either direction can otherwise shift the date shown by one day.
 */
export function parseDateOnly(value: string | null): Date | undefined {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00`);
}

export function formatDateOnly(date: Date | undefined): string | null {
  if (!date) return null;
  return format(date, 'yyyy-MM-dd');
}

/**
 * Today's calendar date ('yyyy-MM-dd') in Europe/Brussels, regardless of the
 * server's own timezone — matters right around midnight, where a naive
 * `new Date().toDateString()` on a UTC server can report yesterday's or
 * tomorrow's date instead (see the "al mijn taken" deadline grouping, 7e).
 * `en-CA` is a locale that happens to format dates as yyyy-MM-dd.
 */
export function todayInBrussels(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(now);
}

/** Goeiemorgen/Goeiemiddag/Goeieavond for the admin home page (9a), by Europe/Brussels wall-clock hour. */
export function greetingForBrusselsHour(now: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Brussels',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(now),
  );
  if (hour < 12) return 'Goeiemorgen';
  if (hour < 18) return 'Goeiemiddag';
  return 'Goeieavond';
}

/** Europe/Brussels' own UTC offset (in minutes) at a given instant — +60 (CET) or +120 (CEST). */
function brusselsOffsetMinutes(at: Date): number {
  const offsetPart = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Brussels',
    timeZoneName: 'shortOffset',
  })
    .formatToParts(at)
    .find((part) => part.type === 'timeZoneName')?.value;
  const hours = Number(offsetPart?.match(/GMT([+-]\d+)/)?.[1] ?? 0);
  return hours * 60;
}

/**
 * A ('yyyy-MM-dd', 'HH:mm') pair — both already unambiguous, timezone-free
 * strings (see DateTimeField) — combined into the one real instant that
 * represents that wall-clock moment in Europe/Brussels, regardless of the
 * server's own timezone. Used for event start/end times (8a): a client never
 * sends an already-combined Date, precisely to avoid the all-day Dec-31
 * shifting-to-Dec-30 trap a naive combination is prone to right at the
 * UTC+1/+2 boundary.
 */
export function combineBrusselsDateTime(dateOnly: string, time: string = '00:00'): Date {
  const naiveUtc = new Date(`${dateOnly}T${time}:00Z`);
  return new Date(naiveUtc.getTime() - brusselsOffsetMinutes(naiveUtc) * 60 * 1000);
}

/** The inverse of `combineBrusselsDateTime` — splits a real instant back into Brussels' own date and time strings, for pre-filling an edit form. */
export function splitBrusselsDateTime(date: Date): { dateOnly: string; time: string } {
  return {
    dateOnly: todayInBrussels(date),
    time: new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Brussels',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(date),
  };
}

/**
 * "16 september 2026, 08:14" — nl-BE, Europe/Brussels regardless of the
 * server's own timezone. Built from two Intl calls rather than one combined
 * formatter so the separator is a plain comma (Intl's own date+time
 * combination inserts "om" instead).
 */
export function formatDateTime(date: Date): string {
  const datePart = new Intl.DateTimeFormat('nl-BE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Brussels',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('nl-BE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Brussels',
  }).format(date);
  return `${datePart}, ${timePart}`;
}
