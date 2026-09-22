import nodemailer from 'nodemailer';

import { env } from '@/lib/env';

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /** Extra fields merged into the failure log only — never the message body or a link. */
  context?: Record<string, unknown>;
};

// Local dev/CI: everything lands in Mailpit (docker-compose), never a real
// inbox. See docker-compose.yml — SMTP on 1026 (non-default to avoid
// clashing with other local projects' Mailpit instances), UI on :8026.
const mailpitTransport = nodemailer.createTransport({
  host: 'localhost',
  port: 1026,
  secure: false,
});

async function sendViaMailpit(message: EmailMessage): Promise<void> {
  await mailpitTransport.sendMail({
    from: env.EMAIL_FROM,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
    replyTo: message.replyTo,
  });
}

async function sendViaResend(message: EmailMessage): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend request failed with status ${response.status}: ${body}`);
  }
}

/**
 * The only place features may trigger an email send. Swaps transport by
 * environment: Resend in production, Mailpit locally (see CLAUDE.md "Email").
 * A failed send is logged with enough context to debug — recipient and
 * subject, never the message body, since that may contain a sign-in link.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  try {
    if (process.env.NODE_ENV === 'production') {
      await sendViaResend(message);
    } else {
      await sendViaMailpit(message);
    }
  } catch (error) {
    console.error('Failed to send email', {
      to: message.to,
      subject: message.subject,
      ...message.context,
      error: error instanceof Error ? error.message : error,
    });
  }
}
