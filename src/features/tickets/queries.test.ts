import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  cleanupTestAdminUser,
  cleanupTestClient,
  cleanupTestFile,
  createTestAdminUser,
  createTestClient,
  createTestClientUser,
  createTestFile,
  createTestProject,
  createTestTicketAttachment,
} from '@/db/test-fixtures';
import { testDb } from '@/db/test-client';
import { ticketAttachments, tickets } from '@/db/schema';
import {
  addCommentToTicket,
  getTicketById,
  getTicketDetailForClient,
  listCommentsForTicket,
  listTicketsForClient,
  listTicketsForProject,
} from '@/features/tickets/queries';
import type { AuthenticatedUser } from '@/lib/access';
import { ticketReference } from '@/lib/ticket-links';

describe('tickets queries', () => {
  const admin: AuthenticatedUser = { id: 'admin-fixture', role: 'admin', clientId: null };

  let clientA: Awaited<ReturnType<typeof createTestClient>>;
  let clientB: Awaited<ReturnType<typeof createTestClient>>;
  let projectA: Awaited<ReturnType<typeof createTestProject>>;
  let projectB: Awaited<ReturnType<typeof createTestProject>>;
  let userA1: Awaited<ReturnType<typeof createTestClientUser>>;
  let userA2: Awaited<ReturnType<typeof createTestClientUser>>;
  let userB1: Awaited<ReturnType<typeof createTestClientUser>>;
  let ticketA: typeof tickets.$inferSelect;
  let ticketB: typeof tickets.$inferSelect;

  beforeEach(async () => {
    clientA = await createTestClient();
    clientB = await createTestClient();
    projectA = await createTestProject(clientA.id);
    projectB = await createTestProject(clientB.id);
    userA1 = await createTestClientUser(clientA.id);
    userA2 = await createTestClientUser(clientA.id);
    userB1 = await createTestClientUser(clientB.id);

    [ticketA] = await testDb
      .insert(tickets)
      .values({
        projectId: projectA.id,
        reportedById: userA1.id,
        title: 'Contactformulier werkt niet',
      })
      .returning();

    [ticketB] = await testDb
      .insert(tickets)
      .values({
        projectId: projectB.id,
        reportedById: userB1.id,
        title: 'Betaalmodule geeft foutmelding',
      })
      .returning();
  });

  afterEach(async () => {
    await cleanupTestClient(clientA.id, [userA1.id, userA2.id]);
    await cleanupTestClient(clientB.id, [userB1.id]);
  });

  it('lets an admin see tickets from any client', async () => {
    const resultA = await listTicketsForProject(admin, projectA.id, testDb);
    const resultB = await listTicketsForProject(admin, projectB.id, testDb);

    expect(resultA.map((ticket) => ticket.id)).toEqual([ticketA.id]);
    expect(resultB.map((ticket) => ticket.id)).toEqual([ticketB.id]);
  });

  it('lets a client user see only their own client’s tickets', async () => {
    const asUserA1: AuthenticatedUser = { id: userA1.id, role: 'client', clientId: clientA.id };

    const result = await listTicketsForProject(asUserA1, projectA.id, testDb);

    expect(result.map((ticket) => ticket.id)).toEqual([ticketA.id]);
  });

  it('never returns another client’s tickets, even by a known ID', async () => {
    const asUserA1: AuthenticatedUser = { id: userA1.id, role: 'client', clientId: clientA.id };

    await expect(listTicketsForProject(asUserA1, projectB.id, testDb)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });

    await expect(getTicketById(asUserA1, ticketB.id, testDb)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('lets colleagues of the same client see each other’s tickets', async () => {
    const asUserA2: AuthenticatedUser = { id: userA2.id, role: 'client', clientId: clientA.id };

    const ticket = await getTicketById(asUserA2, ticketA.id, testDb);

    expect(ticket.id).toBe(ticketA.id);
  });
});

describe('ticket comments', () => {
  let adminUser: Awaited<ReturnType<typeof createTestAdminUser>>;
  let admin: AuthenticatedUser;
  let clientA: Awaited<ReturnType<typeof createTestClient>>;
  let clientB: Awaited<ReturnType<typeof createTestClient>>;
  let projectA: Awaited<ReturnType<typeof createTestProject>>;
  let projectB: Awaited<ReturnType<typeof createTestProject>>;
  let userA1: Awaited<ReturnType<typeof createTestClientUser>>;
  let userA2: Awaited<ReturnType<typeof createTestClientUser>>;
  let userB1: Awaited<ReturnType<typeof createTestClientUser>>;
  let ticketA: typeof tickets.$inferSelect;
  let ticketB: typeof tickets.$inferSelect;

  beforeEach(async () => {
    adminUser = await createTestAdminUser();
    admin = { id: adminUser.id, role: 'admin', clientId: null };
    clientA = await createTestClient();
    clientB = await createTestClient();
    projectA = await createTestProject(clientA.id);
    projectB = await createTestProject(clientB.id);
    userA1 = await createTestClientUser(clientA.id);
    userA2 = await createTestClientUser(clientA.id);
    userB1 = await createTestClientUser(clientB.id);

    [ticketA] = await testDb
      .insert(tickets)
      .values({ projectId: projectA.id, reportedById: userA1.id, title: 'Ticket van klant A' })
      .returning();

    [ticketB] = await testDb
      .insert(tickets)
      .values({ projectId: projectB.id, reportedById: userB1.id, title: 'Ticket van klant B' })
      .returning();
  });

  afterEach(async () => {
    await cleanupTestClient(clientA.id, [userA1.id, userA2.id]);
    await cleanupTestClient(clientB.id, [userB1.id]);
    await cleanupTestAdminUser(adminUser.id);
  });

  it('lets a client user add and read a comment on their own client’s ticket', async () => {
    const asUserA1: AuthenticatedUser = { id: userA1.id, role: 'client', clientId: clientA.id };

    await addCommentToTicket(asUserA1, ticketA.id, 'Enige toelichting.', testDb);
    const comments = await listCommentsForTicket(asUserA1, ticketA.id, testDb);

    expect(comments.map((comment) => comment.body)).toEqual(['Enige toelichting.']);
    expect(comments[0].authorId).toBe(userA1.id);
  });

  it('lets colleagues of the same client read each other’s comments', async () => {
    const asUserA1: AuthenticatedUser = { id: userA1.id, role: 'client', clientId: clientA.id };
    const asUserA2: AuthenticatedUser = { id: userA2.id, role: 'client', clientId: clientA.id };

    await addCommentToTicket(asUserA1, ticketA.id, 'Van collega 1.', testDb);
    const comments = await listCommentsForTicket(asUserA2, ticketA.id, testDb);

    expect(comments.map((comment) => comment.body)).toEqual(['Van collega 1.']);
  });

  it('lets an admin add and read comments on any client’s ticket', async () => {
    await addCommentToTicket(admin, ticketB.id, 'Reactie van de beheerder.', testDb);
    const comments = await listCommentsForTicket(admin, ticketB.id, testDb);

    expect(comments.map((comment) => comment.body)).toEqual(['Reactie van de beheerder.']);
  });

  it('never lets a client user read or add comments on another client’s ticket', async () => {
    const asUserA1: AuthenticatedUser = { id: userA1.id, role: 'client', clientId: clientA.id };

    await expect(listCommentsForTicket(asUserA1, ticketB.id, testDb)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });

    await expect(
      addCommentToTicket(asUserA1, ticketB.id, 'Zou niet mogen lukken.', testDb),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('portal ticket overview and detail (slice 5c)', () => {
  let clientA: Awaited<ReturnType<typeof createTestClient>>;
  let clientB: Awaited<ReturnType<typeof createTestClient>>;
  let projectA: Awaited<ReturnType<typeof createTestProject>>;
  let projectB: Awaited<ReturnType<typeof createTestProject>>;
  let userA1: Awaited<ReturnType<typeof createTestClientUser>>;
  let userA2: Awaited<ReturnType<typeof createTestClientUser>>;
  let userB1: Awaited<ReturnType<typeof createTestClientUser>>;
  let ticketA1: typeof tickets.$inferSelect;
  let ticketA2: typeof tickets.$inferSelect;
  let ticketB: typeof tickets.$inferSelect;

  beforeEach(async () => {
    clientA = await createTestClient();
    clientB = await createTestClient();
    projectA = await createTestProject(clientA.id);
    projectB = await createTestProject(clientB.id);
    userA1 = await createTestClientUser(clientA.id);
    userA2 = await createTestClientUser(clientA.id);
    userB1 = await createTestClientUser(clientB.id);

    [ticketA1] = await testDb
      .insert(tickets)
      .values({ projectId: projectA.id, reportedById: userA1.id, title: 'Melding van A1' })
      .returning();
    [ticketA2] = await testDb
      .insert(tickets)
      .values({ projectId: projectA.id, reportedById: userA2.id, title: 'Melding van A2' })
      .returning();
    [ticketB] = await testDb
      .insert(tickets)
      .values({ projectId: projectB.id, reportedById: userB1.id, title: 'Melding van B' })
      .returning();
  });

  afterEach(async () => {
    await cleanupTestClient(clientA.id, [userA1.id, userA2.id]);
    await cleanupTestClient(clientB.id, [userB1.id]);
  });

  describe('listTicketsForClient', () => {
    it('shows every ticket across the client’s projects, including colleagues’ own', async () => {
      const asUserA1: AuthenticatedUser & { clientId: string } = {
        id: userA1.id,
        role: 'client',
        clientId: clientA.id,
      };

      const result = await listTicketsForClient(asUserA1, testDb);

      expect(result.map((row) => row.id).sort()).toEqual([ticketA1.id, ticketA2.id].sort());
      expect(result.map((row) => row.id)).not.toContain(ticketB.id);
    });

    it('returns only the declared display fields, no internal data', async () => {
      const asUserA1: AuthenticatedUser & { clientId: string } = {
        id: userA1.id,
        role: 'client',
        clientId: clientA.id,
      };

      const [row] = await listTicketsForClient(asUserA1, testDb);

      expect(Object.keys(row).sort()).toEqual(
        [
          'id',
          'reference',
          'title',
          'projectId',
          'projectName',
          'status',
          'priority',
          'reporterName',
          'updatedAt',
        ].sort(),
      );
      expect(row.reference).toBe(ticketReference(row.id));
    });
  });

  describe('getTicketDetailForClient', () => {
    it('returns NOT_FOUND for a ticket belonging to another client', async () => {
      const asUserA1: AuthenticatedUser = { id: userA1.id, role: 'client', clientId: clientA.id };

      await expect(getTicketDetailForClient(asUserA1, ticketB.id, testDb)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('returns NOT_FOUND for a non-existent ticket id', async () => {
      const asUserA1: AuthenticatedUser = { id: userA1.id, role: 'client', clientId: clientA.id };

      await expect(
        getTicketDetailForClient(asUserA1, crypto.randomUUID(), testDb),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('lets a colleague of the same client open the detail', async () => {
      const asUserA2: AuthenticatedUser = { id: userA2.id, role: 'client', clientId: clientA.id };

      const detail = await getTicketDetailForClient(asUserA2, ticketA1.id, testDb);

      expect(detail.id).toBe(ticketA1.id);
      expect(detail.reporterName).toBe(userA1.name);
    });

    it('includes attachment metadata and no internal fields', async () => {
      const asUserA1: AuthenticatedUser = { id: userA1.id, role: 'client', clientId: clientA.id };
      const file = await createTestFile(userA1.id, { filename: 'schermafbeelding.png' });
      await createTestTicketAttachment(ticketA1.id, file.id);

      try {
        const detail = await getTicketDetailForClient(asUserA1, ticketA1.id, testDb);

        expect(detail.attachments).toEqual([
          {
            id: file.id,
            filename: 'schermafbeelding.png',
            mimeType: file.mimeType,
            size: file.size,
          },
        ]);
        expect(detail.resolvedAt).toBeNull();
        expect(Object.keys(detail).sort()).toEqual(
          [
            'id',
            'reference',
            'title',
            'description',
            'pageUrl',
            'status',
            'priority',
            'projectName',
            'reporterName',
            'createdAt',
            'updatedAt',
            'resolvedAt',
            'attachments',
          ].sort(),
        );
      } finally {
        // ticket_attachments.fileId restricts deleting the file, and it
        // isn't cascaded away until afterEach deletes the client/project/
        // ticket — so it must go first, here, not in afterEach.
        await testDb.delete(ticketAttachments).where(eq(ticketAttachments.fileId, file.id));
        await cleanupTestFile(file.id);
      }
    });
  });
});
