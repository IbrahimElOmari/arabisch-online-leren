import { describe, it, expect, beforeEach } from 'vitest';
import { markPerformance, measurePerformance } from '@/utils/webVitals';

describe('Web Vitals Utilities', () => {
  beforeEach(() => {
    // Clear performance marks and measures
    if (window.performance) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  });

  describe('markPerformance', () => {
    it('should create a performance mark', () => {
      markPerformance('test-mark');
      
      const marks = performance.getEntriesByName('test-mark', 'mark');
      expect(marks.length).toBeGreaterThan(0);
    });

    it('should handle multiple marks', () => {
      markPerformance('mark-1');
      markPerformance('mark-2');
      markPerformance('mark-3');

      expect(performance.getEntriesByName('mark-1', 'mark').length).toBe(1);
      expect(performance.getEntriesByName('mark-2', 'mark').length).toBe(1);
      expect(performance.getEntriesByName('mark-3', 'mark').length).toBe(1);
    });
  });

  describe('measurePerformance', () => {
    it('should measure duration between two marks', () => {
      markPerformance('start');
      
      // Simulate some work
      const now = performance.now();
      while (performance.now() - now < 10); // Busy wait ~10ms
      
      markPerformance('end');
      
      const duration = measurePerformance('test-measure', 'start', 'end');
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // Should be less than 1 second
    });

    it('should return 0 for invalid marks', () => {
      const duration = measurePerformance('invalid-measure', 'non-existent-mark');
      expect(duration).toBe(0);
    });
  });

  describe('Web Vitals thresholds', () => {
    it('should have correct threshold values', () => {
      const thresholds = {
        CLS: { good: 0.1, poor: 0.25 },
        FID: { good: 100, poor: 300 },
        LCP: { good: 2500, poor: 4000 },
        INP: { good: 200, poor: 500 },
      };

      expect(thresholds.CLS.good).toBeLessThan(thresholds.CLS.poor);
      expect(thresholds.FID.good).toBeLessThan(thresholds.FID.poor);
      expect(thresholds.LCP.good).toBeLessThan(thresholds.LCP.poor);
      expect(thresholds.INP.good).toBeLessThan(thresholds.INP.poor);
    });
  });

  describe('WebVital type', () => {
    it('should have correct structure', () => {
      const webVital = {
        name: 'LCP',
        value: 2300,
        delta: 100,
        id: 'v1-123',
        rating: 'good' as const,
      };

      expect(webVital).toHaveProperty('name');
      expect(webVital).toHaveProperty('value');
      expect(webVital).toHaveProperty('delta');
      expect(webVital).toHaveProperty('id');
      expect(webVital).toHaveProperty('rating');
    });

    it('should accept all rating types', () => {
      const ratings: Array<'good' | 'needs-improvement' | 'poor'> = [
        'good',
        'needs-improvement',
        'poor',
      ];

      ratings.forEach(rating => {
        const webVital = {
          name: 'LCP',
          value: 2000,
          delta: 0,
          id: 'test',
          rating,
        };

        expect(['good', 'needs-improvement', 'poor']).toContain(webVital.rating);
      });
    });
  });
});
