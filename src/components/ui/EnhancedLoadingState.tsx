import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface EnhancedLoadingStateProps {
  type?: 'card' | 'list' | 'table' | 'dashboard' | 'content';
  count?: number;
}

export const EnhancedLoadingState: React.FC<EnhancedLoadingStateProps> = ({
  type = 'card',
  count = 3,
}) => {
  const renderCardSkeleton = () => (
    <div className="rounded-lg border p-6 space-y-3 animate-pulse">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className="space-y-2 animate-pulse">
      <div className="flex items-center gap-3 p-3 rounded-lg border">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="rounded-lg border animate-pulse">
      <div className="border-b p-4">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border-b p-4 last:border-b-0">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderDashboardSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );

  const renderContentSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-48 w-full mt-6" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );

  const renderSkeletons = () => {
    switch (type) {
      case 'card':
        return Array.from({ length: count }).map((_, i) => (
          <div key={i}>{renderCardSkeleton()}</div>
        ));
      case 'list':
        return Array.from({ length: count }).map((_, i) => (
          <div key={i}>{renderListSkeleton()}</div>
        ));
      case 'table':
        return renderTableSkeleton();
      case 'dashboard':
        return renderDashboardSkeleton();
      case 'content':
        return renderContentSkeleton();
      default:
        return Array.from({ length: count }).map((_, i) => (
          <div key={i}>{renderCardSkeleton()}</div>
        ));
    }
  };

  return <div className="space-y-4">{renderSkeletons()}</div>;
};
