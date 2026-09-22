import { describe, expect, it } from 'vitest';

import { testDb } from '@/db/test-client';
import {
  cleanupTestAdminUser,
  cleanupTestClient,
  cleanupTestFile,
  cleanupTestUsers,
  createTestAdminUser,
  createTestClient,
  createTestClientUser,
  createTestDocument,
  createTestFile,
  createTestProject,
  createTestTicket,
  createTestTicketAttachment,
} from '@/db/test-fixtures';
import {
  assertFileAccess,
  belongsToClient,
  getCurrentUser,
  isAdmin,
  isVisibleToUser,
  requireAdmin,
  requireClientUser,
  type AuthenticatedUser,
} from '@/lib/access';

const admin: AuthenticatedUser = { id: 'admin-1', role: 'admin', clientId: null };
const clientUser: AuthenticatedUser = { id: 'client-user-1', role: 'client', clientId: 'client-1' };

describe('isAdmin', () => {
  it('is true for an admin', () => {
    expect(isAdmin(admin)).toBe(true);
  });

  it('is false for a client user', () => {
    expect(isAdmin(clientUser)).toBe(false);
  });
});

describe('belongsToClient', () => {
  it('lets an admin access any client', () => {
    expect(belongsToClient(admin, 'some-other-client')).toBe(true);
  });

  it('lets a client user access their own client', () => {
    expect(belongsToClient(clientUser, 'client-1')).toBe(true);
  });

  it('blocks a client user from a different client', () => {
    expect(belongsToClient(clientUser, 'client-2')).toBe(false);
  });
});

describe('isVisibleToUser', () => {
  it('shows hidden resources to an admin', () => {
    expect(isVisibleToUser(admin, { visibleToClient: false })).toBe(true);
  });

  it('shows visible resources to a client user', () => {
    expect(isVisibleToUser(clientUser, { visibleToClient: true })).toBe(true);
  });

  it('hides invisible resources from a client user', () => {
    expect(isVisibleToUser(clientUser, { visibleToClient: false })).toBe(false);
  });
});

describe('a user with no session', () => {
  it('getCurrentUser resolves to null', async () => {
    const user = await getCurrentUser(new Headers());
    expect(user).toBeNull();
  });

  it('requireAdmin is rejected as UNAUTHENTICATED', async () => {
    await expect(requireAdmin(new Headers())).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('requireClientUser is rejected as UNAUTHENTICATED', async () => {
    await expect(requireClientUser(new Headers())).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });
});

describe('admin-only resources such as tasks', () => {
  it('are gated by requireAdmin, which only isAdmin() satisfies', () => {
    // Task queries must call requireAdmin() rather than assertProjectAccess(),
    // since project membership alone does not grant access to tasks.
    expect(isAdmin(clientUser)).toBe(false);
    expect(isAdmin(admin)).toBe(true);
  });
});

describe('assertFileAccess', () => {
  it('lets an admin access any file, even one not attached to anything yet', async () => {
    const adminUser = await createTestAdminUser();
    const file = await createTestFile(adminUser.id);

    try {
      await expect(assertFileAccess(admin, file.id, testDb)).resolves.toMatchObject({
        id: file.id,
      });
    } finally {
      await cleanupTestFile(file.id);
      await cleanupTestAdminUser(adminUser.id);
    }
  });

  it('rejects a client user for a file not attached to anything yet', async () => {
    const client = await createTestClient();
    const clientUserRow = await createTestClientUser(client.id);
    const file = await createTestFile(clientUserRow.id);
    const asClientUser: AuthenticatedUser = {
      id: clientUserRow.id,
      role: 'client',
      clientId: client.id,
    };

    try {
      await expect(assertFileAccess(asClientUser, file.id, testDb)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    } finally {
      await cleanupTestClient(client.id);
      await cleanupTestFile(file.id);
      await cleanupTestUsers([clientUserRow.id]);
    }
  });

  it('lets a client user access their own visible document', async () => {
    const client = await createTestClient();
    const clientUserRow = await createTestClientUser(client.id);
    const project = await createTestProject(client.id);
    const file = await createTestFile(clientUserRow.id);
    await createTestDocument(project.id, file.id, { visibleToClient: true });
    const asClientUser: AuthenticatedUser = {
      id: clientUserRow.id,
      role: 'client',
      clientId: client.id,
    };

    try {
      await expect(assertFileAccess(asClientUser, file.id, testDb)).resolves.toMatchObject({
        id: file.id,
      });
    } finally {
      await cleanupTestClient(client.id);
      await cleanupTestFile(file.id);
      await cleanupTestUsers([clientUserRow.id]);
    }
  });

  it('hides a document with visibleToClient: false from a client user', async () => {
    const client = await createTestClient();
    const clientUserRow = await createTestClientUser(client.id);
    const project = await createTestProject(client.id);
    const file = await createTestFile(clientUserRow.id);
    await createTestDocument(project.id, file.id, { visibleToClient: false });
    const asClientUser: AuthenticatedUser = {
      id: clientUserRow.id,
      role: 'client',
      clientId: client.id,
    };

    try {
      await expect(assertFileAccess(asClientUser, file.id, testDb)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    } finally {
      await cleanupTestClient(client.id);
      await cleanupTestFile(file.id);
      await cleanupTestUsers([clientUserRow.id]);
    }
  });

  it('lets a client user access a file attached to their own ticket', async () => {
    const client = await createTestClient();
    const clientUserRow = await createTestClientUser(client.id);
    const project = await createTestProject(client.id);
    const ticket = await createTestTicket(project.id, clientUserRow.id);
    const file = await createTestFile(clientUserRow.id);
    await createTestTicketAttachment(ticket.id, file.id);
    const asClientUser: AuthenticatedUser = {
      id: clientUserRow.id,
      role: 'client',
      clientId: client.id,
    };

    try {
      await expect(assertFileAccess(asClientUser, file.id, testDb)).resolves.toMatchObject({
        id: file.id,
      });
    } finally {
      await cleanupTestClient(client.id);
      await cleanupTestFile(file.id);
      await cleanupTestUsers([clientUserRow.id]);
    }
  });

  it('rejects a file attached to a different client’s document, even with a valid file id', async () => {
    const clientA = await createTestClient();
    const clientB = await createTestClient();
    const userB = await createTestClientUser(clientB.id);
    const projectA = await createTestProject(clientA.id);
    const file = await createTestFile(userB.id);
    await createTestDocument(projectA.id, file.id, { visibleToClient: true });
    const asUserB: AuthenticatedUser = { id: userB.id, role: 'client', clientId: clientB.id };

    try {
      await expect(assertFileAccess(asUserB, file.id, testDb)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    } finally {
      await cleanupTestClient(clientA.id);
      await cleanupTestClient(clientB.id);
      await cleanupTestFile(file.id);
      await cleanupTestUsers([userB.id]);
    }
  });

  it('rejects a file attached to a different client’s ticket, even with a valid file id', async () => {
    const clientA = await createTestClient();
    const clientB = await createTestClient();
    const userA = await createTestClientUser(clientA.id);
    const userB = await createTestClientUser(clientB.id);
    const projectA = await createTestProject(clientA.id);
    const ticket = await createTestTicket(projectA.id, userA.id);
    const file = await createTestFile(userB.id);
    await createTestTicketAttachment(ticket.id, file.id);
    const asUserB: AuthenticatedUser = { id: userB.id, role: 'client', clientId: clientB.id };

    try {
      await expect(assertFileAccess(asUserB, file.id, testDb)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    } finally {
      await cleanupTestClient(clientA.id);
      await cleanupTestClient(clientB.id);
      await cleanupTestFile(file.id);
      await cleanupTestUsers([userA.id, userB.id]);
    }
  });

  it('throws NOT_FOUND for a non-existent file id', async () => {
    await expect(assertFileAccess(admin, crypto.randomUUID(), testDb)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
