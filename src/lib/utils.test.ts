import { describe, expect, it } from 'vitest';

import { cn, combineBrusselsDateTime, splitBrusselsDateTime, todayInBrussels } from '@/lib/utils';

describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});

describe('todayInBrussels', () => {
  it('stays on the earlier date at 23:59 Brussels time, even on a UTC server (CEST, summer)', () => {
    // 2026-10-20 23:59 CEST (UTC+2) = 2026-10-20 21:59 UTC.
    expect(todayInBrussels(new Date('2026-10-20T21:59:00Z'))).toBe('2026-10-20');
  });

  it('rolls over to the next date at 00:01 Brussels time (CEST, summer)', () => {
    // 2026-10-21 00:01 CEST (UTC+2) = 2026-10-20 22:01 UTC.
    expect(todayInBrussels(new Date('2026-10-20T22:01:00Z'))).toBe('2026-10-21');
  });

  it('stays on the earlier date at 23:59 Brussels time (CET, winter)', () => {
    // 2026-01-15 23:59 CET (UTC+1) = 2026-01-15 22:59 UTC.
    expect(todayInBrussels(new Date('2026-01-15T22:59:00Z'))).toBe('2026-01-15');
  });

  it('rolls over to the next date at 00:01 Brussels time (CET, winter)', () => {
    // 2026-01-16 00:01 CET (UTC+1) = 2026-01-15 23:01 UTC.
    expect(todayInBrussels(new Date('2026-01-15T23:01:00Z'))).toBe('2026-01-16');
  });
});

describe('combineBrusselsDateTime and splitBrusselsDateTime', () => {
  it('keeps an all-day Dec 31 event on Dec 31 — never shifting to Dec 30 (CET, winter)', () => {
    const instant = combineBrusselsDateTime('2026-12-31');
    expect(splitBrusselsDateTime(instant)).toEqual({ dateOnly: '2026-12-31', time: '00:00' });
  });

  it('round-trips an all-day Jun 1 event (CEST, summer)', () => {
    const instant = combineBrusselsDateTime('2026-06-01');
    expect(splitBrusselsDateTime(instant)).toEqual({ dateOnly: '2026-06-01', time: '00:00' });
  });

  it('round-trips a specific time, winter', () => {
    const instant = combineBrusselsDateTime('2026-01-15', '14:30');
    expect(splitBrusselsDateTime(instant)).toEqual({ dateOnly: '2026-01-15', time: '14:30' });
  });

  it('round-trips a specific time, summer', () => {
    const instant = combineBrusselsDateTime('2026-07-15', '09:05');
    expect(splitBrusselsDateTime(instant)).toEqual({ dateOnly: '2026-07-15', time: '09:05' });
  });

  it('round-trips a time just before midnight, keeping the same calendar day', () => {
    const instant = combineBrusselsDateTime('2026-10-20', '23:59');
    expect(splitBrusselsDateTime(instant)).toEqual({ dateOnly: '2026-10-20', time: '23:59' });
  });

  it('round-trips a time just after midnight, on the next calendar day', () => {
    const instant = combineBrusselsDateTime('2026-10-21', '00:01');
    expect(splitBrusselsDateTime(instant)).toEqual({ dateOnly: '2026-10-21', time: '00:01' });
  });
});
