import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Lazy loading wrapper with error boundary and loading state
export const withLazyLoading = <P extends object>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = React.lazy(importFunc);
  
  return React.forwardRef<any, P>((props, ref) => (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));
};

// Memoized components for heavy UI elements
export const MemoizedTaskList = React.memo(({ tasks, onTaskClick }: {
  tasks: any[];
  onTaskClick: (taskId: string) => void;
}) => {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div 
          key={task.id} 
          className="p-3 border rounded cursor-pointer hover:bg-accent"
          onClick={() => onTaskClick(task.id)}
        >
          {task.title}
        </div>
      ))}
    </div>
  );
});

MemoizedTaskList.displayName = 'MemoizedTaskList';

export const MemoizedClassList = React.memo(({ classes, selectedClass, onClassSelect }: {
  classes: any[];
  selectedClass: string | null;
  onClassSelect: (classId: string) => void;
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {classes.map((cls) => (
        <div
          key={cls.id}
          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
            selectedClass === cls.id ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
          }`}
          onClick={() => onClassSelect(cls.id)}
        >
          <h3 className="font-medium">{cls.name}</h3>
          {cls.description && (
            <p className="text-sm text-muted-foreground mt-1">{cls.description}</p>
          )}
        </div>
      ))}
    </div>
  );
});

MemoizedClassList.displayName = 'MemoizedClassList';