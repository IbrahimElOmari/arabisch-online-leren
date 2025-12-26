import { useEffect, useRef, useState } from 'react';
import { collectPerformanceMetrics, reportPerformanceMetrics } from '@/utils/performanceOptimization';

interface PerformanceMetrics {
  FCP: number;
  LCP: number;
  TTI: number;
  DNS: number;
  TCP: number;
  Request: number;
  Response: number;
  Processing: number;
  memory: any;
  bundle: any;
}

interface PagePerformance {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
}

export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [pagePerformance, setPagePerformance] = useState<PagePerformance | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const mountTimeRef = useRef<number | null>(null);

  useEffect(() => {
    mountTimeRef.current = Date.now();
    
    // Collect metrics after page load
    const collectMetrics = () => {
      try {
        const performanceData = collectPerformanceMetrics();
        setMetrics(performanceData);
        reportPerformanceMetrics(performanceData);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Failed to collect performance metrics:', error);
        }
      }
    };

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      setTimeout(collectMetrics, 100);
    } else {
      window.addEventListener('load', () => {
        setTimeout(collectMetrics, 100);
      });
    }

    // Monitor page performance
    const updatePagePerformance = () => {
      const now = Date.now();
      const loadTime = mountTimeRef.current ? now - mountTimeRef.current : 0;
      const renderTime = now - startTimeRef.current;
      
      setPagePerformance({
        loadTime,
        renderTime,
        interactionTime: 0, // Would be updated on first interaction
      });
    };

    const performanceTimer = setInterval(updatePagePerformance, 1000);

    return () => {
      clearInterval(performanceTimer);
    };
  }, []);

  const trackInteraction = (interactionType: string) => {
    const interactionTime = Date.now() - startTimeRef.current;
    
    setPagePerformance(prev => prev ? {
      ...prev,
      interactionTime,
    } : null);

    // Log interaction for analytics
    if (import.meta.env.DEV) {
      console.debug(`Interaction "${interactionType}" after ${interactionTime}ms`);
    }
  };

  const trackCustomMetric = (name: string, value: number, unit = 'ms') => {
    const customMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      page: window.location.pathname,
    };

    // Store custom metrics
    try {
      const existingMetrics = JSON.parse(localStorage.getItem('custom-metrics') || '[]');
      existingMetrics.push(customMetric);
      // Keep only last 50 metrics
      const recentMetrics = existingMetrics.slice(-50);
      localStorage.setItem('custom-metrics', JSON.stringify(recentMetrics));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to store custom metric:', error);
      }
    }

    if (import.meta.env.DEV) {
      console.debug(`Custom metric: ${name} = ${value}${unit}`);
    }
  };

  return {
    metrics,
    pagePerformance,
    trackInteraction,
    trackCustomMetric,
  };
};

export const useQueryPerformance = () => {
  const [queryMetrics, setQueryMetrics] = useState<Array<{
    queryKey: string;
    duration: number;
    status: 'success' | 'error' | 'loading';
    timestamp: number;
  }>>([]);

  const trackQuery = (queryKey: string, startTime: number, status: 'success' | 'error') => {
    const duration = Date.now() - startTime;
    
    setQueryMetrics(prev => {
      const newMetric = {
        queryKey,
        duration,
        status,
        timestamp: Date.now(),
      };
      
      // Keep only last 20 queries
      const updatedMetrics = [...prev, newMetric].slice(-20);
      
      // Log slow queries
      if (duration > 2000) {
        if (import.meta.env.DEV) {
          console.warn(`Slow query detected: ${queryKey} took ${duration}ms`);
        }
      }
      return updatedMetrics;
    });
  };

  const getAverageQueryTime = (queryKey?: string) => {
    const relevantQueries = queryKey 
      ? queryMetrics.filter(q => q.queryKey === queryKey)
      : queryMetrics;
    
    if (relevantQueries.length === 0) return 0;
    
    const total = relevantQueries.reduce((sum, query) => sum + query.duration, 0);
    return Math.round(total / relevantQueries.length);
  };

  const getSlowQueries = (threshold = 1000) => {
    return queryMetrics.filter(query => query.duration > threshold);
  };

  return {
    queryMetrics,
    trackQuery,
    getAverageQueryTime,
    getSlowQueries,
  };
};
