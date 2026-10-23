import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  cleanupTestClient,
  createTestClient,
  createTestClientUser,
  createTestProject,
} from '@/db/test-fixtures';
import { testDb } from '@/db/test-client';
import { events } from '@/db/schema';
import { listEventsForClient } from '@/features/events/queries.portal';
import type { AuthenticatedUser } from '@/lib/access';

describe('listEventsForClient', () => {
  let clientA: Awaited<ReturnType<typeof createTestClient>>;
  let clientB: Awaited<ReturnType<typeof createTestClient>>;
  let projectA: Awaited<ReturnType<typeof createTestProject>>;
  let projectB: Awaited<ReturnType<typeof createTestProject>>;
  let userA1: Awaited<ReturnType<typeof createTestClientUser>>;
  let userB1: Awaited<ReturnType<typeof createTestClientUser>>;
  let visibleEvent: typeof events.$inferSelect;
  let hiddenEvent: typeof events.$inferSelect;
  let eventB: typeof events.$inferSelect;

  beforeEach(async () => {
    clientA = await createTestClient();
    clientB = await createTestClient();
    projectA = await createTestProject(clientA.id);
    projectB = await createTestProject(clientB.id);
    userA1 = await createTestClientUser(clientA.id);
    userB1 = await createTestClientUser(clientB.id);

    const now = new Date();

    [visibleEvent] = await testDb
      .insert(events)
      .values({
        projectId: projectA.id,
        title: 'Kickoff meeting',
        type: 'meeting',
        startsAt: now,
        visibleToClient: true,
      })
      .returning();

    [hiddenEvent] = await testDb
      .insert(events)
      .values({
        projectId: projectA.id,
        title: 'Interne review',
        type: 'other',
        startsAt: now,
        visibleToClient: false,
      })
      .returning();

    [eventB] = await testDb
      .insert(events)
      .values({
        projectId: projectB.id,
        title: 'Startvergadering',
        type: 'meeting',
        startsAt: now,
        visibleToClient: true,
      })
      .returning();
  });

  afterEach(async () => {
    await cleanupTestClient(clientA.id, [userA1.id]);
    await cleanupTestClient(clientB.id, [userB1.id]);
  });

  it('returns only visible events from the user’s own client', async () => {
    const asUserA1: AuthenticatedUser & { clientId: string } = {
      id: userA1.id,
      role: 'client',
      clientId: clientA.id,
    };

    const result = await listEventsForClient(asUserA1, testDb);
    const ids = result.map((event) => event.id);

    expect(ids).toEqual([visibleEvent.id]);
    expect(ids).not.toContain(hiddenEvent.id);
  });

  it('never includes another client’s events', async () => {
    const asUserA1: AuthenticatedUser & { clientId: string } = {
      id: userA1.id,
      role: 'client',
      clientId: clientA.id,
    };

    const result = await listEventsForClient(asUserA1, testDb);

    expect(result.map((event) => event.id)).not.toContain(eventB.id);
  });

  it('includes project metadata for grouping and display', async () => {
    const asUserA1: AuthenticatedUser & { clientId: string } = {
      id: userA1.id,
      role: 'client',
      clientId: clientA.id,
    };

    const [row] = await listEventsForClient(asUserA1, testDb);

    expect(row).toMatchObject({
      projectId: projectA.id,
      projectName: projectA.name,
      type: 'meeting',
    });
  });
});
