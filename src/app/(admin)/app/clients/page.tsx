import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';

export default function ClientsPage() {
  return (
    <>
      <PageHeader title="Klanten" />
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          title="Pagina-inhoud"
          description="De klantenlijst en klantdetails komen in een latere sessie."
        />
      </div>
    </>
  );
}
