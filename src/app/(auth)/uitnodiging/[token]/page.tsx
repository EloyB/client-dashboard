import { AuthCard } from '@/components/shared/AuthCard';
import { AuthNoticeIconStandalone } from '@/components/shared/AuthNotice';
import { getInvitationByToken } from '@/features/clients/queries';
import { AcceptInvitationForm } from './AcceptInvitationForm';

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return (
      <AuthCard variant="portal">
        <div className="flex flex-col gap-4">
          <AuthNoticeIconStandalone variant="warning" />
          <div>
            <p className="font-display text-h2">Deze uitnodiging is niet meer geldig</p>
            <p className="text-body text-muted-foreground mt-1">
              Vraag uw contactpersoon bij Studio om u opnieuw uit te nodigen, of bel 09 225 44 18.
            </p>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard variant="portal">
      <AcceptInvitationForm
        token={token}
        clientName={invitation.clientName}
        defaultName={invitation.name}
        defaultEmail={invitation.email}
      />
    </AuthCard>
  );
}
