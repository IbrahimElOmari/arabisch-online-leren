
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const CourseCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardHeader>
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-32 w-full mb-4" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </CardContent>
  </Card>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="animate-pulse">
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  </div>
);

export const LessonPlayerSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <Skeleton className="h-64 w-full rounded-lg" />
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-10 w-20" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);
