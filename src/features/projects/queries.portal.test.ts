import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  cleanupTestClient,
  createTestClient,
  createTestClientUser,
  createTestEvent,
  createTestProject,
} from '@/db/test-fixtures';
import { testDb } from '@/db/test-client';
import { listProjectsForClient } from '@/features/projects/queries.portal';
import type { AuthenticatedUser } from '@/lib/access';

describe('listProjectsForClient', () => {
  let clientA: Awaited<ReturnType<typeof createTestClient>>;
  let clientB: Awaited<ReturnType<typeof createTestClient>>;
  let userA1: Awaited<ReturnType<typeof createTestClientUser>>;
  let userB1: Awaited<ReturnType<typeof createTestClientUser>>;

  beforeEach(async () => {
    clientA = await createTestClient();
    clientB = await createTestClient();
    userA1 = await createTestClientUser(clientA.id);
    userB1 = await createTestClientUser(clientB.id);
  });

  afterEach(async () => {
    await cleanupTestClient(clientA.id, [userA1.id]);
    await cleanupTestClient(clientB.id, [userB1.id]);
  });

  it('returns only the user’s own client’s non-archived projects', async () => {
    const activeProject = await createTestProject(clientA.id, { status: 'active' });
    const archivedProject = await createTestProject(clientA.id, { status: 'archived' });
    const otherClientProject = await createTestProject(clientB.id, { status: 'active' });

    const asUserA1: AuthenticatedUser & { clientId: string } = {
      id: userA1.id,
      role: 'client',
      clientId: clientA.id,
    };

    const rows = await listProjectsForClient(asUserA1, testDb);
    const ids = rows.map((row) => row.id);

    expect(ids).toContain(activeProject.id);
    expect(ids).not.toContain(archivedProject.id);
    expect(ids).not.toContain(otherClientProject.id);
  });

  it('includes the nearest upcoming visible deadline or meeting as the next step', async () => {
    const project = await createTestProject(clientA.id, { status: 'active' });

    await createTestEvent(project.id, {
      type: 'milestone',
      title: 'Geen mijlpaal in het antwoord',
      startsAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      visibleToClient: true,
    });
    await createTestEvent(project.id, {
      type: 'deadline',
      title: 'Interne deadline, niet zichtbaar',
      startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      visibleToClient: false,
    });
    await createTestEvent(project.id, {
      type: 'deadline',
      title: 'Later, telt niet mee als eerstvolgende',
      startsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      visibleToClient: true,
    });
    await createTestEvent(project.id, {
      type: 'meeting',
      title: 'Eerstvolgende zichtbare afspraak',
      startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      visibleToClient: true,
    });

    const asUserA1: AuthenticatedUser & { clientId: string } = {
      id: userA1.id,
      role: 'client',
      clientId: clientA.id,
    };

    const rows = await listProjectsForClient(asUserA1, testDb);
    const row = rows.find((candidate) => candidate.id === project.id);

    expect(row?.nextStep?.title).toBe('Eerstvolgende zichtbare afspraak');
  });

  it('has no next step when there is none upcoming, visible, deadline or meeting', async () => {
    const project = await createTestProject(clientA.id, { status: 'active' });

    const asUserA1: AuthenticatedUser & { clientId: string } = {
      id: userA1.id,
      role: 'client',
      clientId: clientA.id,
    };

    const rows = await listProjectsForClient(asUserA1, testDb);
    const row = rows.find((candidate) => candidate.id === project.id);

    expect(row?.nextStep).toBeNull();
  });
});
