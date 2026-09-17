import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Row-level loading state for a list/table, before real rows are known. */
export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <Card className="overflow-hidden py-0">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="border-border-subtle flex items-center justify-between gap-4 border-b p-4 last:border-0"
        >
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="bg-skeleton-soft h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </Card>
  );
}
