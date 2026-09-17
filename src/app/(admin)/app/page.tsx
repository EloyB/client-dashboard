import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          title="Pagina-inhoud"
          description="Het beheerdashboard met nieuwe tickets, agenda en actieve projecten komt in een latere sessie."
        />
      </div>
    </>
  );
}
