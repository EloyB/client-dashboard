import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';

export default function PortalStartPage() {
  return (
    <>
      <PageHeader title="Start" />
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          title="Pagina-inhoud"
          description="De startpagina met bug melden, projecten, tickets, agenda en documenten komt in een latere sessie."
        />
      </div>
    </>
  );
}
