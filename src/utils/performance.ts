// Performance utilities for production optimization
import React from 'react';

// Debounce function for search and input handlers
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Throttle function for scroll and resize handlers
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Lazy load components with error boundary
export function lazyWithErrorBoundary<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  const LazyComponent = React.lazy(async () => {
    try {
      return await importFunc();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load component:', error);
      }
      // Return a fallback component
      return {
        default: (() => 
          React.createElement('div', {
            className: 'p-4 text-center text-muted-foreground'
          }, 'Component failed to load')
        ) as any,
      };
    }
  });

  return LazyComponent;
}

// Memory usage monitoring in development (simplified)
export function monitorMemoryUsage() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Check if performance.memory is available (Chrome only)
  const perfMemory = (performance as any).memory;
  if (!perfMemory) return;

  const logMemory = () => {
    console.log('Memory Usage:', {
      used: Math.round(perfMemory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(perfMemory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(perfMemory.jsHeapSizeLimit / 1048576) + ' MB'
    });
  };

  // Log every 30 seconds in development
  const interval = setInterval(logMemory, 30000);
  
  return () => clearInterval(interval);
}

// Bundle analyzer - simplified version
export function analyzeBundlePerformance() {
  if (process.env.NODE_ENV !== 'development') return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        const navEntry = entry as PerformanceNavigationTiming;
        console.log('Bundle Performance:', {
          loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
          domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
          totalTime: navEntry.loadEventEnd - navEntry.fetchStart
        });
      }
    }
  });

  observer.observe({ entryTypes: ['navigation'] });
}