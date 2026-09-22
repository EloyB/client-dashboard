import { and, eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

// Every action reads the session via next/headers' headers(), which throws
// outside a real request. Mocking it lets these tests drive the real
// UNAUTHENTICATED/FORBIDDEN/NOT_FOUND behaviour through the real actions.
let currentHeaders = new Headers();
vi.mock('next/headers', () => ({
  headers: async () => currentHeaders,
}));

const { db } = await import('@/db');
const { activityLog, clients, files, ticketAttachments, tickets } = await import('@/db/schema');
const {
  adminHeaders,
  createTempClient,
  createTempClientUserSession,
  createTempProject,
  uploadRealObject,
} = await import('@/db/test-real-session');
const { createTicket } = await import('@/features/tickets/actions');
const { requestUpload, confirmUpload } = await import('@/features/files/actions');

async function deleteTempClient(clientId: string) {
  await db.delete(clients).where(eq(clients.id, clientId));
}

async function deleteTestFile(fileId: string) {
  await db.delete(files).where(eq(files.id, fileId));
}

async function uploadTicketScreenshot(projectId: string): Promise<string> {
  const requested = await requestUpload({
    projectId,
    context: 'ticket_attachment',
    filename: 'screenshot.png',
    mimeType: 'image/png',
    size: 1024,
  });
  if (!requested.success) throw new Error('setup failed: requestUpload');
  await uploadRealObject(requested.data.uploadUrl, new Uint8Array(1024));
  const confirmed = await confirmUpload({
    projectId,
    context: 'ticket_attachment',
    storageKey: requested.data.storageKey,
    filename: 'screenshot.png',
  });
  if (!confirmed.success) throw new Error('setup failed: confirmUpload');
  return confirmed.data.fileId;
}

const validInput = {
  title: 'Contactformulier verzendt niet',
  description: 'Foutmelding bij versturen.',
  pageUrl: '',
  priority: 'medium' as const,
  fileIds: [] as string[],
};

describe('createTicket (server action)', () => {
  it('rejects an unauthenticated request', async () => {
    currentHeaders = new Headers();
    const client = await createTempClient();
    const project = await createTempProject(client.id);

    try {
      const result = await createTicket({ ...validInput, projectId: project.id });
      expect(result).toMatchObject({ success: false, formError: 'You must be signed in.' });
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('rejects an admin account', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);

    try {
      currentHeaders = await adminHeaders();
      const result = await createTicket({ ...validInput, projectId: project.id });
      expect(result).toMatchObject({
        success: false,
        formError: 'This action requires a client account.',
      });
    } finally {
      await deleteTempClient(client.id);
    }
  });

  it('rejects a project belonging to another client', async () => {
    const owner = await createTempClient();
    const ownerProject = await createTempProject(owner.id);
    const outsider = await createTempClient();
    const { headers, cleanup } = await createTempClientUserSession(outsider.id);

    try {
      currentHeaders = headers;
      const result = await createTicket({ ...validInput, projectId: ownerProject.id });
      expect(result).toMatchObject({ success: false, formError: 'Project not found.' });
    } finally {
      await cleanup();
      await deleteTempClient(owner.id);
      await deleteTempClient(outsider.id);
    }
  });

  it('rejects an archived project', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id, { status: 'archived' });
    const { headers, cleanup } = await createTempClientUserSession(client.id);

    try {
      currentHeaders = headers;
      const result = await createTicket({ ...validInput, projectId: project.id });
      expect(result).toMatchObject({ success: false, formError: 'Dit project is gearchiveerd.' });
    } finally {
      await cleanup();
      await deleteTempClient(client.id);
    }
  });

  it('creates a ticket with status new, the reporter from the session, and an activity log entry', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { userId, headers, cleanup } = await createTempClientUserSession(client.id);

    try {
      currentHeaders = headers;
      const result = await createTicket({
        ...validInput,
        projectId: project.id,
        pageUrl: 'https://example.com/contact',
        priority: 'high',
      });
      expect(result.success).toBe(true);
      if (!result.success) return;

      const [ticket] = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, result.data.ticketId))
        .limit(1);
      expect(ticket).toMatchObject({
        projectId: project.id,
        reportedById: userId,
        status: 'new',
        priority: 'high',
        pageUrl: 'https://example.com/contact',
      });

      const [logEntry] = await db
        .select()
        .from(activityLog)
        .where(eq(activityLog.ticketId, result.data.ticketId))
        .limit(1);
      expect(logEntry).toMatchObject({
        projectId: project.id,
        actorId: userId,
        type: 'ticket_created',
      });
    } finally {
      // The ticket references reportedById with onDelete: 'restrict', so the
      // client (which cascades away the project and the ticket with it) must
      // go before the user.
      await deleteTempClient(client.id);
      await cleanup();
    }
  });

  it('creates a ticket with a screenshot attached via ticket_attachments', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { headers, cleanup } = await createTempClientUserSession(client.id);
    let fileId: string | undefined;

    try {
      currentHeaders = headers;
      fileId = await uploadTicketScreenshot(project.id);

      const result = await createTicket({
        ...validInput,
        projectId: project.id,
        fileIds: [fileId],
      });
      expect(result.success).toBe(true);
      if (!result.success) return;

      const attachments = await db
        .select()
        .from(ticketAttachments)
        .where(eq(ticketAttachments.ticketId, result.data.ticketId));
      expect(attachments.map((attachment) => attachment.fileId)).toEqual([fileId]);
    } finally {
      // Client first (cascades the ticket and its ticket_attachments row,
      // freeing the file), then the file (files.uploadedById restricts),
      // then the user.
      await deleteTempClient(client.id);
      if (fileId) await deleteTestFile(fileId);
      await cleanup();
    }
  });

  it('rejects attaching a file uploaded by another user', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const uploaderSession = await createTempClientUserSession(client.id);
    const reporterSession = await createTempClientUserSession(client.id);
    let fileId: string | undefined;

    try {
      currentHeaders = uploaderSession.headers;
      fileId = await uploadTicketScreenshot(project.id);

      currentHeaders = reporterSession.headers;
      const result = await createTicket({
        ...validInput,
        projectId: project.id,
        fileIds: [fileId],
      });
      expect(result).toMatchObject({
        success: false,
        formError: 'Een van de schermafbeeldingen kon niet gekoppeld worden.',
      });

      const ticketCount = await db.select().from(tickets).where(eq(tickets.projectId, project.id));
      expect(ticketCount).toHaveLength(0);
    } finally {
      // No ticket was ever created here, so only the unattached file itself
      // (files.uploadedById restricts) blocks deleting the uploader.
      if (fileId) await deleteTestFile(fileId);
      await uploaderSession.cleanup();
      await reporterSession.cleanup();
      await deleteTempClient(client.id);
    }
  });

  it('rejects attaching a file that is already attached to another ticket', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { headers, cleanup } = await createTempClientUserSession(client.id);
    let fileId: string | undefined;

    try {
      currentHeaders = headers;
      fileId = await uploadTicketScreenshot(project.id);

      const first = await createTicket({
        ...validInput,
        title: 'Eerste melding',
        projectId: project.id,
        fileIds: [fileId],
      });
      expect(first.success).toBe(true);

      const second = await createTicket({
        ...validInput,
        title: 'Tweede melding',
        projectId: project.id,
        fileIds: [fileId],
      });
      expect(second).toMatchObject({
        success: false,
        formError: 'Een van de schermafbeeldingen kon niet gekoppeld worden.',
      });
    } finally {
      await deleteTempClient(client.id);
      if (fileId) await deleteTestFile(fileId);
      await cleanup();
    }
  });

  it('returns the same ticket instead of a duplicate on an immediate resubmission', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { headers, cleanup } = await createTempClientUserSession(client.id);

    try {
      currentHeaders = headers;
      const first = await createTicket({ ...validInput, projectId: project.id });
      const second = await createTicket({ ...validInput, projectId: project.id });
      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      if (!first.success || !second.success) return;

      expect(second.data.ticketId).toBe(first.data.ticketId);

      const matching = await db
        .select()
        .from(tickets)
        .where(and(eq(tickets.projectId, project.id), eq(tickets.title, validInput.title)));
      expect(matching).toHaveLength(1);
    } finally {
      await deleteTempClient(client.id);
      await cleanup();
    }
  });

  it('rejects an eleventh ticket within an hour', async () => {
    const client = await createTempClient();
    const project = await createTempProject(client.id);
    const { userId, headers, cleanup } = await createTempClientUserSession(client.id);

    try {
      currentHeaders = headers;
      await db.insert(tickets).values(
        Array.from({ length: 10 }, (_, index) => ({
          projectId: project.id,
          reportedById: userId,
          title: `Bestaande melding ${index}`,
        })),
      );

      const result = await createTicket({
        ...validInput,
        title: 'Elfde melding',
        projectId: project.id,
      });
      expect(result).toMatchObject({
        success: false,
        formError: 'Te veel meldingen kort na elkaar. Probeer het later opnieuw.',
      });
    } finally {
      await db.delete(tickets).where(eq(tickets.projectId, project.id));
      await cleanup();
      await deleteTempClient(client.id);
    }
  });
});
