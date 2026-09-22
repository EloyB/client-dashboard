import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getClientById } from '@/features/clients/queries';
import { AccessError } from '@/lib/access';
import { ClientForm } from '../../ClientForm';

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let detail;
  try {
    detail = await getClientById(await headers(), id);
  } catch (error) {
    if (error instanceof AccessError && error.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  const { client } = detail;

  return (
    <ClientForm
      clientId={client.id}
      clientName={client.name}
      defaultValues={{
        name: client.name,
        email: client.email,
        vatNumber: client.vatNumber ?? '',
        phone: client.phone ?? '',
        address: client.address ?? '',
        notes: client.notes ?? '',
      }}
    />
  );
}
