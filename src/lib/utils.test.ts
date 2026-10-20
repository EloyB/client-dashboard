import { describe, expect, it } from 'vitest';

import { cn, todayInBrussels } from '@/lib/utils';

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
