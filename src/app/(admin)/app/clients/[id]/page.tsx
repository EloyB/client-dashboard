import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataList, type DataListItem } from '@/components/shared/DataList';
import { DetailHeader } from '@/components/shared/DetailHeader';
import { InitialsAvatar } from '@/components/shared/InitialsAvatar';
import { ListRow } from '@/components/shared/ListRow';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { getClientById } from '@/features/clients/queries';
import { AccessError } from '@/lib/access';
import { initialsFromName } from '@/lib/utils';

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return 'Geen einddatum';
  return format(new Date(dueDate), 'd MMMM yyyy', { locale: nl });
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { client, projects, users } = detail;

  const companyDetails: DataListItem[] = [
    { label: 'Naam', value: client.name },
    { label: 'Btw-nummer', value: client.vatNumber ?? '—' },
    { label: 'E-mail', value: client.email },
    { label: 'Telefoon', value: client.phone ?? '—' },
    { label: 'Adres', value: client.address ?? '—' },
  ];

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Klanten', href: '/app/clients' }, { label: client.name }]}
        title={client.name}
      />
      <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
        <p className="text-body text-muted-foreground">
          Klant sinds {format(client.createdAt, 'MMMM yyyy', { locale: nl })}
        </p>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Card>
              <CardHeader className="border-border-subtle border-b">
                <CardTitle>Projecten</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col">
                {projects.length === 0 ? (
                  <p className="text-body text-muted-foreground">
                    Nog geen projecten voor deze klant.
                  </p>
                ) : (
                  projects.map((project) => (
                    <Link key={project.id} href="/app/projects" className="block">
                      <ListRow
                        title={project.name}
                        subtitle={formatDueDate(project.dueDate)}
                        trailing={<StatusBadge domain="project" status={project.status} />}
                        className="border-border-subtle border-b py-3 last:border-0"
                      />
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-border-subtle border-b">
                <CardTitle>Gebruikers</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col">
                {users.length === 0 ? (
                  <p className="text-body text-muted-foreground">
                    Nog geen gebruikers voor deze klant.
                  </p>
                ) : (
                  <>
                    {users.map((clientUser) => (
                      <ListRow
                        key={clientUser.id}
                        leading={
                          <InitialsAvatar
                            initials={initialsFromName(clientUser.name)}
                            shape="circle"
                            className="bg-neutral-200 text-neutral-800"
                          />
                        }
                        title={clientUser.name}
                        subtitle={clientUser.email}
                        trailing={
                          <StatusBadge domain="user" emailVerified={clientUser.emailVerified} />
                        }
                        className="border-border-subtle border-b py-3 last:border-0"
                      />
                    ))}
                    <p className="text-small text-muted-foreground pt-3">
                      Gebruikers zien enkel de projecten, tickets, agenda-items en gedeelde
                      documenten van deze klant. Interne taken blijven verborgen.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader className="border-border-subtle border-b">
                <CardTitle>Bedrijfsgegevens</CardTitle>
              </CardHeader>
              <CardContent>
                <DataList items={companyDetails} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-border-subtle border-b">
                <CardTitle>Notities</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="text-body">{client.notes ?? 'Nog geen notities.'}</p>
                <p className="text-small text-muted-foreground">Alleen intern zichtbaar.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
