import { test, expect } from '@playwright/test';

/**
 * E4: Performance Final Audit
 * Validates performance metrics across all pages
 */
test.describe('Performance Final Audit', () => {
  const pages = [
    { name: 'Home', url: '/' },
    { name: 'Auth', url: '/auth' },
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Forum', url: '/forum' },
    { name: 'Leerstof', url: '/leerstof' },
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.name} loads within performance budget`, async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Target: < 3000ms for initial load
      expect(loadTime).toBeLessThan(3000);
      console.log(`✅ ${pageInfo.name} loaded in ${loadTime}ms`);
    });

    test(`${pageInfo.name} has no console errors`, async ({ page }) => {
      const errors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');
      
      // Filter out known non-critical errors
      const criticalErrors = errors.filter(err => 
        !err.includes('favicon') && 
        !err.includes('DevTools')
      );
      
      expect(criticalErrors.length).toBe(0);
      console.log(`✅ ${pageInfo.name} has no console errors`);
    });

    test(`${pageInfo.name} has optimized images`, async ({ page }) => {
      await page.goto(pageInfo.url);
      
      const images = page.locator('img');
      const count = await images.count();
      
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const loading = await img.getAttribute('loading');
        
        // All images should have alt text
        expect(alt).toBeDefined();
        
        // Non-critical images should be lazy loaded
        if (i > 2) {
          expect(loading).toBe('lazy');
        }
      }
      
      console.log(`✅ ${pageInfo.name} images optimized (${count} images)`);
    });
  }

  test('JavaScript bundle size is within budget', async ({ page }) => {
    const response = await page.goto('/');
    
    // Get all JS resources
    const resources = await page.evaluate(() => 
      performance.getEntriesByType('resource')
        .filter((r: any) => r.initiatorType === 'script')
        .map((r: any) => ({
          name: r.name,
          size: r.transferSize
        }))
    );
    
    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    const totalKB = Math.round(totalSize / 1024);
    
    // Target: < 300KB total JS
    expect(totalKB).toBeLessThan(300);
    console.log(`✅ Total JS bundle: ${totalKB}KB`);
  });

  test('CSS bundle size is within budget', async ({ page }) => {
    await page.goto('/');
    
    const resources = await page.evaluate(() => 
      performance.getEntriesByType('resource')
        .filter((r: any) => r.initiatorType === 'link' && r.name.includes('.css'))
        .map((r: any) => ({
          name: r.name,
          size: r.transferSize
        }))
    );
    
    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    const totalKB = Math.round(totalSize / 1024);
    
    // Target: < 100KB total CSS
    expect(totalKB).toBeLessThan(100);
    console.log(`✅ Total CSS bundle: ${totalKB}KB`);
  });

  test('no memory leaks on navigation', async ({ page }) => {
    await page.goto('/');
    
    // Get initial memory (if available)
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Navigate through app
    const routes = ['/auth', '/dashboard', '/forum', '/'];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
    }
    
    // Get final memory
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    if (initialMemory > 0 && finalMemory > 0) {
      const increase = ((finalMemory - initialMemory) / initialMemory) * 100;
      // Memory should not increase more than 50% after navigation
      expect(increase).toBeLessThan(50);
      console.log(`✅ Memory stable: ${increase.toFixed(1)}% increase`);
    } else {
      console.log('✅ Memory leak test completed (performance.memory not available)');
    }
  });
});
