'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { AuthNoticeBox, AuthNoticeIconStandalone } from '@/components/shared/AuthNotice';
import { PasswordField } from '@/components/shared/FormFields';
import { PasswordStrengthMeter } from '@/components/shared/PasswordStrengthMeter';
import { authClient } from '@/lib/auth-client';

const resetPasswordSchema = z
  .object({
    password: z.string().min(12, 'Minimaal 12 tekens.'),
    confirmPassword: z.string().min(1, 'Herhaal uw nieuwe wachtwoord.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'De twee wachtwoorden zijn niet gelijk.',
    path: ['confirmPassword'],
  });

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

type Mode = 'form' | 'expired' | 'done';

export function ResetPasswordForm({
  token,
  initialError,
}: {
  token: string | null;
  initialError: string | null;
}) {
  const [mode, setMode] = useState<Mode>(initialError || !token ? 'expired' : 'form');

  const { control, handleSubmit, formState } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const password = useWatch({ control, name: 'password' });

  async function onSubmit(data: ResetPasswordInput) {
    if (!token) return;
    // Any failure here means the token is gone (expired, already used, or
    // never valid) — resetPassword has no other realistic failure mode once
    // the client already validated password length.
    const { error } = await authClient.resetPassword({ newPassword: data.password, token });
    if (error) {
      setMode('expired');
      return;
    }
    setMode('done');
  }

  if (mode === 'expired') {
    return (
      <div className="flex flex-col gap-4">
        <AuthNoticeIconStandalone variant="warning" />
        <div>
          <p className="font-display text-h2">Deze link is niet meer geldig</p>
          <p className="text-body text-muted-foreground mt-1">
            Vraag een nieuwe link aan om uw wachtwoord in te stellen.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login/wachtwoord-vergeten">Nieuwe link aanvragen</Link>
        </Button>
      </div>
    );
  }

  if (mode === 'done') {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="font-display text-h2">Wachtwoord aangepast</p>
          <p className="text-body text-muted-foreground mt-1">U kunt zich nu aanmelden.</p>
        </div>
        <AuthNoticeBox variant="success">
          Uw wachtwoord is aangepast. Andere toestellen zijn afgemeld.
        </AuthNoticeBox>
        <Button asChild className="w-full">
          <Link href="/login">Aanmelden</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div>
        <p className="font-display text-h2">Nieuw wachtwoord</p>
        <p className="text-body text-muted-foreground mt-1">
          Kies een wachtwoord dat u nergens anders gebruikt.
        </p>
      </div>
      <fieldset disabled={formState.isSubmitting} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <PasswordField
            control={control}
            name="password"
            label="Nieuw wachtwoord"
            autoComplete="new-password"
            required
          />
          <PasswordStrengthMeter password={password} />
          <p className="text-small text-muted-foreground">
            Minimaal 12 tekens, met een cijfer of een symbool.
          </p>
        </div>
        <PasswordField
          control={control}
          name="confirmPassword"
          label="Herhaal nieuw wachtwoord"
          autoComplete="new-password"
          required
        />
        <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {formState.isSubmitting ? 'Bezig...' : 'Wachtwoord instellen'}
        </Button>
      </fieldset>
    </form>
  );
}
