import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';

// Enhanced Skeleton Components with consistent styling

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'text' | 'circle' | 'rectangle';
  animate?: boolean;
}

export const EnhancedSkeleton = ({ 
  className, 
  variant = 'default',
  animate = true,
  ...props 
}: SkeletonProps & React.HTMLAttributes<HTMLDivElement>) => {
  const { isRTL } = useRTLLayout();
  
  const variantClasses = {
    default: 'rounded-md h-4',
    text: 'rounded h-4',
    circle: 'rounded-full aspect-square',
    rectangle: 'rounded-lg'
  };
  
  return (
    <div
      className={cn(
        'bg-muted',
        animate && 'animate-pulse',
        variantClasses[variant],
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      {...props}
    />
  );
};

// Card Skeleton for dashboard cards, class cards, etc.
export const CardSkeleton = ({ count = 1, className }: { count?: number; className?: string }) => {
  return (
    <div className={cn('space-y-4', className)}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="border rounded-lg p-6 space-y-3 bg-card">
          <div className="flex items-center space-x-3">
            <EnhancedSkeleton variant="circle" className="h-10 w-10" />
            <div className="space-y-2 flex-1">
              <EnhancedSkeleton className="h-5 w-3/4" />
              <EnhancedSkeleton className="h-4 w-1/2" />
            </div>
          </div>
          <EnhancedSkeleton className="h-4 w-full" />
          <EnhancedSkeleton className="h-4 w-2/3" />
          <div className="flex space-x-2 pt-2">
            <EnhancedSkeleton className="h-8 w-20" />
            <EnhancedSkeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
};

// List Skeleton for forum posts, notifications, etc.
export const ListSkeleton = ({ count = 5, className }: { count?: number; className?: string }) => {
  return (
    <div className={cn('space-y-3', className)}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border bg-card">
          <EnhancedSkeleton variant="circle" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <EnhancedSkeleton className="h-4 w-3/4" />
            <EnhancedSkeleton className="h-3 w-1/2" />
          </div>
          <EnhancedSkeleton className="h-6 w-6" />
        </div>
      ))}
    </div>
  );
};

// Table Skeleton for data tables
export const TableSkeleton = ({ 
  rows = 5, 
  columns = 4,
  className 
}: { 
  rows?: number; 
  columns?: number;
  className?: string; 
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex space-x-4 p-4 border rounded-lg bg-muted/50">
        {[...Array(columns)].map((_, i) => (
          <EnhancedSkeleton key={i} className="h-4 w-24" />
        ))}
      </div>
      
      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex space-x-4 p-4 border rounded-lg bg-card">
          {[...Array(columns)].map((_, j) => (
            <EnhancedSkeleton 
              key={j} 
              className={cn(
                'h-4',
                j === 0 ? 'w-32' : j === 1 ? 'w-24' : 'w-16'
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Dashboard specific skeleton
export const DashboardSkeleton = ({ className }: { className?: string }) => {
  const { isRTL } = useRTLLayout();
  
  return (
    <div className={cn('min-h-screen bg-background p-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <EnhancedSkeleton className="h-8 w-48" />
          <EnhancedSkeleton className="h-4 w-64" />
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 space-y-3 bg-card">
              <div className="flex items-center space-x-2">
                <EnhancedSkeleton variant="circle" className="h-8 w-8" />
                <EnhancedSkeleton className="h-6 w-24" />
              </div>
              <EnhancedSkeleton className="h-8 w-16" />
              <EnhancedSkeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <EnhancedSkeleton className="h-6 w-32" />
            <CardSkeleton count={3} />
          </div>
          <div className="space-y-4">
            <EnhancedSkeleton className="h-6 w-32" />
            <ListSkeleton count={4} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Chat/Forum skeleton
export const ChatSkeleton = ({ count = 8, className }: { count?: number; className?: string }) => {
  const { isRTL } = useRTLLayout();
  
  return (
    <div className={cn('space-y-4 p-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {[...Array(count)].map((_, i) => (
        <div 
          key={i} 
          className={cn(
            'flex space-x-3',
            i % 3 === 0 && 'flex-row-reverse space-x-reverse' // Simulate own messages
          )}
        >
          <EnhancedSkeleton variant="circle" className="h-8 w-8 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <EnhancedSkeleton className="h-3 w-16" />
              <EnhancedSkeleton className="h-3 w-12" />
            </div>
            <EnhancedSkeleton 
              className={cn(
                'h-4',
                i % 2 === 0 ? 'w-3/4' : 'w-full'
              )} 
            />
            {Math.random() > 0.5 && (
              <EnhancedSkeleton className="h-4 w-1/2" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Analytics/Charts skeleton
export const ChartSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <EnhancedSkeleton className="h-6 w-32" />
        <EnhancedSkeleton className="h-8 w-24" />
      </div>
      
      {/* Chart area */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="space-y-4">
          {/* Chart bars/lines simulation */}
          <div className="flex items-end space-x-2 h-40">
            {[...Array(12)].map((_, i) => (
              <EnhancedSkeleton 
                key={i} 
                className={cn(
                  'flex-1 rounded-t',
                  `h-${Math.floor(Math.random() * 32) + 8}`
                )} 
                style={{
                  height: `${Math.random() * 80 + 20}%`
                }}
              />
            ))}
          </div>
          
          {/* X-axis labels */}
          <div className="flex justify-between">
            {[...Array(6)].map((_, i) => (
              <EnhancedSkeleton key={i} className="h-3 w-8" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Form skeleton
export const FormSkeleton = ({ fields = 4, className }: { fields?: number; className?: string }) => {
  return (
    <div className={cn('space-y-6', className)}>
      {[...Array(fields)].map((_, i) => (
        <div key={i} className="space-y-2">
          <EnhancedSkeleton className="h-4 w-24" />
          <EnhancedSkeleton className="h-10 w-full" />
        </div>
      ))}
      
      <div className="flex space-x-4 pt-4">
        <EnhancedSkeleton className="h-10 w-24" />
        <EnhancedSkeleton className="h-10 w-20" />
      </div>
    </div>
  );
};

// Enhanced Loading Spinner with better states
interface EnhancedLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  variant?: 'default' | 'overlay' | 'inline';
}

export const EnhancedLoadingSpinner = ({ 
  size = 'md', 
  text,
  className,
  variant = 'default'
}: EnhancedLoadingSpinnerProps) => {
  const { isRTL } = useRTLLayout();
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg', 
    xl: 'text-xl'
  };

  const variantClasses = {
    default: 'flex flex-col items-center justify-center',
    overlay: 'absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50',
    inline: 'inline-flex items-center gap-2'
  };
  
  return (
    <div 
      className={cn(variantClasses[variant], className)} 
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary")} />
      
      {text && (
        <span className={cn(
          textSizeClasses[size], 
          "text-muted-foreground animate-fade-in",
          variant === 'inline' ? 'ms-2' : 'mt-2',
          isRTL && 'arabic-text'
        )}>
          {text}
        </span>
      )}
    </div>
  );
};

// Full page loader
export const FullPageLoader = ({ 
  text = "Laden...",
  className
}: {
  text?: string;
  className?: string;
}) => {
  return (
    <div className={cn("min-h-screen flex items-center justify-center bg-background", className)}>
      <EnhancedLoadingSpinner size="xl" text={text} />
    </div>
  );
};

export default {
  EnhancedSkeleton,
  CardSkeleton,
  ListSkeleton,
  TableSkeleton,
  DashboardSkeleton,
  ChatSkeleton,
  ChartSkeleton,
  FormSkeleton,
  EnhancedLoadingSpinner,
  FullPageLoader,
};