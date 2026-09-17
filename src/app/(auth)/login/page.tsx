import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { getCurrentUser } from '@/lib/access';
import { LoginForm } from './LoginForm';

export default async function LoginPage() {
  const currentUser = await getCurrentUser(await headers());
  if (currentUser) {
    redirect(currentUser.role === 'admin' ? '/app' : '/portal');
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-2">
        <div className="bg-primary text-primary-foreground text-small flex size-7 items-center justify-center rounded-md font-semibold">
          S
        </div>
        <span className="font-display font-semibold">Studio</span>
      </div>

      <div className="border-border bg-card shadow-card w-full max-w-md rounded-xl border px-6 py-8">
        <p className="font-display text-h2">Aanmelden</p>
        <p className="text-body text-muted-foreground mt-1 mb-6">Meld u aan met uw werkadres.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>

      <div className="text-small text-muted-foreground flex w-full max-w-md items-center justify-between">
        <span>Studio · projectbeheer</span>
        <span>Hulp nodig?</span>
      </div>
    </div>
  );
}
