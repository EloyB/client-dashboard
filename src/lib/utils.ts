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
