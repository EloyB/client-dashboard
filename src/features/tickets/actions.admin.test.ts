import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

// Every action reads the session via next/headers' headers(), which throws
// outside a real request. Mocking it lets these tests drive the real
// UNAUTHENTICATED/FORBIDDEN behaviour through the real actions.
let currentHeaders = new Headers();
vi.mock('next/headers', () => ({
  headers: async () => currentHeaders,
}));

const { db } = await import('@/db');
const { activityLog, clients, tickets } = await import('@/db/schema');
const { adminHeaders, createTempClient, createTempClientUserSession, createTempProject } =
  await import('@/db/test-real-session');
const { updateTicketPriority, updateTicketStatus } =
  await import('@/features/tickets/actions.admin');

async function deleteTempClient(clientId: string) {
  await db.delete(clients).where(eq(clients.id, clientId));
}

async function createTempTicket(
  projectId: string,
  reportedById: string,
  overrides: Partial<typeof tickets.$inferInsert> = {},
) {
  const [ticket] = await db
    .insert(tickets)
    .values({ projectId, reportedById, title: 'Testticket', ...overrides })
    .returning();
  return ticket;
}

describe('updateTicketStatus (admin server action)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { userId, headers, cleanup } = await createTempClientUserSession(client.id);
    const ticket = await createTempTicket(project.id, userId);

    try {
      currentHeaders = headers;
      const result = await updateTicketStatus({ ticketId: ticket.id, status: 'resolved' });
      expect(result).toMatchObject({
        success: false,
        formError: 'This action requires an admin account.',
      });
    } finally {
      await deleteTempClient(client.id);
      await cleanup();
    }
  });

  it('sets resolvedAt when moving to resolved, and logs the change', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { userId, cleanup } = await createTempClientUserSession(client.id);
    const ticket = await createTempTicket(project.id, userId, { status: 'new' });

    try {
      currentHeaders = await adminHeaders();
      const result = await updateTicketStatus({ ticketId: ticket.id, status: 'resolved' });
      expect(result.success).toBe(true);

      const [updated] = await db.select().from(tickets).where(eq(tickets.id, ticket.id)).limit(1);
      expect(updated.status).toBe('resolved');
      expect(updated.resolvedAt).toBeInstanceOf(Date);

      const [logEntry] = await db
        .select()
        .from(activityLog)
        .where(eq(activityLog.ticketId, ticket.id))
        .limit(1);
      expect(logEntry).toMatchObject({
        projectId: project.id,
        type: 'ticket_status_changed',
        description: 'Status gewijzigd naar "Opgelost"',
      });
    } finally {
      await deleteTempClient(client.id);
      await cleanup();
    }
  });

  it('clears resolvedAt when moving away from resolved', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { userId, cleanup } = await createTempClientUserSession(client.id);
    const ticket = await createTempTicket(project.id, userId, {
      status: 'resolved',
      resolvedAt: new Date(),
    });

    try {
      currentHeaders = await adminHeaders();
      const result = await updateTicketStatus({ ticketId: ticket.id, status: 'in_progress' });
      expect(result.success).toBe(true);

      const [updated] = await db.select().from(tickets).where(eq(tickets.id, ticket.id)).limit(1);
      expect(updated.status).toBe('in_progress');
      expect(updated.resolvedAt).toBeNull();
    } finally {
      await deleteTempClient(client.id);
      await cleanup();
    }
  });

  it('rejects a status value that no longer exists, such as closed', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { userId, cleanup } = await createTempClientUserSession(client.id);
    const ticket = await createTempTicket(project.id, userId);

    try {
      currentHeaders = await adminHeaders();
      const result = await updateTicketStatus({ ticketId: ticket.id, status: 'closed' });
      expect(result).toMatchObject({
        success: false,
        fieldErrors: { status: [expect.any(String)] },
      });

      const [unchanged] = await db.select().from(tickets).where(eq(tickets.id, ticket.id)).limit(1);
      expect(unchanged.status).toBe('new');
    } finally {
      await deleteTempClient(client.id);
      await cleanup();
    }
  });

  it('rejects a non-existent ticket id', async () => {
    currentHeaders = await adminHeaders();
    const result = await updateTicketStatus({ ticketId: crypto.randomUUID(), status: 'resolved' });
    expect(result).toMatchObject({ success: false, formError: expect.any(String) });
  });
});

describe('updateTicketPriority (admin server action)', () => {
  it('rejects a non-admin', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { userId, headers, cleanup } = await createTempClientUserSession(client.id);
    const ticket = await createTempTicket(project.id, userId);

    try {
      currentHeaders = headers;
      const result = await updateTicketPriority({ ticketId: ticket.id, priority: 'high' });
      expect(result).toMatchObject({
        success: false,
        formError: 'This action requires an admin account.',
      });
    } finally {
      await deleteTempClient(client.id);
      await cleanup();
    }
  });

  it('updates priority without touching status or resolvedAt, and logs the change', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { userId, cleanup } = await createTempClientUserSession(client.id);
    const ticket = await createTempTicket(project.id, userId, {
      status: 'resolved',
      resolvedAt: new Date(),
      priority: 'low',
    });

    try {
      currentHeaders = await adminHeaders();
      const result = await updateTicketPriority({ ticketId: ticket.id, priority: 'high' });
      expect(result.success).toBe(true);

      const [updated] = await db.select().from(tickets).where(eq(tickets.id, ticket.id)).limit(1);
      expect(updated.priority).toBe('high');
      expect(updated.status).toBe('resolved');
      expect(updated.resolvedAt).toBeInstanceOf(Date);

      const [logEntry] = await db
        .select()
        .from(activityLog)
        .where(eq(activityLog.ticketId, ticket.id))
        .limit(1);
      expect(logEntry).toMatchObject({
        type: 'ticket_priority_changed',
        description: 'Prioriteit gezet op "Hoog"',
      });
    } finally {
      await deleteTempClient(client.id);
      await cleanup();
    }
  });
});
