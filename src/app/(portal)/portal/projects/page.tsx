import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';

export default function PortalProjectsPage() {
  return (
    <>
      <PageHeader title="Mijn projecten" />
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          title="Pagina-inhoud"
          description="Het overzicht van uw projecten komt in een latere sessie."
        />
      </div>
    </>
  );
}
