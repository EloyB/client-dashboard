import { describe, expect, it } from 'vitest';

import {
  getMonthGrid,
  getUpcomingWeekRange,
  getWeekGrid,
  groupEventsByDay,
  shiftMonth,
  shiftWeek,
} from './calendarGrid';

describe('getMonthGrid', () => {
  it('pads the first week with blanks up to the month start weekday', () => {
    // 1 september 2026 is a Tuesday — one leading blank (Monday).
    const grid = getMonthGrid('2026-09-15');
    expect(grid.weeks[0]).toEqual([
      null,
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
    ]);
  });

  it('pads the last week with trailing blanks', () => {
    const grid = getMonthGrid('2026-09-15');
    const lastWeek = grid.weeks.at(-1)!;
    expect(lastWeek[2]).toBe('2026-09-30');
    expect(lastWeek[3]).toBeNull();
    expect(lastWeek[6]).toBeNull();
  });

  it('computes an exclusive end-of-range at the first of the next month', () => {
    const grid = getMonthGrid('2026-09-15');
    expect(grid.rangeStart).toBe('2026-09-01');
    expect(grid.rangeEndExclusive).toBe('2026-10-01');
  });

  it('rolls over correctly at a year boundary', () => {
    const grid = getMonthGrid('2026-12-31');
    expect(grid.rangeStart).toBe('2026-12-01');
    expect(grid.rangeEndExclusive).toBe('2027-01-01');
  });

  it('labels the month in Dutch', () => {
    const grid = getMonthGrid('2026-09-15');
    expect(grid.label).toBe('september 2026');
  });
});

describe('shiftMonth', () => {
  it('moves forward and backward across a year boundary', () => {
    expect(shiftMonth('2026-12-15', 1)).toBe('2027-01-15');
    expect(shiftMonth('2027-01-15', -1)).toBe('2026-12-15');
  });
});

describe('getWeekGrid', () => {
  it('returns Monday through Friday regardless of the anchor weekday', () => {
    // 2026-09-16 is a Wednesday.
    const grid = getWeekGrid('2026-09-16');
    expect(grid.days).toEqual([
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
    ]);
  });

  it('computes an exclusive end-of-range at Saturday', () => {
    const grid = getWeekGrid('2026-09-16');
    expect(grid.rangeStart).toBe('2026-09-14');
    expect(grid.rangeEndExclusive).toBe('2026-09-19');
  });
});

describe('shiftWeek', () => {
  it('moves by seven days', () => {
    expect(shiftWeek('2026-09-16', 1)).toBe('2026-09-23');
    expect(shiftWeek('2026-09-16', -1)).toBe('2026-09-09');
  });
});

describe('getUpcomingWeekRange', () => {
  it('spans today through the next 7 days, inclusive', () => {
    const range = getUpcomingWeekRange('2026-09-16');
    expect(range.rangeStart).toBe('2026-09-16');
    expect(range.rangeEndExclusive).toBe('2026-09-24');
  });

  it('rolls over a month boundary', () => {
    const range = getUpcomingWeekRange('2026-09-28');
    expect(range.rangeStart).toBe('2026-09-28');
    expect(range.rangeEndExclusive).toBe('2026-10-06');
  });
});

describe('groupEventsByDay', () => {
  it('groups by the Brussels start day', () => {
    const events = [
      { id: 'a', startsAt: new Date('2026-09-16T08:00:00Z') }, // 10:00 Brussels (CEST)
      { id: 'b', startsAt: new Date('2026-09-16T20:00:00Z') }, // 22:00 Brussels
      { id: 'c', startsAt: new Date('2026-09-17T08:00:00Z') },
    ];
    const grouped = groupEventsByDay(events);
    expect(grouped.get('2026-09-16')?.map((e) => e.id)).toEqual(['a', 'b']);
    expect(grouped.get('2026-09-17')?.map((e) => e.id)).toEqual(['c']);
  });
});
