import { and, eq, isNull, lt } from 'drizzle-orm';

import { db, type Database } from '@/db';
import { documents, files, ticketAttachments } from '@/db/schema';
import { deleteObject } from '@/lib/storage';

export const DEFAULT_MAX_AGE_HOURS = 24;

export type CleanedUpFile = { id: string; storageKey: string; filename: string };

/** Exported separately from main() so it's directly testable against testDb. */
export async function cleanupOrphanFiles(
  maxAgeHours: number = DEFAULT_MAX_AGE_HOURS,
  database: Database = db,
): Promise<CleanedUpFile[]> {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  const orphans = await database
    .select({ id: files.id, storageKey: files.storageKey, filename: files.filename })
    .from(files)
    .leftJoin(documents, eq(documents.fileId, files.id))
    .leftJoin(ticketAttachments, eq(ticketAttachments.fileId, files.id))
    .where(
      and(lt(files.createdAt, cutoff), isNull(documents.id), isNull(ticketAttachments.ticketId)),
    );

  for (const orphan of orphans) {
    // Storage first: if this throws, the database row survives and the next
    // run retries it, rather than leaving a row pointing at a deleted object.
    await deleteObject(orphan.storageKey);
    await database.delete(files).where(eq(files.id, orphan.id));
  }

  return orphans;
}

// Standalone script, not a scheduled job (out of scope per CLAUDE.md's
// object storage slice) — run manually or wire up an external scheduler:
//   pnpm storage:cleanup-orphans [max-age-in-hours]
async function main() {
  const maxAgeHours = Number(process.argv[2] ?? DEFAULT_MAX_AGE_HOURS);
  const cleaned = await cleanupOrphanFiles(maxAgeHours);

  if (cleaned.length === 0) {
    console.log(`Geen weesbestanden ouder dan ${maxAgeHours} uur.`);
    return;
  }

  for (const file of cleaned) {
    console.log(`Verwijderd: ${file.filename} (${file.storageKey})`);
  }
  console.log(`${cleaned.length} weesbestand(en) opgeruimd.`);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
