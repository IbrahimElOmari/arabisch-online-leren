import { onCLS, onLCP, onINP, onFCP, onTTFB } from 'web-vitals';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

type Rating = 'good' | 'needs-improvement' | 'poor';

const THRESHOLDS: Record<string, [number, number]> = {
  CLS: [0.1, 0.25],        // Cumulative Layout Shift
  FID: [100, 300],         // First Input Delay (ms)
  LCP: [2500, 4000],       // Largest Contentful Paint (ms)
  FCP: [1800, 3000],       // First Contentful Paint (ms)
  TTFB: [800, 1800],       // Time to First Byte (ms)
  INP: [200, 500],         // Interaction to Next Paint (ms)
};

function getRating(name: string, value: number): Rating {
  const [good, poor] = THRESHOLDS[name] || [0, 0];
  if (value <= good) return 'good';
  if (value >= poor) return 'poor';
  return 'needs-improvement';
}

export interface WebVital {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating: Rating;
}

interface Metric {
  name: string;
  delta: number;
  id: string;
  value: number;
}

async function sendToAnalytics(metric: Metric): Promise<void> {
  const { name, delta, id, value } = metric;
  const rating = getRating(name, value);
  const metricData: WebVital = {
    name,
    value: Math.round(value),
    delta: Math.round(delta),
    id,
    rating,
  };

  if (import.meta.env.DEV) {
    const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`${emoji} Web Vital: ${name}`, metricData);
  }

  if (import.meta.env.PROD) {
    try {
      let sessionId = sessionStorage.getItem('analytics_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
      }

      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('analytics_events').insert({
        event_type: 'web_vital',
        event_data: {
          ...metricData,
          url: window.location.pathname,
          user_agent: navigator.userAgent,
          connection_type: (navigator as any).connection?.effectiveType || 'unknown',
          device_memory: (navigator as any).deviceMemory || 'unknown',
          screen_size: `${window.screen.width}x${window.screen.height}`,
          viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        },
        user_id: user?.id || null,
        session_id: sessionId,
        page_url: window.location.pathname,
      });
    } catch (error) {
      console.warn('[WebVitals] Failed to send metric to analytics:', error);
    }
  }
}

export function initWebVitals(): void {
  onCLS(sendToAnalytics);
  onLCP(sendToAnalytics);
  onINP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

export function useWebVitals() {
  const [vitals, setVitals] = useState<WebVital[]>([]);

  useEffect(() => {
    const handleMetric = (metric: Metric) => {
      const rating = getRating(metric.name, metric.value);
      const vital: WebVital = {
        name: metric.name,
        value: Math.round(metric.value),
        delta: Math.round(metric.delta),
        id: metric.id,
        rating,
      };
      
      setVitals(prev => {
        const index = prev.findIndex(v => v.name === vital.name);
        if (index >= 0) {
          const newVitals = [...prev];
          newVitals[index] = vital;
          return newVitals;
        }
        return [...prev, vital];
      });
    };

    onCLS(handleMetric);
    onLCP(handleMetric);
    onINP(handleMetric);
    onFCP(handleMetric);
    onTTFB(handleMetric);
  }, []);

  const getPoorVitals = () => vitals.filter(v => v.rating === 'poor');

  return { vitals, getPoorVitals };
}

export async function getWebVitalsReport(days = 7): Promise<{
  metrics: Array<{ metric: string; rating: Rating; avgValue: number; p75Value: number; sampleCount: number }>;
  trends: Array<{ date: string; metric: string; avgValue: number }>;
}> {
  try {
    const { data, error } = await supabase.rpc('get_web_vitals_summary' as any, { days_ago: days });
    if (error) throw error;
    return (data as any) || { metrics: [], trends: [] };
  } catch (error) {
    console.error('[WebVitals] Failed to fetch report:', error);
    return { metrics: [], trends: [] };
  }
}

export function markPerformance(name: string): void {
  if ('performance' in window && 'mark' in performance) {
    performance.mark(name);
  }
}

export function measurePerformance(name: string, startMark: string, endMark?: string): number {
  if ('performance' in window && 'measure' in performance) {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
      const measure = performance.getEntriesByName(name, 'measure')[0];
      return measure?.duration || 0;
    } catch (error) {
      console.warn('[WebVitals] Failed to measure performance:', error);
      return 0;
    }
  }
  return 0;
}

export async function reportCustomMetric(name: string, value: number, unit: string = 'ms'): Promise<void> {
  if (import.meta.env.DEV) {
    console.log(`📊 Custom Metric: ${name} = ${value}${unit}`);
  }

  if (import.meta.env.PROD) {
    try {
      const sessionId = sessionStorage.getItem('analytics_session_id');
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('analytics_events').insert({
        event_type: 'custom_metric',
        event_data: { name, value, unit, url: window.location.pathname },
        user_id: user?.id || null,
        session_id: sessionId,
        page_url: window.location.pathname,
      });
    } catch (error) {
      console.warn('[WebVitals] Failed to report custom metric:', error);
    }
  }
}
