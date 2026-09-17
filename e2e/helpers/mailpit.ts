// Reads the local Mailpit instance (see docker-compose.yml) that catches
// every email sent in development — see src/lib/email.ts.
const MAILPIT_URL = 'http://localhost:8026';

type MailpitMessage = { ID: string; Subject: string; To: { Address: string }[] };

/**
 * Tests run Desktop and Mobile projects in parallel against the same Mailpit
 * instance, so matching must filter by recipient (and optionally subject)
 * rather than "the latest message" — otherwise two tests racing for the
 * same seeded address can pick up each other's email.
 */
export async function waitForMailpitMessage(
  toAddress: string,
  subjectContains?: string,
  timeoutMs = 10000,
): Promise<MailpitMessage> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const response = await fetch(`${MAILPIT_URL}/api/v1/messages`);
    const data = await response.json();
    const message: MailpitMessage | undefined = data.messages.find(
      (candidate: MailpitMessage) =>
        candidate.To?.some((recipient) => recipient.Address === toAddress) &&
        (!subjectContains || candidate.Subject.includes(subjectContains)),
    );
    if (message) return message;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(
    `No email to ${toAddress} arrived in Mailpit in time. Is \`docker compose up mailpit\` running?`,
  );
}

export async function mailpitHtml(messageId: string): Promise<string> {
  const response = await fetch(`${MAILPIT_URL}/api/v1/message/${messageId}`);
  const data = await response.json();
  return data.HTML;
}

/** Mailpit's JSON escapes "&" as "&amp;" inside href attributes. */
export function extractLink(html: string, pathFragment: string): string {
  const links = [...html.matchAll(/href="([^"]+)"/g)].map((match) =>
    match[1].replace(/&amp;/g, '&'),
  );
  const link = links.find((candidate) => candidate.includes(pathFragment));
  if (!link) {
    throw new Error(`No link containing "${pathFragment}" found in the email`);
  }
  return link;
}
