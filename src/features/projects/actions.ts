'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import type { z } from 'zod';

import { db } from '@/db';
import { clients, projects } from '@/db/schema';
import { projectFormSchema, updateProjectSchema } from '@/features/projects/schemas';
import { assertProjectAccess, requireAdmin } from '@/lib/access';
import { createFormAction } from '@/lib/form-action';
import { formatDateOnly } from '@/lib/utils';

async function assertClientExists(clientId: string): Promise<void> {
  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  if (!existing) {
    throw new Error('Kies een bestaande klant.');
  }
}

/** The form always sends a string for the optional description — empty means "not set". */
function toNullable(value: string): string | null {
  return value === '' ? null : value;
}

function toProjectFields(data: z.infer<typeof projectFormSchema>) {
  return {
    clientId: data.clientId,
    name: data.name,
    description: toNullable(data.description),
    websiteUrl: toNullable(data.websiteUrl),
    status: data.status,
    startDate: formatDateOnly(data.startDate),
    dueDate: formatDateOnly(data.dueDate),
  };
}

export const createProject = createFormAction(projectFormSchema, async (data) => {
  await requireAdmin(await headers());
  await assertClientExists(data.clientId);

  const [project] = await db.insert(projects).values(toProjectFields(data)).returning();

  revalidatePath('/app/projects');
  revalidatePath(`/app/clients/${data.clientId}`);
  return { projectId: project.id };
});

export const updateProject = createFormAction(updateProjectSchema, async (data) => {
  const admin = await requireAdmin(await headers());

  const { projectId, ...fields } = data;
  const existing = await assertProjectAccess(admin, projectId);
  await assertClientExists(fields.clientId);

  await db.update(projects).set(toProjectFields(fields)).where(eq(projects.id, projectId));

  revalidatePath('/app/projects');
  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath(`/app/clients/${existing.clientId}`);
  if (existing.clientId !== fields.clientId) {
    revalidatePath(`/app/clients/${fields.clientId}`);
  }
  return { projectId };
});

export async function archiveProject(projectId: string): Promise<void> {
  const admin = await requireAdmin(await headers());
  const project = await assertProjectAccess(admin, projectId);

  if (project.status === 'archived') {
    throw new Error('Dit project is al gearchiveerd.');
  }

  await db.update(projects).set({ status: 'archived' }).where(eq(projects.id, projectId));

  revalidatePath('/app/projects');
  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath(`/app/clients/${project.clientId}`);
}
