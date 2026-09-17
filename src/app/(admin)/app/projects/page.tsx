import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';

export default function ProjectsPage() {
  return (
    <>
      <PageHeader title="Projecten" />
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          title="Pagina-inhoud"
          description="Het projectenoverzicht en projectformulier komen in een latere sessie."
        />
      </div>
    </>
  );
}
