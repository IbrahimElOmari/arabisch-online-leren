import { useEffect, Suspense, useState } from 'react';
import { withErrorBoundary } from '@/components/ui/enhanced-error-boundary';
import { Skeleton } from '@/components/ui/skeleton';

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<{
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
  }>({});

  useEffect(() => {
    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
            }
            break;
          case 'largest-contentful-paint':
            setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
            break;
          case 'first-input':
            setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }));
            break;
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              setMetrics(prev => ({ ...prev, cls: (prev.cls || 0) + (entry as any).value }));
            }
            break;
        }
      }
    });

    observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });

    return () => observer.disconnect();
  }, []);

  return metrics;
};

// Lazy loading wrapper with error boundary
interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LazyWrapper: React.FC<LazyComponentProps> = ({ 
  children, 
  fallback = <Skeleton className="h-32 w-full" /> 
}) => {
  const ErrorWrappedSuspense = withErrorBoundary(
    ({ children }: { children: React.ReactNode }) => (
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    )
  );

  return <ErrorWrappedSuspense>{children}</ErrorWrappedSuspense>;
};

// Image optimization wrapper
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  loading?: 'lazy' | 'eager';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  loading = 'lazy',
  className,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Preload critical images
    if (loading === 'eager') {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.onerror = () => setHasError(true);
      img.src = src;
    } else {
      setImageSrc(src);
    }
  }, [src, loading]);

  if (hasError) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground text-sm">Image failed to load</span>
      </div>
    );
  }

  return (
    <>
      {!isLoaded && loading === 'eager' && (
        <Skeleton className={className} />
      )}
      <img
        src={imageSrc}
        alt={alt}
        loading={loading}
        className={className}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        style={{ display: isLoaded || loading === 'lazy' ? 'block' : 'none' }}
        {...props}
      />
    </>
  );
};

// Bundle analyzer (for development)
export const logBundleInfo = () => {
  if (process.env.NODE_ENV === 'development') {
    const scripts = document.querySelectorAll('script[src]');
    const styles = document.querySelectorAll('link[rel="stylesheet"]');
    
    console.group('📦 Bundle Analysis');
    console.log(`Scripts loaded: ${scripts.length}`);
    console.log(`Stylesheets loaded: ${styles.length}`);
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      console.log(`Network: ${connection.effectiveType}, ${connection.downlink}Mbps`);
    }
    
    // Check for memory info (Chrome only)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log(`Memory: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB used`);
    }
    console.groupEnd();
  }
};