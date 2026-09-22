'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { AuthNoticeBox } from '@/components/shared/AuthNotice';
import { TextField } from '@/components/shared/FormFields';
import { authClient } from '@/lib/auth-client';

const forgotPasswordSchema = z.object({
  email: z.email('Vul een geldig e-mailadres in.'),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const { control, handleSubmit, formState, getValues } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function requestReset(email: string): Promise<boolean> {
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: '/login/wachtwoord-resetten',
    });
    if (error) {
      setFormError('Er ging iets mis. Probeer opnieuw.');
      return false;
    }
    return true;
  }

  async function onSubmit(data: ForgotPasswordInput) {
    setFormError(null);
    if (await requestReset(data.email)) {
      setSentTo(data.email);
    }
  }

  async function handleResend() {
    setIsResending(true);
    try {
      await requestReset(sentTo ?? getValues('email'));
    } finally {
      setIsResending(false);
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="font-display text-h2">Controleer uw mailbox</p>
          <p className="text-body text-muted-foreground mt-1">We hebben de aanvraag ontvangen.</p>
        </div>
        <AuthNoticeBox variant="success">
          Bestaat er een account met dit e-mailadres, dan is de link onderweg. Kijk ook in de map
          ongewenste e-mail.
        </AuthNoticeBox>
        <Button asChild className="w-full">
          <Link href="/login">
            <ArrowLeft strokeWidth={1.75} />
            Terug naar aanmelden
          </Link>
        </Button>
        <p className="text-small text-muted-foreground text-center">
          Geen e-mail ontvangen?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-primary font-semibold underline disabled:opacity-50"
          >
            Opnieuw versturen
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div>
        <p className="font-display text-h2">Wachtwoord vergeten</p>
        <p className="text-body text-muted-foreground mt-1">
          Vul uw e-mailadres in en we sturen u een link om een nieuw wachtwoord in te stellen.
        </p>
      </div>
      <fieldset disabled={formState.isSubmitting} className="flex flex-col gap-4">
        <TextField
          control={control}
          name="email"
          label="E-mailadres"
          type="email"
          autoComplete="email"
          placeholder="naam@studio.be"
          hint="U ontvangt een link die één uur geldig blijft."
          required
        />
        {formError && <p className="text-small text-destructive">{formError}</p>}
        <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? (
            <Loader2 className="animate-spin" strokeWidth={1.75} />
          ) : (
            <Send strokeWidth={1.75} />
          )}
          {formState.isSubmitting ? 'Bezig...' : 'Stuur de link'}
        </Button>
        <Link href="/login" className="text-small text-primary text-center font-semibold">
          Terug naar aanmelden
        </Link>
      </fieldset>
    </form>
  );
}
