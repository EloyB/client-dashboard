'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { CheckboxField, PasswordField, TextField } from '@/components/shared/FormFields';
import { authClient } from '@/lib/auth-client';
import { isSafeRedirectPath } from '@/lib/safe-redirect';

const loginSchema = z.object({
  email: z.email('Vul een geldig e-mailadres in.'),
  password: z.string().min(1, 'Vul uw wachtwoord in.'),
  rememberMe: z.boolean(),
});

type LoginInput = z.infer<typeof loginSchema>;

// One neutral message for every failure (unknown email, wrong password, an
// unverified account): it must never confirm whether an address exists.
const NEUTRAL_ERROR = 'Het e-mailadres of het wachtwoord is niet juist.';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState(0);

  const { control, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = setTimeout(() => setRetryAfter((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [retryAfter]);

  async function onSubmit(data: LoginInput) {
    setFormError(null);
    let retryAfterHeader: string | null = null;

    const { error } = await authClient.signIn.email(
      { email: data.email, password: data.password, rememberMe: data.rememberMe },
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
        setFormError(NEUTRAL_ERROR);
      }
      return;
    }

    const next = searchParams.get('next');
    router.push(isSafeRedirectPath(next) ? next : '/app');
    router.refresh();
  }

  const isLocked = retryAfter > 0;
  const isBusy = formState.isSubmitting || isLocked;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <fieldset disabled={isBusy} className="flex flex-col gap-4">
        <TextField
          control={control}
          name="email"
          label="E-mailadres"
          type="email"
          autoComplete="email"
          placeholder="jonas@studio.be"
          required
        />
        <div className="relative">
          <PasswordField
            control={control}
            name="password"
            label="Wachtwoord"
            autoComplete="current-password"
            required
          />
          <Link
            href="/login/wachtwoord-vergeten"
            className="text-small text-primary absolute top-0 right-0 font-semibold underline"
          >
            Wachtwoord vergeten?
          </Link>
        </div>
        <CheckboxField
          control={control}
          name="rememberMe"
          label="Aangemeld blijven op dit toestel"
        />

        {formError && <p className="text-small text-destructive">{formError}</p>}

        <Button type="submit" className="w-full" disabled={isBusy}>
          {formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isLocked
            ? `Probeer opnieuw over ${retryAfter}s`
            : formState.isSubmitting
              ? 'Aanmelden...'
              : 'Aanmelden'}
        </Button>
      </fieldset>
    </form>
  );
}
