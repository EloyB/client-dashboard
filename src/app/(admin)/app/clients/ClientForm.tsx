'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DetailHeader } from '@/components/shared/DetailHeader';
import { TextField, TextareaField } from '@/components/shared/FormFields';
import { showSuccessToast } from '@/components/shared/toast';
import { createClient, updateClient } from '@/features/clients/actions';
import { clientFormSchema } from '@/features/clients/schemas';
import { applyFormActionErrors } from '@/lib/form-action';

type ClientFormInput = z.input<typeof clientFormSchema>;

const FORM_ID = 'client-form';

export function ClientForm({
  clientId,
  clientName,
  defaultValues,
}: {
  /** Present only when editing an existing client. */
  clientId?: string;
  clientName?: string;
  defaultValues: ClientFormInput;
}) {
  const router = useRouter();
  const isEditing = Boolean(clientId);

  const { control, handleSubmit, formState, setError } = useForm<ClientFormInput>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
  });

  async function onSubmit(data: ClientFormInput) {
    const result = clientId ? await updateClient({ ...data, clientId }) : await createClient(data);

    if (!result.success) {
      applyFormActionErrors(setError, result);
      return;
    }

    showSuccessToast(isEditing ? 'Klant bijgewerkt' : 'Klant aangemaakt');
    router.push(`/app/clients/${result.data.clientId}`);
    router.refresh();
  }

  return (
    <>
      <DetailHeader
        breadcrumbs={[
          { label: 'Klanten', href: '/app/clients' },
          { label: isEditing ? (clientName ?? 'Klant bewerken') : 'Nieuwe klant' },
        ]}
        title={isEditing ? 'Klant bewerken' : 'Nieuwe klant'}
        secondaryAction={
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            <X strokeWidth={1.75} />
            Annuleren
          </Button>
        }
        primaryAction={
          <Button type="submit" form={FORM_ID} disabled={formState.isSubmitting}>
            {formState.isSubmitting ? (
              <Loader2 className="animate-spin" strokeWidth={1.75} />
            ) : (
              <Save strokeWidth={1.75} />
            )}
            {isEditing ? 'Wijzigingen opslaan' : 'Klant opslaan'}
          </Button>
        }
      />

      <form
        id={FORM_ID}
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8"
        noValidate
      >
        <fieldset disabled={formState.isSubmitting} className="flex flex-col gap-4">
          <Card>
            <CardHeader className="border-border-subtle border-b">
              <CardTitle>Bedrijf</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <TextField control={control} name="name" label="Bedrijfsnaam" required />
              </div>
              <TextField
                control={control}
                name="email"
                label="Algemeen e-mailadres"
                type="email"
                required
              />
              <TextField control={control} name="phone" label="Telefoon" />
              <TextField
                control={control}
                name="vatNumber"
                label="Btw-nummer"
                placeholder="BE 0652.874.109"
              />
              <TextField control={control} name="address" label="Adres" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-border-subtle border-b">
              <CardTitle>Notities</CardTitle>
            </CardHeader>
            <CardContent>
              <TextareaField
                control={control}
                name="notes"
                label="Notities"
                hint="Enkel zichtbaar voor het team, nooit voor de klant."
              />
            </CardContent>
          </Card>
        </fieldset>
      </form>
    </>
  );
}
