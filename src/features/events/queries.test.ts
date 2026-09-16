import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  cleanupTestClient,
  createTestClient,
  createTestClientUser,
  createTestProject,
} from '@/db/test-fixtures';
import { testDb } from '@/db/test-client';
import { events } from '@/db/schema';
import { getEventById, listEventsForProject } from '@/features/events/queries';
import type { AuthenticatedUser } from '@/lib/access';

describe('events queries', () => {
  const admin: AuthenticatedUser = { id: 'admin-fixture', role: 'admin', clientId: null };

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
        startsAt: now,
        visibleToClient: true,
      })
      .returning();

    [hiddenEvent] = await testDb
      .insert(events)
      .values({
        projectId: projectA.id,
        title: 'Interne review',
        startsAt: now,
        visibleToClient: false,
      })
      .returning();

    [eventB] = await testDb
      .insert(events)
      .values({
        projectId: projectB.id,
        title: 'Startvergadering',
        startsAt: now,
        visibleToClient: true,
      })
      .returning();
  });

  afterEach(async () => {
    await cleanupTestClient(clientA.id, [userA1.id]);
    await cleanupTestClient(clientB.id, [userB1.id]);
  });

  it('lets an admin see hidden and visible events', async () => {
    const result = await listEventsForProject(admin, projectA.id, testDb);

    expect(result.map((event) => event.id).sort()).toEqual(
      [visibleEvent.id, hiddenEvent.id].sort(),
    );
  });

  it('hides events with visibleToClient = false from a client user', async () => {
    const asUserA1: AuthenticatedUser = { id: userA1.id, role: 'client', clientId: clientA.id };

    const result = await listEventsForProject(asUserA1, projectA.id, testDb);

    expect(result.map((event) => event.id)).toEqual([visibleEvent.id]);

    await expect(getEventById(asUserA1, hiddenEvent.id, testDb)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('never returns another client’s events, even by a known ID', async () => {
    const asUserA1: AuthenticatedUser = { id: userA1.id, role: 'client', clientId: clientA.id };

    await expect(listEventsForProject(asUserA1, projectB.id, testDb)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });

    await expect(getEventById(asUserA1, eventB.id, testDb)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
