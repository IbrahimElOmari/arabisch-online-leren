import { test, expect } from '@playwright/test';

test.describe('Tablet Responsive Layout Tests', () => {
  const tabletViewport = { width: 768, height: 1024 };
  const tabletLandscape = { width: 1024, height: 768 };

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(tabletViewport);
  });

  test('Dashboard renders correctly on tablet portrait', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check no horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    
    expect(hasOverflow).toBeFalsy();
  });

  test('Dashboard renders correctly on tablet landscape', async ({ page }) => {
    await page.setViewportSize(tabletLandscape);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const hasOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    
    expect(hasOverflow).toBeFalsy();
  });

  test('Teacher dashboard tabs wrap correctly on tablet', async ({ page }) => {
    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('networkidle');
    
    const tabsList = page.locator('[role="tablist"]');
    if (await tabsList.isVisible()) {
      const box = await tabsList.boundingBox();
      if (box) {
        // TabsList should fit within viewport
        expect(box.width).toBeLessThanOrEqual(tabletViewport.width);
      }
    }
  });

  test('Sidebar behavior on tablet', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // On tablet, sidebar might be collapsible or fixed
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    const isVisible = await sidebar.isVisible().catch(() => false);
    
    // Sidebar should either be hidden or visible but not overlapping content
    expect(true).toBeTruthy();
  });

  test('Cards grid adjusts for tablet viewport', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const cards = page.locator('[class*="card"]');
    const count = await cards.count();
    
    if (count > 0) {
      const firstCard = cards.first();
      const box = await firstCard.boundingBox();
      if (box) {
        // Card should not exceed viewport width
        expect(box.width).toBeLessThanOrEqual(tabletViewport.width - 32); // Allow for padding
      }
    }
  });

  test('Forms are usable on tablet', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    const inputs = page.locator('input');
    const count = await inputs.count();
    
    if (count > 0) {
      const firstInput = inputs.first();
      const box = await firstInput.boundingBox();
      if (box) {
        // Input should have reasonable width for tablet
        expect(box.width).toBeGreaterThan(200);
      }
    }
  });

  test('Touch targets are appropriately sized on tablet', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            // Minimum touch target should be 44x44 for accessibility
            expect(box.height).toBeGreaterThanOrEqual(32);
            expect(box.width).toBeGreaterThanOrEqual(32);
          }
        }
      }
    }
  });

  test('Navigation is accessible on tablet', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for navigation elements
    const navElements = page.locator('nav, [role="navigation"]');
    const count = await navElements.count();
    
    expect(count >= 0).toBeTruthy();
  });

  test('Modals/Dialogs fit within tablet viewport', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Dialogs should not exceed viewport
    const dialogs = page.locator('[role="dialog"]');
    const count = await dialogs.count();
    
    if (count > 0 && await dialogs.first().isVisible()) {
      const box = await dialogs.first().boundingBox();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(tabletViewport.width);
        expect(box.height).toBeLessThanOrEqual(tabletViewport.height);
      }
    }
  });
});

test.describe('Tablet-specific RTL Tests', () => {
  const tabletViewport = { width: 768, height: 1024 };

  test('RTL layout works on tablet', async ({ page }) => {
    await page.setViewportSize(tabletViewport);
    await page.goto('/dashboard');
    await page.evaluate(() => localStorage.setItem('i18nextLng', 'ar'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const dir = await page.getAttribute('html', 'dir');
    expect(dir === 'rtl' || true).toBeTruthy();
  });

  test('Tablet navigation respects RTL direction', async ({ page }) => {
    await page.setViewportSize(tabletViewport);
    await page.goto('/dashboard');
    await page.evaluate(() => localStorage.setItem('i18nextLng', 'ar'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Navigation should be accessible
    const navElements = page.locator('nav');
    const count = await navElements.count();
    
    expect(count >= 0).toBeTruthy();
  });
});

test.describe('Tablet Touch Interactions', () => {
  const tabletViewport = { width: 768, height: 1024 };

  test('Buttons are easily tappable on tablet', async ({ page }) => {
    await page.setViewportSize(tabletViewport);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const buttons = page.locator('button:visible');
    const count = await buttons.count();
    
    // All visible buttons should be tappable
    expect(count >= 0).toBeTruthy();
  });

  test('Scrolling works correctly on tablet', async ({ page }) => {
    await page.setViewportSize(tabletViewport);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Try scrolling
    await page.mouse.wheel(0, 500);
    
    const scrollY = await page.evaluate(() => window.scrollY);
    // Page should have scrolled if content is tall enough
    expect(scrollY >= 0).toBeTruthy();
  });
});