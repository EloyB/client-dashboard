'use server';

import { headers } from 'next/headers';

import { db } from '@/db';
import { projects } from '@/db/schema';
import { requireAdmin } from '@/lib/access';

/** Demo-only: a real project id to upload against, so requestUpload's access check has something to check. */
export async function getDemoProjectId(): Promise<string> {
  await requireAdmin(await headers());

  const [project] = await db.select({ id: projects.id }).from(projects).limit(1);
  if (!project) {
    throw new Error('Geen project gevonden. Draai eerst pnpm db:seed.');
  }
  return project.id;
}
