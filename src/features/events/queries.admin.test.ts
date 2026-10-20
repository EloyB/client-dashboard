import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/db';
import { clients, events } from '@/db/schema';
import {
  adminHeaders,
  createTempClient,
  createTempClientUserSession,
  createTempProject,
} from '@/db/test-real-session';
import { listEventsForCalendar } from '@/features/events/queries.admin';
import { combineBrusselsDateTime } from '@/lib/utils';

async function deleteTempClient(clientId: string) {
  await db.delete(clients).where(eq(clients.id, clientId));
}

describe('listEventsForCalendar (admin-only, global)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const { headers, cleanup } = await createTempClientUserSession(client.id);

    try {
      await expect(
        listEventsForCalendar(headers, {
          start: combineBrusselsDateTime('2026-09-01'),
          end: combineBrusselsDateTime('2026-10-01'),
        }),
      ).rejects.toThrow();
    } finally {
      await cleanup();
      await deleteTempClient(client.id);
    }
  });

  it('only returns events overlapping the given period', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);

    const [inPeriod, before, after] = await db
      .insert(events)
      .values([
        {
          projectId: project.id,
          title: 'In September',
          type: 'meeting',
          startsAt: combineBrusselsDateTime('2026-09-15', '10:00'),
        },
        {
          projectId: project.id,
          title: 'In August',
          type: 'meeting',
          startsAt: combineBrusselsDateTime('2026-08-15', '10:00'),
        },
        {
          projectId: project.id,
          title: 'In October',
          type: 'meeting',
          startsAt: combineBrusselsDateTime('2026-10-15', '10:00'),
        },
      ])
      .returning();

    try {
      const headers = await adminHeaders();
      const rows = await listEventsForCalendar(headers, {
        start: combineBrusselsDateTime('2026-09-01'),
        end: combineBrusselsDateTime('2026-10-01'),
      });

      const ids = rows.map((row) => row.id);
      expect(ids).toContain(inPeriod.id);
      expect(ids).not.toContain(before.id);
      expect(ids).not.toContain(after.id);
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('includes a multi-day event that only starts before the period', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);

    const [spanning] = await db
      .insert(events)
      .values({
        projectId: project.id,
        title: 'Spans into September',
        type: 'other',
        startsAt: combineBrusselsDateTime('2026-08-30', '09:00'),
        endsAt: combineBrusselsDateTime('2026-09-02', '17:00'),
      })
      .returning();

    try {
      const headers = await adminHeaders();
      const rows = await listEventsForCalendar(headers, {
        start: combineBrusselsDateTime('2026-09-01'),
        end: combineBrusselsDateTime('2026-10-01'),
      });

      expect(rows.map((row) => row.id)).toContain(spanning.id);
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('filters by project', async () => {
    const client = await createTempClient();
    const projectA = await createTempProject(client.id);
    const projectB = await createTempProject(client.id);

    const [eventA, eventB] = await db
      .insert(events)
      .values([
        {
          projectId: projectA.id,
          title: 'Project A event',
          type: 'meeting',
          startsAt: combineBrusselsDateTime('2026-09-15', '10:00'),
        },
        {
          projectId: projectB.id,
          title: 'Project B event',
          type: 'meeting',
          startsAt: combineBrusselsDateTime('2026-09-16', '10:00'),
        },
      ])
      .returning();

    try {
      const headers = await adminHeaders();
      const rows = await listEventsForCalendar(headers, {
        start: combineBrusselsDateTime('2026-09-01'),
        end: combineBrusselsDateTime('2026-10-01'),
        projectId: projectA.id,
      });

      const ids = rows.map((row) => row.id);
      expect(ids).toContain(eventA.id);
      expect(ids).not.toContain(eventB.id);
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('filters by type', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);

    const [deadline, meeting] = await db
      .insert(events)
      .values([
        {
          projectId: project.id,
          title: 'A deadline',
          type: 'deadline',
          startsAt: combineBrusselsDateTime('2026-09-15', '10:00'),
        },
        {
          projectId: project.id,
          title: 'A meeting',
          type: 'meeting',
          startsAt: combineBrusselsDateTime('2026-09-16', '10:00'),
        },
      ])
      .returning();

    try {
      const headers = await adminHeaders();
      const rows = await listEventsForCalendar(headers, {
        start: combineBrusselsDateTime('2026-09-01'),
        end: combineBrusselsDateTime('2026-10-01'),
        type: 'deadline',
      });

      const ids = rows.map((row) => row.id);
      expect(ids).toContain(deadline.id);
      expect(ids).not.toContain(meeting.id);
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('includes the project name and client name', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);

    const [event] = await db
      .insert(events)
      .values({
        projectId: project.id,
        title: 'Named event',
        type: 'meeting',
        startsAt: combineBrusselsDateTime('2026-09-15', '10:00'),
      })
      .returning();

    try {
      const headers = await adminHeaders();
      const rows = await listEventsForCalendar(headers, {
        start: combineBrusselsDateTime('2026-09-01'),
        end: combineBrusselsDateTime('2026-10-01'),
      });

      const row = rows.find((r) => r.id === event.id);
      expect(row).toMatchObject({ projectName: project.name, clientName: client.name });
    } finally {
      await deleteTempClient(client.id);
    }
  });
});
