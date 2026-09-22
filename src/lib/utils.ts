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
