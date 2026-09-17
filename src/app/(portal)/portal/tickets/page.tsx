import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';

export default function PortalTicketsPage() {
  return (
    <>
      <PageHeader title="Mijn meldingen" />
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          title="Pagina-inhoud"
          description="Het melden van een bug en het overzicht van uw meldingen komen in een latere sessie."
        />
      </div>
    </>
  );
}
