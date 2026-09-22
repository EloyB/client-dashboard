import { describe, expect, it } from 'vitest';

import { testDb } from '@/db/test-client';
import {
  cleanupTestClient,
  createTestClient,
  createTestClientUser,
  createTestEvent,
  createTestProject,
  createTestTicket,
} from '@/db/test-fixtures';
import { adminHeaders, createTempClientSession } from '@/db/test-real-session';
import { getProjectById, listProjects, listSelectableClients } from '@/features/projects/queries';

describe('listProjects', () => {
  it('rejects a non-admin', async () => {
    const { headers, cleanup } = await createTempClientSession();
    try {
      await expect(listProjects(headers, testDb)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    } finally {
      await cleanup();
    }
  });

  it('reports the nearest upcoming deadline event and open ticket count, without N+1', async () => {
    const client = await createTestClient();
    const clientUser = await createTestClientUser(client.id);
    const project = await createTestProject(client.id, { status: 'active' });

    const inTenDays = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const inTwentyDays = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await createTestEvent(project.id, {
      type: 'deadline',
      title: 'Te laat, telt niet mee',
      startsAt: yesterday,
    });
    await createTestEvent(project.id, {
      type: 'deadline',
      title: 'Oplevering',
      startsAt: inTenDays,
    });
    await createTestEvent(project.id, {
      type: 'deadline',
      title: 'Latere mijlpaal',
      startsAt: inTwentyDays,
    });
    await createTestEvent(project.id, {
      type: 'meeting',
      title: 'Geen deadline, telt niet mee',
      startsAt: new Date(Date.now() + 1000),
    });

    await createTestTicket(project.id, clientUser.id, { status: 'new' });
    await createTestTicket(project.id, clientUser.id, { status: 'in_progress' });
    await createTestTicket(project.id, clientUser.id, { status: 'resolved' });

    try {
      const rows = await listProjects(await adminHeaders(), testDb);
      const row = rows.find((candidate) => candidate.id === project.id);
      expect(row).toMatchObject({
        clientName: client.name,
        openTicketCount: 2,
        nextDeadline: { title: 'Oplevering' },
      });
      expect(row?.nextDeadline?.startsAt.getTime()).toBe(inTenDays.getTime());
    } finally {
      await cleanupTestClient(client.id, [clientUser.id]);
    }
  });

  it('reports null for a project with no upcoming deadline and zero for no open tickets', async () => {
    const client = await createTestClient();
    const project = await createTestProject(client.id, { status: 'completed' });

    try {
      const rows = await listProjects(await adminHeaders(), testDb);
      const row = rows.find((candidate) => candidate.id === project.id);
      expect(row).toMatchObject({ nextDeadline: null, openTicketCount: 0 });
    } finally {
      await cleanupTestClient(client.id);
    }
  });

  it('returns every project in one call, each with its own client and counts', async () => {
    const client = await createTestClient();
    const projectA = await createTestProject(client.id);
    const projectB = await createTestProject(client.id);
    const projectC = await createTestProject(client.id);

    try {
      const rows = await listProjects(await adminHeaders(), testDb);
      expect(rows.map((row) => row.id)).toEqual(
        expect.arrayContaining([projectA.id, projectB.id, projectC.id]),
      );
    } finally {
      await cleanupTestClient(client.id);
    }
  });
});

describe('getProjectById', () => {
  it('rejects a non-admin', async () => {
    const client = await createTestClient();
    const project = await createTestProject(client.id);
    const { headers, cleanup } = await createTempClientSession();
    try {
      await expect(getProjectById(headers, project.id, testDb)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    } finally {
      await cleanup();
      await cleanupTestClient(client.id);
    }
  });

  it('returns the project with its client name', async () => {
    const client = await createTestClient();
    const project = await createTestProject(client.id, { name: 'Test detailproject' });

    try {
      const detail = await getProjectById(await adminHeaders(), project.id, testDb);
      expect(detail.project).toMatchObject({ id: project.id, name: 'Test detailproject' });
      expect(detail.clientName).toBe(client.name);
    } finally {
      await cleanupTestClient(client.id);
    }
  });

  it('throws NOT_FOUND for a non-existent id', async () => {
    await expect(
      getProjectById(await adminHeaders(), crypto.randomUUID(), testDb),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws NOT_FOUND for a malformed id instead of a raw database error', async () => {
    await expect(getProjectById(await adminHeaders(), 'not-a-uuid', testDb)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('listSelectableClients', () => {
  it('rejects a non-admin', async () => {
    const { headers, cleanup } = await createTempClientSession();
    try {
      await expect(listSelectableClients(headers, testDb)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    } finally {
      await cleanup();
    }
  });

  it('lists clients sorted by name', async () => {
    const client = await createTestClient({ name: 'Zzz Sort Test Client' });
    try {
      const rows = await listSelectableClients(await adminHeaders(), testDb);
      expect(rows.some((row) => row.id === client.id)).toBe(true);
    } finally {
      await cleanupTestClient(client.id);
    }
  });
});
