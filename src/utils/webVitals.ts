import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

export interface WebVital {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export class WebVitalsReporter {
  private vitals: Map<string, WebVital> = new Map();
  private thresholds = {
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    CLS: { good: 0.1, poor: 0.25 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 }
  };

  constructor() {
    this.initWebVitals();
  }

  private initWebVitals() {
    // Collect Core Web Vitals (FID is deprecated, using INP instead)
    onCLS(this.handleVital.bind(this));
    onFCP(this.handleVital.bind(this));
    onLCP(this.handleVital.bind(this));
    onTTFB(this.handleVital.bind(this));
    onINP(this.handleVital.bind(this));
  }

  private handleVital(vital: any) {
    const rating = this.getRating(vital.name, vital.value);
    const webVital: WebVital = {
      name: vital.name,
      value: vital.value,
      delta: vital.delta,
      id: vital.id,
      rating
    };

    this.vitals.set(vital.name, webVital);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      this.logVital(webVital);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(webVital);
    }
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = this.thresholds[name as keyof typeof this.thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private logVital(vital: WebVital) {
    const emoji = vital.rating === 'good' ? '✅' : vital.rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`${emoji} ${vital.name}: ${vital.value.toFixed(2)} (${vital.rating})`);

    if (vital.rating === 'poor') {
      console.warn(`Performance issue detected: ${vital.name} is ${vital.value.toFixed(2)}, threshold is ${this.thresholds[vital.name as keyof typeof this.thresholds]?.poor}`);
    }
  }

  private sendToAnalytics(vital: WebVital) {
    // In production, send to your analytics service
    // For now, we'll use a beacon API
    try {
      const body = JSON.stringify({
        name: vital.name,
        value: vital.value,
        rating: vital.rating,
        url: window.location.href,
        timestamp: Date.now()
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/vitals', body);
      } else {
        fetch('/api/analytics/vitals', {
          method: 'POST',
          body,
          keepalive: true
        });
      }
    } catch (error) {
      console.warn('Failed to send web vitals:', error);
    }
  }

  public getVitals(): WebVital[] {
    return Array.from(this.vitals.values());
  }

  public getVitalsByRating(rating: 'good' | 'needs-improvement' | 'poor'): WebVital[] {
    return this.getVitals().filter(vital => vital.rating === rating);
  }

  public generateReport(): string {
    const vitals = this.getVitals();
    if (vitals.length === 0) return 'No metrics available yet';

    const report = vitals.map(vital => {
      const emoji = vital.rating === 'good' ? '✅' : vital.rating === 'needs-improvement' ? '⚠️' : '❌';
      return `${emoji} ${vital.name}: ${vital.value.toFixed(2)} (${vital.rating})`;
    }).join('\n');

    return `Web Vitals Report:\n${report}`;
  }
}

// Global instance
export const webVitalsReporter = new WebVitalsReporter();

// Hook for components
export const useWebVitals = () => {
  return {
    vitals: webVitalsReporter.getVitals(),
    getReport: () => webVitalsReporter.generateReport(),
    getPoorVitals: () => webVitalsReporter.getVitalsByRating('poor')
  };
};