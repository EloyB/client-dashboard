'use server';

import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

import { db } from '@/db';
import { events } from '@/db/schema';
import {
  createEventSchema,
  deleteEventSchema,
  updateEventSchema,
  type eventFormSchema,
} from '@/features/events/schemas';
import { AccessError, assertProjectAccess, requireAdmin } from '@/lib/access';
import { createFormAction } from '@/lib/form-action';
import { combineBrusselsDateTime, formatDateOnly } from '@/lib/utils';
import type { z } from 'zod';

function toTimestamps(data: z.output<typeof eventFormSchema>): {
  startsAt: Date;
  endsAt: Date | null;
} {
  const startsAt = combineBrusselsDateTime(
    formatDateOnly(data.startDate)!,
    data.allDay ? '00:00' : data.startTime,
  );
  const endsAt = data.endDate
    ? combineBrusselsDateTime(formatDateOnly(data.endDate)!, data.allDay ? '00:00' : data.endTime)
    : null;
  return { startsAt, endsAt };
}

async function getEventOrNotFound(eventId: string) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) {
    throw new AccessError('NOT_FOUND', 'Event not found.');
  }
  return event;
}

export const createEvent = createFormAction(createEventSchema, async (data) => {
  const admin = await requireAdmin(await headers());
  await assertProjectAccess(admin, data.projectId);

  const { startsAt, endsAt } = toTimestamps(data);

  const [event] = await db
    .insert(events)
    .values({
      projectId: data.projectId,
      title: data.title,
      description: data.description || null,
      type: data.type,
      startsAt,
      endsAt,
      allDay: data.allDay,
      location: data.location || null,
      visibleToClient: data.visibleToClient,
    })
    .returning();

  return event;
});

export const updateEvent = createFormAction(updateEventSchema, async (data) => {
  const admin = await requireAdmin(await headers());
  await assertProjectAccess(admin, data.projectId);
  await getEventOrNotFound(data.eventId);

  const { startsAt, endsAt } = toTimestamps(data);

  const [event] = await db
    .update(events)
    .set({
      title: data.title,
      description: data.description || null,
      type: data.type,
      startsAt,
      endsAt,
      allDay: data.allDay,
      location: data.location || null,
      visibleToClient: data.visibleToClient,
    })
    .where(eq(events.id, data.eventId))
    .returning();

  return event;
});

export const deleteEvent = createFormAction(deleteEventSchema, async (data) => {
  await requireAdmin(await headers());
  await getEventOrNotFound(data.eventId);

  await db.delete(events).where(eq(events.id, data.eventId));

  return { id: data.eventId };
});
