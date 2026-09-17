import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';

export default function AdminDocumentsPage() {
  return (
    <>
      <PageHeader title="Documenten" />
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          title="Pagina-inhoud"
          description="Het documentenoverzicht komt in een latere sessie."
        />
      </div>
    </>
  );
}
