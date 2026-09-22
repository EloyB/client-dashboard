'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, RefreshCw, Send, UserPlus, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TextField } from '@/components/shared/FormFields';
import { FormSheet } from '@/components/shared/FormSheet';
import { InitialsAvatar } from '@/components/shared/InitialsAvatar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { showErrorToast, showSuccessToast } from '@/components/shared/toast';
import {
  inviteClientUser,
  resendInvitation,
  revokeClientUserAccess,
} from '@/features/clients/actions';
import { inviteClientUserSchema } from '@/features/clients/schemas';
import type { ClientUserRow } from '@/features/clients/queries';
import { applyFormActionErrors } from '@/lib/form-action';
import { initialsFromName } from '@/lib/utils';

type InviteFormInput = { name: string; email: string };

export function ClientUsersSection({
  clientId,
  clientName,
  users,
}: {
  clientId: string;
  clientName: string;
  users: ClientUserRow[];
}) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ClientUserRow | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const inviteForm = useForm<InviteFormInput>({
    resolver: zodResolver(inviteClientUserSchema.omit({ clientId: true })),
    defaultValues: { name: '', email: '' },
  });

  async function handleInvite(data: InviteFormInput) {
    const result = await inviteClientUser({ ...data, clientId });
    if (!result.success) {
      applyFormActionErrors(inviteForm.setError, result);
      if (result.formError) {
        showErrorToast('Uitnodigen mislukt', result.formError);
      }
      return;
    }

    showSuccessToast('Uitnodiging verstuurd', `${data.name} kreeg een e-mail met een aanmeldlink.`);
    setInviteOpen(false);
    inviteForm.reset();
    router.refresh();
  }

  async function handleResend(userId: string) {
    setResendingId(userId);
    try {
      await resendInvitation(clientId, userId);
      showSuccessToast('Uitnodiging opnieuw verstuurd');
    } catch (error) {
      showErrorToast(
        'Opnieuw versturen mislukt',
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setResendingId(null);
    }
  }

  async function handleRevokeConfirm() {
    if (!revokeTarget) return;
    setIsRevoking(true);
    try {
      await revokeClientUserAccess(clientId, revokeTarget.id);
      showSuccessToast('Toegang ingetrokken', `${revokeTarget.name} kan niet meer aanmelden.`);
      setRevokeTarget(null);
      router.refresh();
    } catch (error) {
      showErrorToast('Intrekken mislukt', error instanceof Error ? error.message : undefined);
    } finally {
      setIsRevoking(false);
    }
  }

  return (
    <Card>
      <CardHeader className="border-border-subtle border-b">
        <CardTitle>Gebruikers</CardTitle>
        <CardDescription>Wie van deze klant toegang heeft tot het portaal.</CardDescription>
        <CardAction>
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus strokeWidth={1.75} />
            Gebruiker uitnodigen
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col">
        {users.length === 0 ? (
          <p className="text-body text-muted-foreground">Nog geen gebruikers voor deze klant.</p>
        ) : (
          <>
            {users.map((clientUser) => (
              <div
                key={clientUser.id}
                className="border-border-subtle flex flex-col gap-3 border-b py-3 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <InitialsAvatar
                    initials={initialsFromName(clientUser.name)}
                    shape="circle"
                    className="bg-neutral-200 text-neutral-800"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{clientUser.name}</p>
                    <p className="text-small text-muted-foreground truncate">{clientUser.email}</p>
                  </div>
                  <StatusBadge domain="user" emailVerified={clientUser.emailVerified} />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  {!clientUser.emailVerified && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={resendingId === clientUser.id}
                      onClick={() => handleResend(clientUser.id)}
                    >
                      {resendingId === clientUser.id ? (
                        <Loader2 className="animate-spin" strokeWidth={1.75} />
                      ) : (
                        <RefreshCw strokeWidth={1.75} />
                      )}
                      {resendingId === clientUser.id ? 'Bezig...' : 'Opnieuw uitnodigen'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive-border hover:bg-destructive-muted w-full sm:w-auto"
                    onClick={() => setRevokeTarget(clientUser)}
                  >
                    <UserX strokeWidth={1.75} />
                    Toegang intrekken
                  </Button>
                </div>
              </div>
            ))}
            <p className="text-small text-muted-foreground pt-3">
              Gebruikers zien enkel de projecten, tickets, agenda-items en gedeelde documenten van
              deze klant. Interne taken blijven verborgen.
            </p>
          </>
        )}
      </CardContent>

      <FormSheet
        open={inviteOpen}
        onOpenChange={(open) => {
          setInviteOpen(open);
          if (!open) inviteForm.reset();
        }}
        title="Gebruiker uitnodigen"
        description={clientName}
        primaryAction={
          <Button
            className="w-full sm:w-auto"
            disabled={inviteForm.formState.isSubmitting}
            onClick={inviteForm.handleSubmit(handleInvite)}
          >
            {inviteForm.formState.isSubmitting ? (
              <Loader2 className="animate-spin" strokeWidth={1.75} />
            ) : (
              <Send strokeWidth={1.75} />
            )}
            {inviteForm.formState.isSubmitting ? 'Bezig...' : 'Uitnodiging versturen'}
          </Button>
        }
      >
        <p className="text-body text-muted-foreground">
          De gebruiker krijgt een e-mail met een uitnodiging. Een wachtwoord is niet nodig:
          aanmelden gebeurt met een link.
        </p>
        <TextField control={inviteForm.control} name="name" label="Naam" required />
        <TextField
          control={inviteForm.control}
          name="email"
          label="E-mailadres"
          type="email"
          hint="Gebruik bij voorkeur een adres op het domein van de klant."
          required
        />
      </FormSheet>

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Toegang intrekken?"
        description={`${revokeTarget?.name ?? 'Deze gebruiker'} kan daarna niet meer aanmelden bij het portaal.`}
        confirmLabel={isRevoking ? 'Bezig...' : 'Toegang intrekken'}
        confirmIcon={UserX}
        variant="destructive"
        onConfirm={handleRevokeConfirm}
      />
    </Card>
  );
}
