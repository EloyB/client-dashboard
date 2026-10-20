import { z } from 'zod';

import { priorityEnum, ticketStatusEnum } from '@/db/schema';

export const updateTicketStatusSchema = z.object({
  ticketId: z.uuid(),
  status: z.enum(ticketStatusEnum.enumValues),
});

export const updateTicketPrioritySchema = z.object({
  ticketId: z.uuid(),
  priority: z.enum(priorityEnum.enumValues),
});
