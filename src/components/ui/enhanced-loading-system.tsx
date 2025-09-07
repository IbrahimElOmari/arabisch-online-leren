import React from 'react';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useRTLAnimations } from '@/hooks/useRTLAnimations';

// Enhanced Loading Skeleton with RTL support
export const EnhancedSkeleton = ({ 
  className, 
  variant = 'default',
  animate = true,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'text' | 'circle' | 'rectangle';
  animate?: boolean;
}) => {
  const { isRTL } = useRTLLayout();
  const { getLoadingClasses } = useRTLAnimations();
  
  const variantClasses = {
    default: 'rounded-md h-4',
    text: 'rounded h-4',
    circle: 'rounded-full aspect-square',
    rectangle: 'rounded-lg'
  };
  
  return (
    <div
      className={cn(
        "bg-muted animate-pulse",
        variantClasses[variant],
        animate && getLoadingClasses(),
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      {...props}
    />
  );
};

// Card Loading Skeleton
export const CardSkeleton = ({ count = 1 }: { count?: number }) => {
  const { getStaggerDelay } = useRTLAnimations();
  
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div 
          key={i} 
          className="border rounded-lg p-6 space-y-3"
          style={getStaggerDelay(i, 150)}
        >
          <EnhancedSkeleton className="h-6 w-3/4" />
          <EnhancedSkeleton className="h-4 w-full" />
          <EnhancedSkeleton className="h-4 w-2/3" />
          <div className="flex space-x-2">
            <EnhancedSkeleton variant="circle" className="h-8 w-8" />
            <EnhancedSkeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
};

// List Loading Skeleton
export const ListSkeleton = ({ count = 5 }: { count?: number }) => {
  const { getStaggerDelay } = useRTLAnimations();
  
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div 
          key={i}
          className="flex items-center space-x-3 p-3 rounded-lg border"
          style={getStaggerDelay(i, 100)}
        >
          <EnhancedSkeleton variant="circle" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <EnhancedSkeleton className="h-4 w-3/4" />
            <EnhancedSkeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Dashboard Loading Skeleton
export const DashboardSkeleton = () => {
  const { isRTL } = useRTLLayout();
  
  return (
    <div className="min-h-screen bg-background p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <EnhancedSkeleton className="h-8 w-48" />
          <EnhancedSkeleton className="h-4 w-64" />
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 space-y-3">
              <EnhancedSkeleton className="h-6 w-1/2" />
              <EnhancedSkeleton className="h-8 w-3/4" />
            </div>
          ))}
        </div>
        
        {/* Main Content */}
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

// Enhanced Loading Spinner with better UX
interface EnhancedLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  showProgress?: boolean;
  progress?: number;
  status?: 'loading' | 'success' | 'error' | 'offline';
}

export const EnhancedLoadingSpinner = ({ 
  size = 'md', 
  text,
  className,
  showProgress = false,
  progress = 0,
  status = 'loading'
}: EnhancedLoadingSpinnerProps) => {
  const { getFlexDirection, isRTL } = useRTLLayout();
  const { getBounceInClasses, getPulseGlowClasses } = useRTLAnimations();
  
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

  const StatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary")} />;
      case 'success':
        return <div className={cn(sizeClasses[size], "rounded-full bg-green-500 flex items-center justify-center text-white", getBounceInClasses())}>✓</div>;
      case 'error':
        return <div className={cn(sizeClasses[size], "rounded-full bg-red-500 flex items-center justify-center text-white", getBounceInClasses())}>✕</div>;
      case 'offline':
        return <WifiOff className={cn(sizeClasses[size], "text-muted-foreground animate-pulse")} />;
      default:
        return <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary")} />;
    }
  };
  
  return (
    <div className={cn(`${getFlexDirection()} items-center gap-3`, className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <StatusIcon />
      
      {text && (
        <div className="space-y-2">
          <span className={cn(textSizeClasses[size], "text-muted-foreground animate-fade-in")}>
            {text}
          </span>
          
          {showProgress && (
            <div className="w-32 bg-muted rounded-full h-1.5">
              <div 
                className={cn(
                  "bg-primary h-full rounded-full transition-all duration-300",
                  status === 'success' && getPulseGlowClasses()
                )}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Progressive Loading Component
interface ProgressiveLoaderProps {
  steps: Array<{ label: string; completed: boolean }>;
  currentStep?: number;
}

export const ProgressiveLoader = ({ steps, currentStep = 0 }: ProgressiveLoaderProps) => {
  const { isRTL } = useRTLLayout();
  const { getStaggerDelay } = useRTLAnimations();
  
  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {steps.map((step, index) => (
        <div 
          key={index}
          className="flex items-center gap-3"
          style={getStaggerDelay(index, 200)}
        >
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
            step.completed 
              ? "bg-green-500 text-white" 
              : index === currentStep 
                ? "bg-primary text-primary-foreground animate-pulse" 
                : "bg-muted text-muted-foreground"
          )}>
            {step.completed ? '✓' : index + 1}
          </div>
          
          <span className={cn(
            "text-sm transition-colors duration-300",
            step.completed 
              ? "text-green-600 font-medium" 
              : index === currentStep 
                ? "text-foreground font-medium" 
                : "text-muted-foreground"
          )}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// Full Page Enhanced Loader
export const FullPageEnhancedLoader = ({ 
  text = "Loading...", 
  showProgress = false,
  progress = 0,
  steps
}: {
  text?: string;
  showProgress?: boolean; 
  progress?: number;
  steps?: Array<{ label: string; completed: boolean }>;
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-6">
        <EnhancedLoadingSpinner 
          size="xl" 
          text={text} 
          showProgress={showProgress}
          progress={progress}
        />
        
        {steps && (
          <div className="mt-8">
            <ProgressiveLoader steps={steps} />
          </div>
        )}
      </div>
    </div>
  );
};