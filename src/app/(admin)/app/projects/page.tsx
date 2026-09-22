import { Plus } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { listProjects } from '@/features/projects/queries';
import { ProjectsTable } from './ProjectsTable';

export default async function ProjectsPage() {
  const projects = await listProjects(await headers());

  return (
    <>
      <PageHeader
        title="Projecten"
        primaryAction={
          <Button asChild>
            <Link href="/app/projects/new">
              <Plus strokeWidth={1.75} />
              Nieuw project
            </Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
        {projects.length === 0 ? (
          <EmptyState
            variant="invite"
            title="Nog geen projecten"
            description="Maak uw eerste project aan om taken, tickets en documenten te kunnen koppelen."
            action={
              <Button asChild>
                <Link href="/app/projects/new">
                  <Plus strokeWidth={1.75} />
                  Nieuw project
                </Link>
              </Button>
            }
          />
        ) : (
          <ProjectsTable projects={projects} />
        )}
      </div>
    </>
  );
}
