import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { testDb } from '@/db/test-client';
import {
  cleanupTestClient,
  cleanupTestFile,
  createTestClient,
  createTestClientUser,
  createTestFile,
  createTestProject,
  createTestTicket,
  createTestTicketAttachment,
} from '@/db/test-fixtures';
import { adminHeaders, createTempClientSession } from '@/db/test-real-session';
import {
  getTicketByIdForAdmin,
  listTicketsForAdmin,
  listTicketsForProjectAdmin,
} from '@/features/tickets/queries.admin';
import { tasks, ticketAttachments } from '@/db/schema';
import { ticketReference } from '@/lib/ticket-links';

describe('listTicketsForAdmin', () => {
  it('rejects a non-admin', async () => {
    const { headers, cleanup } = await createTempClientSession();
    try {
      await expect(listTicketsForAdmin(headers, testDb)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    } finally {
      await cleanup();
    }
  });

  it('lists tickets across every client, not scoped to one', async () => {
    const clientA = await createTestClient();
    const clientB = await createTestClient();
    const userA = await createTestClientUser(clientA.id);
    const userB = await createTestClientUser(clientB.id);
    const projectA = await createTestProject(clientA.id);
    const projectB = await createTestProject(clientB.id);
    const ticketA = await createTestTicket(projectA.id, userA.id);
    const ticketB = await createTestTicket(projectB.id, userB.id);

    try {
      const rows = await listTicketsForAdmin(await adminHeaders(), testDb);
      const ids = rows.map((row) => row.id);
      expect(ids).toEqual(expect.arrayContaining([ticketA.id, ticketB.id]));

      const rowA = rows.find((row) => row.id === ticketA.id);
      expect(rowA).toMatchObject({
        clientId: clientA.id,
        clientName: clientA.name,
        projectId: projectA.id,
        reporterName: userA.name,
        attachmentCount: 0,
      });
      expect(rowA?.reference).toBe(ticketReference(ticketA.id));
    } finally {
      await cleanupTestClient(clientA.id, [userA.id]);
      await cleanupTestClient(clientB.id, [userB.id]);
    }
  });

  it('counts attached screenshots', async () => {
    const client = await createTestClient();
    const user = await createTestClientUser(client.id);
    const project = await createTestProject(client.id);
    const ticket = await createTestTicket(project.id, user.id);
    const file = await createTestFile(user.id);
    await createTestTicketAttachment(ticket.id, file.id);

    try {
      const rows = await listTicketsForAdmin(await adminHeaders(), testDb);
      const row = rows.find((candidate) => candidate.id === ticket.id);
      expect(row?.attachmentCount).toBe(1);
    } finally {
      // The file row blocks deleting its uploader (files.uploadedById
      // restricts), so it must go before cleanupTestClient's user cleanup.
      await testDb.delete(ticketAttachments).where(eq(ticketAttachments.fileId, file.id));
      await cleanupTestFile(file.id);
      await cleanupTestClient(client.id, [user.id]);
    }
  });
});

describe('listTicketsForProjectAdmin', () => {
  it('rejects a non-admin', async () => {
    const { headers, cleanup } = await createTempClientSession();
    try {
      await expect(
        listTicketsForProjectAdmin(headers, crypto.randomUUID(), 5, testDb),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    } finally {
      await cleanup();
    }
  });

  it('only returns tickets from the given project, even for the same client', async () => {
    const client = await createTestClient();
    const user = await createTestClientUser(client.id);
    const projectA = await createTestProject(client.id);
    const projectB = await createTestProject(client.id);
    const ticketA = await createTestTicket(projectA.id, user.id);
    await createTestTicket(projectB.id, user.id);

    try {
      const rows = await listTicketsForProjectAdmin(await adminHeaders(), projectA.id, 5, testDb);
      expect(rows.map((row) => row.id)).toEqual([ticketA.id]);
    } finally {
      await cleanupTestClient(client.id, [user.id]);
    }
  });

  it('respects the limit', async () => {
    const client = await createTestClient();
    const user = await createTestClientUser(client.id);
    const project = await createTestProject(client.id);
    await createTestTicket(project.id, user.id);
    await createTestTicket(project.id, user.id);
    await createTestTicket(project.id, user.id);

    try {
      const rows = await listTicketsForProjectAdmin(await adminHeaders(), project.id, 2, testDb);
      expect(rows).toHaveLength(2);
    } finally {
      await cleanupTestClient(client.id, [user.id]);
    }
  });
});

describe('getTicketByIdForAdmin', () => {
  it('rejects a non-admin', async () => {
    const { headers, cleanup } = await createTempClientSession();
    try {
      await expect(
        getTicketByIdForAdmin(headers, crypto.randomUUID(), testDb),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    } finally {
      await cleanup();
    }
  });

  it('throws NOT_FOUND for a non-existent id', async () => {
    await expect(
      getTicketByIdForAdmin(await adminHeaders(), crypto.randomUUID(), testDb),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('returns a ticket belonging to any client, with attachment metadata', async () => {
    const client = await createTestClient();
    const user = await createTestClientUser(client.id);
    const project = await createTestProject(client.id);
    const ticket = await createTestTicket(project.id, user.id, { title: 'Detail door admin' });
    const file = await createTestFile(user.id, { filename: 'bewijs.png' });
    await createTestTicketAttachment(ticket.id, file.id);

    try {
      const detail = await getTicketByIdForAdmin(await adminHeaders(), ticket.id, testDb);
      expect(detail).toMatchObject({
        id: ticket.id,
        title: 'Detail door admin',
        clientId: client.id,
        clientName: client.name,
        projectId: project.id,
        reporterName: user.name,
      });
      expect(detail.reference).toBe(ticketReference(ticket.id));
      expect(detail.attachments).toEqual([
        { id: file.id, filename: 'bewijs.png', mimeType: file.mimeType, size: file.size },
      ]);
    } finally {
      await testDb.delete(ticketAttachments).where(eq(ticketAttachments.fileId, file.id));
      await cleanupTestFile(file.id);
      await cleanupTestClient(client.id, [user.id]);
    }
  });

  it('includes the linked task once the ticket has been converted (7d)', async () => {
    const client = await createTestClient();
    const user = await createTestClientUser(client.id);
    const project = await createTestProject(client.id);
    const ticket = await createTestTicket(project.id, user.id);

    try {
      const withoutTask = await getTicketByIdForAdmin(await adminHeaders(), ticket.id, testDb);
      expect(withoutTask.linkedTask).toBeNull();

      const [task] = await testDb
        .insert(tasks)
        .values({
          projectId: project.id,
          title: 'Gekoppelde taak',
          status: 'in_progress',
          position: 'a0',
          ticketId: ticket.id,
        })
        .returning();

      const withTask = await getTicketByIdForAdmin(await adminHeaders(), ticket.id, testDb);
      expect(withTask.linkedTask).toMatchObject({
        id: task.id,
        title: 'Gekoppelde taak',
        status: 'in_progress',
      });

      await testDb.delete(tasks).where(eq(tasks.id, task.id));
    } finally {
      await cleanupTestClient(client.id, [user.id]);
    }
  });
});
