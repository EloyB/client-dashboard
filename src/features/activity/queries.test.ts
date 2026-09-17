import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { activityLog, tasks } from '@/db/schema';
import { testDb } from '@/db/test-client';
import {
  cleanupTestClient,
  createTestClient,
  createTestClientUser,
  createTestProject,
} from '@/db/test-fixtures';
import { listActivityForProject } from '@/features/activity/queries';
import type { AuthenticatedUser } from '@/lib/access';

describe('activity log queries', () => {
  const admin: AuthenticatedUser = { id: 'admin-fixture', role: 'admin', clientId: null };

  let clientA: Awaited<ReturnType<typeof createTestClient>>;
  let clientB: Awaited<ReturnType<typeof createTestClient>>;
  let projectA: Awaited<ReturnType<typeof createTestProject>>;
  let projectB: Awaited<ReturnType<typeof createTestProject>>;
  let userA1: Awaited<ReturnType<typeof createTestClientUser>>;
  let userB1: Awaited<ReturnType<typeof createTestClientUser>>;
  let documentEntry: typeof activityLog.$inferSelect;
  let taskEntry: typeof activityLog.$inferSelect;

  beforeEach(async () => {
    clientA = await createTestClient();
    clientB = await createTestClient();
    projectA = await createTestProject(clientA.id);
    projectB = await createTestProject(clientB.id);
    userA1 = await createTestClientUser(clientA.id);
    userB1 = await createTestClientUser(clientB.id);

    const [task] = await testDb
      .insert(tasks)
      .values({ projectId: projectA.id, title: 'Interne taak', position: 'a0' })
      .returning();

    [documentEntry] = await testDb
      .insert(activityLog)
      .values({
        projectId: projectA.id,
        actorId: userA1.id,
        type: 'document_added',
        description: 'Offerte.pdf toegevoegd',
      })
      .returning();

    [taskEntry] = await testDb
      .insert(activityLog)
      .values({
        projectId: projectA.id,
        taskId: task.id,
        type: 'task_status_changed',
        description: 'Taak verplaatst naar Review',
      })
      .returning();
  });

  afterEach(async () => {
    await cleanupTestClient(clientA.id, [userA1.id]);
    await cleanupTestClient(clientB.id, [userB1.id]);
  });

  it('lets an admin see task-related and non-task-related activity', async () => {
    const result = await listActivityForProject(admin, projectA.id, testDb);

    expect(result.map((entry) => entry.id).sort()).toEqual([documentEntry.id, taskEntry.id].sort());
  });

  it('never shows task-related activity to a client user', async () => {
    const asUserA1: AuthenticatedUser = { id: userA1.id, role: 'client', clientId: clientA.id };

    const result = await listActivityForProject(asUserA1, projectA.id, testDb);

    expect(result.map((entry) => entry.id)).toEqual([documentEntry.id]);
  });

  it('never returns another client’s project activity, even by a known ID', async () => {
    const asUserA1: AuthenticatedUser = { id: userA1.id, role: 'client', clientId: clientA.id };

    await expect(listActivityForProject(asUserA1, projectB.id, testDb)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
