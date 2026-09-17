import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';

export default function BoardPage() {
  return (
    <>
      <PageHeader title="Takenbord" />
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          title="Pagina-inhoud"
          description="De takenlijst en het kanbanbord komen in een latere sessie."
        />
      </div>
    </>
  );
}
