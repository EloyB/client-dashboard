'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { AuthInfoBox, AuthNoticeIconStandalone } from '@/components/shared/AuthNotice';
import { TextField } from '@/components/shared/FormFields';
import { PortalMailboxCheck } from '@/components/shared/PortalMailboxCheck';
import { authClient } from '@/lib/auth-client';

const emailSchema = z.object({
  email: z.email('Vul een geldig e-mailadres in.'),
});

type EmailInput = z.infer<typeof emailSchema>;

type Mode = 'form' | 'sent' | 'expired';

export function AanmeldenForm({ initialError }: { initialError: string | null }) {
  const [mode, setMode] = useState<Mode>(initialError ? 'expired' : 'form');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState(0);

  const { control, handleSubmit, formState } = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = setTimeout(() => setRetryAfter((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [retryAfter]);

  async function requestLink(email: string): Promise<boolean> {
    let retryAfterHeader: string | null = null;

    // Always resolves the same way regardless of whether the address exists
    // — see src/lib/auth.ts's sendMagicLink hook — so success here never
    // confirms an account.
    const { error } = await authClient.signIn.magicLink(
      { email, callbackURL: '/portal', errorCallbackURL: '/aanmelden' },
      {
        onError: (context) => {
          retryAfterHeader = context.response.headers.get('X-Retry-After');
        },
      },
    );

    if (error) {
      if (retryAfterHeader) {
        setRetryAfter(Number(retryAfterHeader));
        setFormError('Te veel pogingen. Probeer opnieuw na de wachttijd.');
      } else {
        setFormError('Er ging iets mis. Probeer opnieuw.');
      }
      return false;
    }
    return true;
  }

  async function onSubmit(data: EmailInput) {
    setFormError(null);
    if (await requestLink(data.email)) {
      setSentTo(data.email);
      setMode('sent');
    }
  }

  async function handleResend() {
    if (sentTo) {
      await requestLink(sentTo);
    }
  }

  if (mode === 'sent' && sentTo) {
    return (
      <PortalMailboxCheck
        email={sentTo}
        onResend={handleResend}
        onUseDifferentEmail={() => {
          setSentTo(null);
          setMode('form');
        }}
      />
    );
  }

  const isExpired = mode === 'expired';
  const isBusy = formState.isSubmitting || retryAfter > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {isExpired ? (
        <>
          <AuthNoticeIconStandalone variant="warning" />
          <div>
            <p className="font-display text-h2">Deze link werkt niet meer</p>
            <p className="text-body text-muted-foreground mt-1">
              Dat is normaal: een aanmeldlink is 15 minuten geldig en kan één keer gebruikt worden.
              Vraag hieronder een nieuwe aan, dan staat er binnen een minuut een verse e-mail klaar.
            </p>
          </div>
          <AuthInfoBox title="Waarom gebeurt dit?">
            U klikte de link al eerder aan, of ze stond langer dan 15 minuten in uw mailbox. Soms
            opent uw e-mailprogramma de link ook automatisch; vraag in dat geval gewoon een nieuwe
            aan.
          </AuthInfoBox>
        </>
      ) : (
        <div>
          <p className="font-display text-h2">Aanmelden</p>
          <p className="text-body text-muted-foreground mt-1">
            Vul uw e-mailadres in. U ontvangt een e-mail met een knop om aan te melden. Zo hoeft u
            geen wachtwoord te onthouden.
          </p>
        </div>
      )}

      <fieldset disabled={isBusy} className="flex flex-col gap-4">
        <TextField
          control={control}
          name="email"
          label="E-mailadres"
          type="email"
          autoComplete="email"
          placeholder="naam@bedrijf.be"
          hint={isExpired ? undefined : 'Gebruik het adres waarop u de uitnodiging kreeg.'}
          required
        />
        {formError && <p className="text-small text-destructive">{formError}</p>}
        <Button type="submit" className="w-full" disabled={isBusy}>
          {formState.isSubmitting ? (
            <Loader2 className="animate-spin" strokeWidth={1.75} />
          ) : (
            <Send strokeWidth={1.75} />
          )}
          {retryAfter > 0
            ? `Probeer opnieuw over ${retryAfter}s`
            : isExpired
              ? 'Nieuwe aanmeldlink sturen'
              : 'Stuur mij een aanmeldlink'}
        </Button>
      </fieldset>

      {!isExpired && (
        <div className="border-border-subtle flex flex-col gap-1 border-t pt-4">
          <p className="text-small font-semibold">Geen uitnodiging ontvangen?</p>
          <p className="text-small text-muted-foreground">
            Alleen adressen die wij toevoegden krijgen toegang. Vraag uw contactpersoon bij ons om u
            toe te voegen, of bel 09 225 44 18.
          </p>
        </div>
      )}
    </form>
  );
}
