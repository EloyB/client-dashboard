import { describe, expect, it } from 'vitest';

import { deadlineGroupFor, groupTasksByDeadline } from '@/features/tasks/grouping';

// 2024-01-01 is a known Monday, so the week ends Sunday 2024-01-07.
const MONDAY = '2024-01-01';

describe('deadlineGroupFor', () => {
  it('groups a past date as overdue', () => {
    expect(deadlineGroupFor('2023-12-31', MONDAY)).toBe('overdue');
  });

  it('groups today itself as today, not overdue or this week', () => {
    expect(deadlineGroupFor(MONDAY, MONDAY)).toBe('today');
  });

  it('groups the last day of the week (Sunday) as this week', () => {
    expect(deadlineGroupFor('2024-01-07', MONDAY)).toBe('thisWeek');
  });

  it('groups the first day of next week (Monday) as later', () => {
    expect(deadlineGroupFor('2024-01-08', MONDAY)).toBe('later');
  });

  it('groups a missing due date as noDeadline', () => {
    expect(deadlineGroupFor(null, MONDAY)).toBe('noDeadline');
  });

  it('treats today-is-Sunday as the end of its own week, not next week', () => {
    const sunday = '2024-01-07';
    expect(deadlineGroupFor(sunday, sunday)).toBe('today');
    expect(deadlineGroupFor('2024-01-08', sunday)).toBe('later');
  });
});

describe('groupTasksByDeadline', () => {
  it('buckets every task and preserves input order within a bucket', () => {
    const tasks = [
      { id: 'a', dueDate: '2024-01-08' },
      { id: 'b', dueDate: '2023-12-31' },
      { id: 'c', dueDate: MONDAY },
      { id: 'd', dueDate: null },
      { id: 'e', dueDate: '2024-01-05' },
    ];

    const groups = groupTasksByDeadline(tasks, MONDAY);

    expect(groups.overdue.map((t) => t.id)).toEqual(['b']);
    expect(groups.today.map((t) => t.id)).toEqual(['c']);
    expect(groups.thisWeek.map((t) => t.id)).toEqual(['e']);
    expect(groups.later.map((t) => t.id)).toEqual(['a']);
    expect(groups.noDeadline.map((t) => t.id)).toEqual(['d']);
  });
});
