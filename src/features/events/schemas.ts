import { z } from 'zod';

import { eventTypeEnum } from '@/db/schema';
import { formatDateOnly } from '@/lib/utils';

/**
 * Start/end are a (date, time) pair — never a single combined Date — so the
 * client never has to construct an ambiguous instant itself; the server
 * combines them via combineBrusselsDateTime. `time` is irrelevant and left
 * as-is when `allDay` is true (DateTimeField hides the picker for it).
 */
export const eventFormSchema = z
  .object({
    projectId: z.uuid(),
    title: z.string().trim().min(1, 'Titel is verplicht.'),
    description: z.string().trim(),
    type: z.enum(eventTypeEnum.enumValues),
    allDay: z.boolean(),
    startDate: z.date({ error: 'Startdatum is verplicht.' }),
    startTime: z.string(),
    endDate: z.date().optional(),
    endTime: z.string().optional(),
    location: z.string().trim(),
    visibleToClient: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.allDay && !data.startTime) {
      ctx.addIssue({ code: 'custom', path: ['startTime'], message: 'Tijdstip is verplicht.' });
    }

    if (data.endDate) {
      const startKey = `${formatDateOnly(data.startDate)}T${data.allDay ? '00:00' : data.startTime || '00:00'}`;
      const endKey = `${formatDateOnly(data.endDate)}T${data.allDay ? '00:00' : data.endTime || '00:00'}`;
      if (endKey < startKey) {
        ctx.addIssue({
          code: 'custom',
          path: ['endDate'],
          message: 'Einde moet na de start liggen.',
        });
      }
    }
  });

export const createEventSchema = eventFormSchema;

export const updateEventSchema = eventFormSchema.and(z.object({ eventId: z.uuid() }));

export const deleteEventSchema = z.object({ eventId: z.uuid() });
