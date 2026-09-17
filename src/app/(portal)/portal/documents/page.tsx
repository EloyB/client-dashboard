import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';

export default function PortalDocumentsPage() {
  return (
    <>
      <PageHeader title="Documenten" />
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          title="Pagina-inhoud"
          description="De documenten die met u gedeeld zijn, komen in een latere sessie."
        />
      </div>
    </>
  );
}
