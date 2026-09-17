'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { AuthNoticeIconStandalone } from '@/components/shared/AuthNotice';

const RESEND_COOLDOWN_SECONDS = 45;

// Shared "Kijk in uw mailbox" confirmation for the client sign-in flow — the
// same screen after both accepting an invitation and requesting a sign-in
// link (see docs/design/handoff/client-dashboard/project/Klantportaal
// aanmelden.dc.html, screen 3).
export function PortalMailboxCheck({
  email,
  onResend,
  onUseDifferentEmail,
}: {
  email: string;
  onResend: () => Promise<void>;
  onUseDifferentEmail: () => void;
}) {
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleResend() {
    setIsResending(true);
    try {
      await onResend();
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AuthNoticeIconStandalone variant="success" />
      <div>
        <p className="font-display text-h2">Kijk in uw mailbox</p>
        <p className="text-body text-muted-foreground mt-1">
          We hebben een e-mail gestuurd naar{' '}
          <span className="text-foreground font-semibold">{email}</span>. Klik in die e-mail op{' '}
          <span className="font-semibold">Aanmelden bij het portaal</span> en u bent binnen.
        </p>
      </div>

      <ul className="text-small text-muted-foreground flex flex-col gap-1.5">
        <li>· De e-mail komt meestal binnen één minuut aan.</li>
        <li>· Niets te zien? Kijk in de map ongewenste e-mail of spam.</li>
        <li>· Open de link op het toestel waarop u wilt werken.</li>
      </ul>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={cooldown > 0 || isResending}
        onClick={handleResend}
      >
        {cooldown > 0 ? `E-mail opnieuw versturen (${cooldown}s)` : 'E-mail opnieuw versturen'}
      </Button>

      <button
        type="button"
        onClick={onUseDifferentEmail}
        className="text-small text-primary self-center font-semibold underline"
      >
        Ander e-mailadres gebruiken
      </button>
    </div>
  );
}
