import { QueryClient } from '@tanstack/react-query';

/**
 * Performance optimization utilities for the application
 */

// Optimized query client with intelligent caching
export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Longer stale time for static data
        staleTime: 1000 * 60 * 5, // 5 minutes
        // Shorter garbage collection for dynamic data
        gcTime: 1000 * 60 * 10, // 10 minutes
        // Intelligent retry logic
        retry: (failureCount, error: any) => {
          // Don't retry auth errors or RLS violations
          if (error?.code === 'PGRST116' || error?.status === 401) return false;
          // Don't retry rate limit errors
          if (error?.status === 429) return false;
          // Max 2 retries for other errors
          return failureCount < 2;
        },
        // Smart refetch behavior
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
        // Network timeout for mutations
        networkMode: 'online',
      },
    },
  });
};

// Image optimization utilities
export const optimizeImageSrc = (src: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
} = {}) => {
  const { width, height, quality = 80, format = 'webp' } = options;
  
  // If it's a Supabase storage URL, add transformation parameters
  if (src.includes('supabase.co/storage')) {
    const url = new URL(src);
    if (width) url.searchParams.set('width', width.toString());
    if (height) url.searchParams.set('height', height.toString());
    if (quality) url.searchParams.set('quality', quality.toString());
    if (format !== 'auto') url.searchParams.set('format', format);
    return url.toString();
  }
  
  return src;
};

// Debounce utility for search and input
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle utility for scroll and resize events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Virtual scrolling intersection observer
export const createVirtualScrollObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '100px',
    threshold: 0.1,
    ...options,
  };
  
  return new IntersectionObserver(callback, defaultOptions);
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100),
    };
  }
  return null;
};

// Bundle size analyzer
export const analyzeBundleSize = () => {
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  return {
    scriptCount: scripts.length,
    styleCount: styles.length,
    totalResources: scripts.length + styles.length,
  };
};

// Performance metrics collector
export const collectPerformanceMetrics = () => {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');
  
  const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
  const lcp = paint.find(entry => entry.name === 'largest-contentful-paint')?.startTime || 0;
  
  return {
    // Core Web Vitals
    FCP: Math.round(fcp),
    LCP: Math.round(lcp),
    TTI: Math.round(navigation.loadEventEnd - navigation.fetchStart),
    
    // Network timing
    DNS: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
    TCP: Math.round(navigation.connectEnd - navigation.connectStart),
    Request: Math.round(navigation.responseStart - navigation.requestStart),
    Response: Math.round(navigation.responseEnd - navigation.responseStart),
    Processing: Math.round(navigation.domComplete - navigation.responseEnd),
    
    // Memory usage
    memory: monitorMemoryUsage(),
    
    // Bundle analysis
    bundle: analyzeBundleSize(),
  };
};

// Export performance data to analytics
export const reportPerformanceMetrics = async (metrics: ReturnType<typeof collectPerformanceMetrics>) => {
  try {
    // Could be sent to analytics service
    console.info('Performance Metrics:', metrics);
    
    // Store in localStorage for debugging
    localStorage.setItem('performance-metrics', JSON.stringify({
      ...metrics,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    }));
  } catch (error) {
    console.warn('Failed to report performance metrics:', error);
  }
};