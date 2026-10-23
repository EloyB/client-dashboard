import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

let currentHeaders = new Headers();
vi.mock('next/headers', () => ({
  headers: async () => currentHeaders,
}));

const { db } = await import('@/db');
const { clients, events } = await import('@/db/schema');
const { adminHeaders, createTempClient, createTempClientUserSession, createTempProject } =
  await import('@/db/test-real-session');
const { createEvent, deleteEvent, updateEvent } = await import('@/features/events/actions');
const { combineBrusselsDateTime, splitBrusselsDateTime } = await import('@/lib/utils');

async function deleteTempClient(clientId: string) {
  await db.delete(clients).where(eq(clients.id, clientId));
}

const baseInput = (projectId: string) => ({
  projectId,
  title: 'Kickoff meeting',
  description: '',
  type: 'meeting' as const,
  allDay: false,
  startDate: new Date('2026-09-18T00:00:00'),
  startTime: '10:00',
  endDate: new Date('2026-09-18T00:00:00'),
  endTime: '11:00',
  location: 'videocall',
  visibleToClient: true,
});

describe('createEvent (admin server action)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { headers, cleanup } = await createTempClientUserSession(client.id);

    try {
      currentHeaders = headers;
      const result = await createEvent(baseInput(project.id));
      expect(result).toMatchObject({
        success: false,
        formError: 'This action requires an admin account.',
      });
    } finally {
      await cleanup();
      await deleteTempClient(client.id);
    }
  });

  it('creates a timed event with the correct Brussels start/end instants', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);

    try {
      currentHeaders = await adminHeaders();
      const result = await createEvent(baseInput(project.id));
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data).toMatchObject({ title: 'Kickoff meeting', allDay: false });
      expect(splitBrusselsDateTime(result.data.startsAt)).toEqual({
        dateOnly: '2026-09-18',
        time: '10:00',
      });
      expect(splitBrusselsDateTime(result.data.endsAt!)).toEqual({
        dateOnly: '2026-09-18',
        time: '11:00',
      });
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('keeps an all-day Dec 31 event on Dec 31, not Dec 30', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);

    try {
      currentHeaders = await adminHeaders();
      const result = await createEvent({
        ...baseInput(project.id),
        allDay: true,
        startDate: new Date('2026-12-31T00:00:00'),
        startTime: '',
        endDate: undefined,
        endTime: undefined,
      });
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(splitBrusselsDateTime(result.data.startsAt)).toEqual({
        dateOnly: '2026-12-31',
        time: '00:00',
      });
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('rejects an end before the start', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);

    try {
      currentHeaders = await adminHeaders();
      const result = await createEvent({
        ...baseInput(project.id),
        startDate: new Date('2026-09-18T00:00:00'),
        startTime: '14:00',
        endDate: new Date('2026-09-18T00:00:00'),
        endTime: '10:00',
      });
      expect(result).toMatchObject({
        success: false,
        fieldErrors: { endDate: [expect.any(String)] },
      });
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('allows an event with no end at all', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);

    try {
      currentHeaders = await adminHeaders();
      const result = await createEvent({
        ...baseInput(project.id),
        endDate: undefined,
        endTime: undefined,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.endsAt).toBeNull();
      }
    } finally {
      await deleteTempClient(client.id);
    }
  });
});

describe('updateEvent (admin server action)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { headers, cleanup } = await createTempClientUserSession(client.id);
    const [event] = await db
      .insert(events)
      .values({
        projectId: project.id,
        title: 'Testitem',
        startsAt: combineBrusselsDateTime('2026-09-18', '10:00'),
      })
      .returning();

    try {
      currentHeaders = headers;
      const result = await updateEvent({ ...baseInput(project.id), eventId: event.id });
      expect(result).toMatchObject({
        success: false,
        formError: 'This action requires an admin account.',
      });
    } finally {
      await cleanup();
      await deleteTempClient(client.id);
    }
  });

  it('updates the event', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const [event] = await db
      .insert(events)
      .values({
        projectId: project.id,
        title: 'Oude titel',
        startsAt: combineBrusselsDateTime('2026-09-18', '10:00'),
      })
      .returning();

    try {
      currentHeaders = await adminHeaders();
      const result = await updateEvent({
        ...baseInput(project.id),
        eventId: event.id,
        title: 'Nieuwe titel',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Nieuwe titel');
      }
    } finally {
      await deleteTempClient(client.id);
    }
  });
});

describe('deleteEvent (admin server action)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { headers, cleanup } = await createTempClientUserSession(client.id);
    const [event] = await db
      .insert(events)
      .values({
        projectId: project.id,
        title: 'Testitem',
        startsAt: combineBrusselsDateTime('2026-09-18', '10:00'),
      })
      .returning();

    try {
      currentHeaders = headers;
      const result = await deleteEvent({ eventId: event.id });
      expect(result).toMatchObject({
        success: false,
        formError: 'This action requires an admin account.',
      });
    } finally {
      await cleanup();
      await deleteTempClient(client.id);
    }
  });

  it('deletes the event', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const [event] = await db
      .insert(events)
      .values({
        projectId: project.id,
        title: 'Testitem',
        startsAt: combineBrusselsDateTime('2026-09-18', '10:00'),
      })
      .returning();

    try {
      currentHeaders = await adminHeaders();
      const result = await deleteEvent({ eventId: event.id });
      expect(result.success).toBe(true);

      const [remaining] = await db.select().from(events).where(eq(events.id, event.id)).limit(1);
      expect(remaining).toBeUndefined();
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('rejects a non-existent event id', async () => {
    currentHeaders = await adminHeaders();
    const result = await deleteEvent({ eventId: crypto.randomUUID() });
    expect(result).toMatchObject({ success: false, formError: expect.any(String) });
  });
});
