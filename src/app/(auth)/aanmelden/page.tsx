import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { AuthCard } from '@/components/shared/AuthCard';
import { getCurrentUser } from '@/lib/access';
import { AanmeldenForm } from './AanmeldenForm';

export default async function AanmeldenPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const currentUser = await getCurrentUser(await headers());
  if (currentUser) {
    redirect(currentUser.role === 'admin' ? '/app' : '/portal');
  }

  const { error } = await searchParams;

  return (
    <AuthCard variant="portal">
      <AanmeldenForm initialError={error ?? null} />
    </AuthCard>
  );
}
