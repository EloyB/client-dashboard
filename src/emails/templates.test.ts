import { describe, expect, it } from 'vitest';

import { inviteEmail } from '@/emails/invite';
import { magicLinkEmail } from '@/emails/magic-link';
import { passwordResetEmail } from '@/emails/password-reset';

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
