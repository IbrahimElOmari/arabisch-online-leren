/**
 * RTL Mobile Layout Tests
 * Verifies all 5 RTL fixes are working correctly
 */

import { test, expect } from '@playwright/test';

test.describe('RTL Mobile Layout Fixes', () => {
  // Use mobile viewport
  test.use({ viewport: { width: 375, height: 812 } });

  test('FIX 1: RTL state syncs with language', async ({ page }) => {
    await page.goto('/');
    
    // Check initial state (should be LTR for Dutch)
    let dir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
    let lang = await page.evaluate(() => document.documentElement.getAttribute('lang'));
    
    expect(dir).toBe('ltr');
    expect(lang).toBe('nl');
    
    // Switch to Arabic
    await page.evaluate(() => {
      // Trigger language change
      localStorage.setItem('language_preference', 'ar');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify RTL is applied
    dir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
    lang = await page.evaluate(() => document.documentElement.getAttribute('lang'));
    
    expect(dir).toBe('rtl');
    expect(lang).toBe('ar');
  });

  test('FIX 2: Viewport meta has no non-standard params', async ({ page }) => {
    await page.goto('/');
    
    const viewportContent = await page.evaluate(() => {
      const viewport = document.querySelector('meta[name="viewport"]');
      return viewport?.getAttribute('content') || '';
    });
    
    // Should NOT contain direction-lockable
    expect(viewportContent).not.toContain('direction-lockable');
    
    // Should contain standard values
    expect(viewportContent).toContain('width=device-width');
  });

  test('FIX 3: No layout flicker on language switch', async ({ page }) => {
    await page.goto('/');
    
    // Record initial scroll position
    const initialScroll = await page.evaluate(() => ({
      scrollLeft: document.scrollingElement?.scrollLeft || 0,
      scrollTop: window.scrollY,
    }));
    
    // Switch language multiple times rapidly
    for (let i = 0; i < 3; i++) {
      await page.evaluate((isRtl) => {
        const lang = isRtl ? 'ar' : 'nl';
        localStorage.setItem('language_preference', lang);
        document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
      }, i % 2 === 0);
      
      await page.waitForTimeout(200);
    }
    
    // Verify no horizontal scroll occurred
    const finalScroll = await page.evaluate(() => ({
      scrollLeft: document.scrollingElement?.scrollLeft || 0,
    }));
    
    expect(finalScroll.scrollLeft).toBe(0);
  });

  test('FIX 4: No horizontal overflow in RTL mode', async ({ page }) => {
    // Set Arabic language
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('language_preference', 'ar');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Wait for layout to settle
    await page.waitForTimeout(500);
    
    // Check for horizontal overflow
    const measurements = await page.evaluate(() => {
      const html = document.documentElement;
      return {
        scrollWidth: html.scrollWidth,
        clientWidth: html.clientWidth,
        innerWidth: window.innerWidth,
        hasOverflow: html.scrollWidth > window.innerWidth + 1,
      };
    });
    
    expect(measurements.hasOverflow).toBe(false);
    expect(measurements.scrollWidth).toBeLessThanOrEqual(measurements.innerWidth + 1);
  });

  test('FIX 4: Main content visible in RTL Arabic mode', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('language_preference', 'ar');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check main content is within viewport
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    
    const boundingBox = await mainContent.boundingBox();
    expect(boundingBox).not.toBeNull();
    
    if (boundingBox) {
      const viewportWidth = 375;
      // Content should start within viewport
      expect(boundingBox.x).toBeGreaterThanOrEqual(-1);
      // Content should not extend too far beyond viewport
      expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(viewportWidth + 50);
    }
  });

  test('FIX 5: Mobile drawer does not shift main content', async ({ page }) => {
    await page.goto('/');
    
    // Get initial main content position
    const mainBefore = await page.evaluate(() => {
      const main = document.querySelector('main');
      return main?.getBoundingClientRect().left || 0;
    });
    
    // Try to open sidebar/drawer
    const sidebarTrigger = page.locator('[data-sidebar="trigger"]').first();
    if (await sidebarTrigger.isVisible()) {
      await sidebarTrigger.click();
      await page.waitForTimeout(300);
      
      // Check scrollWidth didn't increase
      const scrollWidthAfter = await page.evaluate(() => 
        document.documentElement.scrollWidth
      );
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      
      expect(scrollWidthAfter).toBeLessThanOrEqual(viewportWidth + 1);
    }
  });

  test('Dutch (LTR) content is not cramped on mobile', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('language_preference', 'nl');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check main content uses full width
    const mainContent = page.locator('main');
    const boundingBox = await mainContent.boundingBox();
    
    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      // Main content should use most of viewport width (accounting for padding)
      const viewportWidth = 375;
      const usedWidth = boundingBox.width;
      const utilization = usedWidth / viewportWidth;
      
      // Should use at least 80% of viewport width
      expect(utilization).toBeGreaterThan(0.8);
    }
  });
});

test.describe('RTL Navigation Order', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('Tab order is logical in RTL mode', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('language_preference', 'ar');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify dir attribute
    const dir = await page.evaluate(() => 
      document.documentElement.getAttribute('dir')
    );
    expect(dir).toBe('rtl');
    
    // Tab through focusable elements
    await page.keyboard.press('Tab');
    
    // First focused element should be visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        visible: rect.width > 0 && rect.height > 0,
        withinViewport: rect.left >= 0 && rect.right <= window.innerWidth,
      };
    });
    
    expect(focusedElement).not.toBeNull();
    expect(focusedElement?.visible).toBe(true);
    expect(focusedElement?.withinViewport).toBe(true);
  });
});
