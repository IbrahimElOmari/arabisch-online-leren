
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner = ({ size = 'md', text, className }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
};

export const PageLoader = ({ message = "Laden..." }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <LoadingSpinner size="lg" text={message} />
  </div>
);

export const CardSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <Card className="animate-pulse">
    <CardHeader>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </CardContent>
  </Card>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: columns }, (_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div key={rowIndex} className="grid grid-cols-4 gap-4">
        {Array.from({ length: columns }, (_, colIndex) => (
          <Skeleton key={colIndex} className="h-6 w-full" />
        ))}
      </div>
    ))}
  </div>
);

export const FormSkeleton = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-20 w-full" />
    </div>
    <Skeleton className="h-10 w-32" />
  </div>
);

export const DashboardGridSkeleton = ({ items = 6 }: { items?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: items }, (_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

interface ContentSkeletonProps {
  type: 'card' | 'table' | 'form' | 'grid' | 'list';
  count?: number;
}

export const ContentSkeleton = ({ type, count = 3 }: ContentSkeletonProps) => {
  switch (type) {
    case 'card':
      return <CardSkeleton lines={count} />;
    case 'table':
      return <TableSkeleton rows={count} />;
    case 'form':
      return <FormSkeleton />;
    case 'grid':
      return <DashboardGridSkeleton items={count} />;
    case 'list':
      return (
        <div className="space-y-2">
          {Array.from({ length: count }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    default:
      return <LoadingSpinner />;
  }
};
