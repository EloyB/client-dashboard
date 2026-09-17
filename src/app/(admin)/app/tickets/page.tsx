import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';

export default function AdminTicketsPage() {
  return (
    <>
      <PageHeader title="Tickets" />
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          title="Pagina-inhoud"
          description="Het ticketoverzicht en de statuswissel komen in een latere sessie."
        />
      </div>
    </>
  );
}
