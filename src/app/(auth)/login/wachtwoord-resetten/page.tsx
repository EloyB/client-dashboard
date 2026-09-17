import { AuthCard } from '@/components/shared/AuthCard';
import { ResetPasswordForm } from './ResetPasswordForm';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return (
    <AuthCard variant="admin">
      <ResetPasswordForm token={token ?? null} initialError={error ?? null} />
    </AuthCard>
  );
}
