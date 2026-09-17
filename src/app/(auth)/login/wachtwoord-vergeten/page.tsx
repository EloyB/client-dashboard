import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { AuthCard } from '@/components/shared/AuthCard';
import { getCurrentUser } from '@/lib/access';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export default async function ForgotPasswordPage() {
  const currentUser = await getCurrentUser(await headers());
  if (currentUser) {
    redirect(currentUser.role === 'admin' ? '/app' : '/portal');
  }

  return (
    <AuthCard variant="admin">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
