import { describe, expect, it } from 'vitest';

import { tickets } from '@/db/schema';
import { testDb } from '@/db/test-client';
import {
  cleanupTestClient,
  createTestClient,
  createTestClientUser,
  createTestProject,
} from '@/db/test-fixtures';
import { adminHeaders, createTempClientSession } from '@/db/test-real-session';
import { getClientById, listClients } from '@/features/clients/queries';

describe('listClients', () => {
  it('rejects a non-admin', async () => {
    const { headers, cleanup } = await createTempClientSession();
    try {
      await expect(listClients(headers, testDb)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    } finally {
      await cleanup();
    }
  });

  it('computes active-project and open-ticket counts in one query, per client', async () => {
    const client = await createTestClient();
    const clientUser = await createTestClientUser(client.id);
    const activeProject = await createTestProject(client.id, { status: 'active' });
    const completedProject = await createTestProject(client.id, { status: 'completed' });

    await testDb.insert(tickets).values([
      { projectId: activeProject.id, reportedById: clientUser.id, title: 'Open 1', status: 'new' },
      {
        projectId: activeProject.id,
        reportedById: clientUser.id,
        title: 'Open 2',
        status: 'in_progress',
      },
      {
        projectId: activeProject.id,
        reportedById: clientUser.id,
        title: 'Resolved',
        status: 'resolved',
      },
      {
        projectId: completedProject.id,
        reportedById: clientUser.id,
        title: 'Closed',
        status: 'closed',
      },
    ]);

    try {
      const rows = await listClients(await adminHeaders(), testDb);
      const row = rows.find((candidate) => candidate.id === client.id);
      expect(row).toMatchObject({ activeProjectCount: 1, openTicketCount: 2 });
    } finally {
      await cleanupTestClient(client.id, [clientUser.id]);
    }
  });

  it('reports zero for a client with no projects or tickets', async () => {
    const client = await createTestClient();

    try {
      const rows = await listClients(await adminHeaders(), testDb);
      const row = rows.find((candidate) => candidate.id === client.id);
      expect(row).toMatchObject({ activeProjectCount: 0, openTicketCount: 0 });
    } finally {
      await cleanupTestClient(client.id);
    }
  });
});

describe('getClientById', () => {
  it('rejects a non-admin', async () => {
    const client = await createTestClient();
    const { headers, cleanup } = await createTempClientSession();
    try {
      await expect(getClientById(headers, client.id, testDb)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    } finally {
      await cleanup();
      await cleanupTestClient(client.id);
    }
  });

  it('returns the client with its projects and users', async () => {
    const client = await createTestClient({ notes: 'Interne notitie' });
    const clientUser = await createTestClientUser(client.id);
    const project = await createTestProject(client.id, { status: 'active' });

    try {
      const detail = await getClientById(await adminHeaders(), client.id, testDb);
      expect(detail.client).toMatchObject({ id: client.id, notes: 'Interne notitie' });
      expect(detail.projects).toMatchObject([{ id: project.id, status: 'active' }]);
      expect(detail.users).toMatchObject([{ id: clientUser.id, emailVerified: true }]);
    } finally {
      await cleanupTestClient(client.id, [clientUser.id]);
    }
  });

  it('throws NOT_FOUND for a non-existent id', async () => {
    await expect(
      getClientById(await adminHeaders(), crypto.randomUUID(), testDb),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws NOT_FOUND for a malformed id instead of a raw database error', async () => {
    await expect(getClientById(await adminHeaders(), 'not-a-uuid', testDb)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
