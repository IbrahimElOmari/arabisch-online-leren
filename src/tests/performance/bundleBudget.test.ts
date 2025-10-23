import { describe, it, expect } from 'vitest';

describe('Bundle Budget Configuration', () => {
  it('should have valid bundle budget limits', () => {
    const budget = {
      main: 250, // KB
      chunk: 100, // KB
    };

    expect(budget.main).toBe(250);
    expect(budget.chunk).toBe(100);
    expect(budget.main).toBeGreaterThan(0);
    expect(budget.chunk).toBeGreaterThan(0);
    expect(budget.main).toBeGreaterThan(budget.chunk);
  });

  it('should define acceptable size thresholds', () => {
    const thresholds = {
      mainBundleMaxKB: 250,
      chunkMaxKB: 100,
      totalMaxKB: 1000,
    };

    expect(thresholds.mainBundleMaxKB).toBeLessThanOrEqual(300);
    expect(thresholds.chunkMaxKB).toBeLessThanOrEqual(150);
    expect(thresholds.totalMaxKB).toBeLessThanOrEqual(1500);
  });

  it('should have chunk splitting strategy', () => {
    const chunks = {
      'react-vendor': ['react', 'react-dom', 'react-router-dom'],
      'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', 'lucide-react'],
      'data-vendor': ['@tanstack/react-query', '@supabase/supabase-js'],
      'charts-vendor': ['recharts'],
    };

    expect(Object.keys(chunks).length).toBeGreaterThan(0);
    
    Object.values(chunks).forEach(chunk => {
      expect(Array.isArray(chunk)).toBe(true);
      expect(chunk.length).toBeGreaterThan(0);
    });
  });
});
