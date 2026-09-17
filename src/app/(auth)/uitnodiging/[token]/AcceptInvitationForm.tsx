'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { applyFormActionErrors } from '@/lib/form-action';
import { TextField } from '@/components/shared/FormFields';
import { PortalMailboxCheck } from '@/components/shared/PortalMailboxCheck';
import { acceptInvitation } from '@/features/clients/actions';
import { authClient } from '@/lib/auth-client';

const acceptInvitationFormSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  email: z.email('Vul een geldig e-mailadres in.'),
});

type AcceptInvitationFormInput = z.infer<typeof acceptInvitationFormSchema>;

const STEPS = [
  'U vult uw e-mailadres in.',
  'U krijgt een e-mail met één knop.',
  'U klikt op die knop en bent aangemeld. Een wachtwoord hebt u niet nodig.',
];

export function AcceptInvitationForm({
  token,
  clientName,
  defaultName,
  defaultEmail,
}: {
  token: string;
  clientName: string;
  defaultName: string;
  defaultEmail: string;
}) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, formState, setError } = useForm<AcceptInvitationFormInput>({
    resolver: zodResolver(acceptInvitationFormSchema),
    defaultValues: { name: defaultName, email: defaultEmail },
  });

  async function onSubmit(data: AcceptInvitationFormInput) {
    setFormError(null);
    const result = await acceptInvitation({ token, ...data });
    if (!result.success) {
      applyFormActionErrors(setError, result);
      setFormError(result.formError ?? null);
      return;
    }
    setSentTo(result.data.email);
  }

  async function handleResend() {
    if (sentTo) {
      await authClient.signIn.magicLink({
        email: sentTo,
        callbackURL: '/portal',
        errorCallbackURL: '/aanmelden',
      });
    }
  }

  if (sentTo) {
    return (
      <PortalMailboxCheck
        email={sentTo}
        onResend={handleResend}
        onUseDifferentEmail={() => setSentTo(null)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div>
        <p className="text-overline text-muted-foreground">Uitnodiging van Studio</p>
        <p className="font-display text-h2 mt-1">Welkom in het portaal van {clientName}</p>
        <p className="text-body text-muted-foreground mt-2">
          U bent uitgenodigd voor het projectportaal. Daar volgt u uw website-project: u ziet de
          planning, meldt problemen en vindt uw documenten terug.
        </p>
      </div>

      <fieldset disabled={formState.isSubmitting} className="flex flex-col gap-5">
        <div className="bg-muted flex flex-col gap-4 rounded-lg p-4">
          <p className="text-small font-semibold">Kloppen uw gegevens?</p>
          <TextField control={control} name="name" label="Uw naam" required />
          <TextField
            control={control}
            name="email"
            label="Uw e-mailadres"
            type="email"
            hint="Op dit adres ontvangt u uw aanmeldlink en de meldingen over uw project."
            required
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <p className="text-small font-semibold">Zo werkt aanmelden</p>
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-start gap-2.5">
              <span className="bg-muted text-small flex size-5 shrink-0 items-center justify-center rounded-full font-semibold">
                {index + 1}
              </span>
              <p className="text-small text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>

        {formError && <p className="text-small text-destructive">{formError}</p>}

        <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {formState.isSubmitting ? 'Bezig...' : 'Doorgaan'}
        </Button>

        <p className="text-small text-muted-foreground text-center">
          Klopt er iets niet? Antwoord op de uitnodigingsmail, dan passen we het aan.
        </p>
      </fieldset>
    </form>
  );
}
