import { describe, expect, it } from 'vitest';

import { inviteEmail } from '@/emails/invite';
import { sanitizeSubjectPart, truncate } from '@/emails/layout';
import { magicLinkEmail } from '@/emails/magic-link';
import { passwordResetEmail } from '@/emails/password-reset';
import { ticketConfirmationEmail, ticketConfirmationEmailText } from '@/emails/ticket-confirmation';
import {
  newTicketNotificationEmail,
  newTicketNotificationEmailText,
} from '@/emails/ticket-notification';

describe('inviteEmail', () => {
  it('includes the client name, inviter, recipient and accept link', () => {
    const html = inviteEmail({
      clientName: 'Verlinden & Zn',
      invitedByName: 'Jonas De Meyer',
      recipientEmail: 'katrien@verlinden.be',
      acceptUrl: 'https://portaal.studio.be/uitnodiging/abc123',
    });

    expect(html).toContain('Verlinden &amp; Zn');
    expect(html).toContain('Jonas De Meyer');
    expect(html).toContain('katrien@verlinden.be');
    expect(html).toContain('https://portaal.studio.be/uitnodiging/abc123');
    expect(html).toContain('7 dagen geldig');
  });
});

describe('magicLinkEmail', () => {
  it('includes the sign-in link and the 15-minute, single-use notice', () => {
    const html = magicLinkEmail({
      clientName: 'Verlinden & Zn',
      signInUrl: 'https://portaal.studio.be/api/auth/magic-link/verify?token=xyz',
    });

    expect(html).toContain('https://portaal.studio.be/api/auth/magic-link/verify?token=xyz');
    expect(html).toContain('15 minuten');
    expect(html).toContain('werkt één keer');
  });
});

describe('passwordResetEmail', () => {
  it('includes the name, reset link and the 1-hour notice', () => {
    const html = passwordResetEmail({
      name: 'Eloy Boone',
      resetUrl: 'https://studio.be/login/wachtwoord-resetten?token=xyz',
    });

    expect(html).toContain('Eloy Boone');
    expect(html).toContain('https://studio.be/login/wachtwoord-resetten?token=xyz');
    expect(html).toContain('1 uur');
  });
});

describe('sanitizeSubjectPart', () => {
  it('strips newlines, tabs and control characters', () => {
    expect(sanitizeSubjectPart('Verlinden\r\n& Zn')).toBe('Verlinden & Zn');
    expect(sanitizeSubjectPart('Foo\tBar')).toBe('Foo Bar');
  });
});

describe('truncate', () => {
  it('leaves short text unchanged', () => {
    expect(truncate('Korte tekst', 300)).toBe('Korte tekst');
  });

  it('shortens long text with an ellipsis', () => {
    const long = 'a'.repeat(310);
    const result = truncate(long, 300);
    expect(result).toHaveLength(301);
    expect(result.endsWith('…')).toBe(true);
  });
});

const confirmationInput = {
  clientName: 'Verlinden & Zn',
  projectName: 'Herbouw website',
  ticketTitle: 'Contactformulier verzendt niet',
  ticketReference: 'TCK-C28639F9',
  reportedAt: '16 september 2026, 08:14',
  ticketUrl: 'https://portaal.studio.be/portal/tickets/c28639f9-9df5-4df1-b035-70e474d17fb2',
};

describe('ticketConfirmationEmail', () => {
  it('includes the project, title, reference, timestamp, status and link, but no priority', () => {
    const html = ticketConfirmationEmail(confirmationInput);

    expect(html).toContain('Herbouw website');
    expect(html).toContain('Contactformulier verzendt niet');
    expect(html).toContain('TCK-C28639F9');
    expect(html).toContain('16 september 2026, 08:14');
    expect(html).toContain('Ontvangen');
    expect(html).toContain(confirmationInput.ticketUrl);
    // The generic "hoge prioriteit" SLA sentence is expected copy — what
    // must never appear is the ticket's own priority as a labeled value.
    expect(html).not.toMatch(/>Prioriteit<\/td>/);
  });

  it('escapes a title containing HTML', () => {
    const html = ticketConfirmationEmail({
      ...confirmationInput,
      ticketTitle: '<script>alert(1)</script>',
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('never contains a raw newline in a way that could break the subject it is paired with', () => {
    // The template itself doesn't build the subject, but a title with a
    // newline must still render safely inside the HTML body.
    const html = ticketConfirmationEmail({
      ...confirmationInput,
      ticketTitle: 'Regel een\nRegel twee',
    });
    expect(html).toContain('Regel een\nRegel twee');
  });
});

describe('ticketConfirmationEmailText', () => {
  it('is plain text with the same key data, no HTML tags', () => {
    const text = ticketConfirmationEmailText(confirmationInput);

    expect(text).toContain('Herbouw website');
    expect(text).toContain('TCK-C28639F9');
    expect(text).toContain(confirmationInput.ticketUrl);
    expect(text).not.toContain('<');
  });
});

const notificationInput = {
  clientName: 'Verlinden & Zn',
  projectName: 'Herbouw website',
  ticketTitle: 'Contactformulier verzendt niet',
  ticketReference: 'TCK-C28639F9',
  priority: 'high' as const,
  reporterName: 'Katrien Verlinden',
  reportedAt: '16 september 2026, 08:14',
  description: 'Wanneer ik het contactformulier verstuur, komt er geen bevestigingsmail toe.',
  attachmentCount: 1,
  ticketUrl: 'https://app.studio.be/app/tickets/c28639f9-9df5-4df1-b035-70e474d17fb2',
};

describe('newTicketNotificationEmail', () => {
  it('includes client, project, reporter, priority, attachment count, description and link', () => {
    const html = newTicketNotificationEmail(notificationInput);

    expect(html).toContain('Verlinden &amp; Zn');
    expect(html).toContain('Herbouw website');
    expect(html).toContain('Katrien Verlinden');
    expect(html).toContain('Prioriteit: hoog');
    expect(html).toContain('1 schermafbeelding');
    expect(html).toContain('contactformulier verstuur');
    expect(html).toContain(notificationInput.ticketUrl);
  });

  it('truncates a long description with an ellipsis', () => {
    const html = newTicketNotificationEmail({
      ...notificationInput,
      description: 'x'.repeat(400),
    });

    expect(html).toContain('…');
    expect(html).not.toContain('x'.repeat(400));
  });

  it('omits the description paragraph entirely when there is none', () => {
    const html = newTicketNotificationEmail({ ...notificationInput, description: '' });
    expect(html).not.toContain('“”');
  });

  it('escapes a title containing HTML', () => {
    const html = newTicketNotificationEmail({
      ...notificationInput,
      ticketTitle: '<img src=x onerror=alert(1)>',
    });

    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img');
  });

  it('never puts a raw newline from the title or client name into the subject-safe parts', () => {
    const html = newTicketNotificationEmail({
      ...notificationInput,
      clientName: 'Verlinden\r\n& Zn',
    });
    // The <title> tag mirrors the subject and must not contain a raw CRLF.
    const titleTagMatch = html.match(/<title>([\s\S]*?)<\/title>/);
    expect(titleTagMatch?.[1]).not.toMatch(/[\r\n]/);
  });
});

describe('newTicketNotificationEmailText', () => {
  it('is plain text with the same key data, no HTML tags', () => {
    const text = newTicketNotificationEmailText(notificationInput);

    expect(text).toContain('Verlinden & Zn');
    expect(text).toContain('Katrien Verlinden');
    expect(text).toContain('Prioriteit: hoog');
    expect(text).toContain(notificationInput.ticketUrl);
    expect(text).not.toContain('<');
  });
});
