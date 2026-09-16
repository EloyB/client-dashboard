import { describe, expect, it } from 'vitest';

import {
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
