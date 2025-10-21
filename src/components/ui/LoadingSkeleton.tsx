import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-28 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const ListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-5 w-1/2" />
    <Skeleton className="h-24 w-full" />
  </div>
);

export default DashboardSkeleton;
