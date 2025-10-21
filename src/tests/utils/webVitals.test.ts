import { describe, it, expect } from 'vitest';
import { markPerformance, measurePerformance, WebVital } from '@/utils/webVitals';

describe('Web Vitals Utilities', () => {
  describe('markPerformance', () => {
    it('should create a performance mark', () => {
      const markName = 'test-mark';
      markPerformance(markName);
      
      const marks = performance.getEntriesByName(markName, 'mark');
      expect(marks.length).toBeGreaterThan(0);
    });

    it('should handle multiple marks', () => {
      markPerformance('mark-1');
      markPerformance('mark-2');
      
      const marks1 = performance.getEntriesByName('mark-1', 'mark');
      const marks2 = performance.getEntriesByName('mark-2', 'mark');
      
      expect(marks1.length).toBeGreaterThan(0);
      expect(marks2.length).toBeGreaterThan(0);
    });
  });

  describe('measurePerformance', () => {
    it('should measure duration between marks', () => {
      markPerformance('start-measure');
      
      // Simulate some work
      for (let i = 0; i < 1000; i++) {
        Math.random();
      }
      
      markPerformance('end-measure');
      
      const duration = measurePerformance('test-measure', 'start-measure', 'end-measure');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for invalid marks', () => {
      const duration = measurePerformance('invalid-measure', 'non-existent-start', 'non-existent-end');
      expect(duration).toBe(0);
    });
  });

  describe('WebVital type', () => {
    it('should have correct structure', () => {
      const vital: WebVital = {
        name: 'LCP',
        value: 2000,
        delta: 100,
        id: 'test-id',
        rating: 'good',
      };

      expect(vital.name).toBe('LCP');
      expect(vital.value).toBe(2000);
      expect(vital.delta).toBe(100);
      expect(vital.rating).toBe('good');
    });

    it('should support all rating types', () => {
      const ratings: Array<WebVital['rating']> = ['good', 'needs-improvement', 'poor'];
      
      ratings.forEach(rating => {
        const vital: WebVital = {
          name: 'CLS',
          value: 0.1,
          delta: 0.01,
          id: 'test',
          rating,
        };
        expect(vital.rating).toBe(rating);
      });
    });
  });
});
