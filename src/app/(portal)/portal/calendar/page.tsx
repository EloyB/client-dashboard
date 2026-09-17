import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';

export default function PortalCalendarPage() {
  return (
    <>
      <PageHeader title="Agenda" />
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          title="Pagina-inhoud"
          description="De agenda met afspraken en deadlines komt in een latere sessie."
        />
      </div>
    </>
  );
}
