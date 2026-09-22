'use client';

import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { DetailHeader } from '@/components/shared/DetailHeader';
import type { Breadcrumb } from '@/components/shared/PageHeader';
import type { ProjectStatus } from '@/db/schema';
import { useArchiveProjectAction } from '../useArchiveProjectAction';

export function ProjectDetailHeader({
  breadcrumbs,
  title,
  badge,
  projectId,
  projectName,
  currentStatus,
}: {
  breadcrumbs: Breadcrumb[];
  title: string;
  badge: ReactNode;
  projectId: string;
  projectName: string;
  currentStatus: ProjectStatus;
}) {
  const router = useRouter();

  const { menuItem, dialog } = useArchiveProjectAction({
    projectId,
    projectName,
    currentStatus,
    onArchived: () => router.refresh(),
  });

  return (
    <>
      <DetailHeader
        breadcrumbs={breadcrumbs}
        title={title}
        badge={badge}
        primaryAction={
          <Button variant="outline" asChild>
            <Link href={`/app/projects/${projectId}/edit`}>
              <Pencil strokeWidth={1.75} />
              Bewerken
            </Link>
          </Button>
        }
        overflowActions={menuItem}
      />
      {dialog}
    </>
  );
}
