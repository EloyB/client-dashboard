import { headers } from 'next/headers';

import { listSelectableClients } from '@/features/projects/queries';
import { ProjectForm } from '../ProjectForm';

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const clients = await listSelectableClients(await headers());

  return (
    <ProjectForm
      clients={clients}
      defaultValues={{
        clientId: clientId ?? '',
        name: '',
        description: '',
        websiteUrl: '',
        status: 'planned',
        startDate: undefined,
        dueDate: undefined,
      }}
    />
  );
}
