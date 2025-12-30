import { test, expect, Page } from '@playwright/test';

// Test responsive behavior across different viewports
const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'large', width: 1920, height: 1080 }
];

test.describe('Responsive UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/auth');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  for (const viewport of viewports) {
    test(`Dashboard layout on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/dashboard');

      // Wait for content to load
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();

      // Check no horizontal scrolling
      const horizontalScrollWidth = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(horizontalScrollWidth).toBeFalsy();

      // Check navigation visibility
      if (viewport.width < 768) {
        // Mobile: navigation should be collapsible
        await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
      } else {
        // Desktop: sidebar should be visible
        await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible();
      }

      // Take screenshot for visual regression
      await expect(page).toHaveScreenshot(`dashboard-${viewport.name}.png`, {
        fullPage: true,
        threshold: 0.3
      });
    });

    test(`Admin dashboard layout on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Switch to admin role (mock)
      await page.evaluate(() => {
        localStorage.setItem('user-role', 'admin');
      });
      
      await page.goto('/admin');
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();

      // Check tab navigation
      const tabsList = page.locator('[role="tablist"]');
      await expect(tabsList).toBeVisible();

      if (viewport.width < 768) {
        // Mobile: tabs should be scrollable horizontally
        const hasHorizontalScroll = await tabsList.evaluate((el) => {
          return el.scrollWidth > el.clientWidth;
        });
        expect(hasHorizontalScroll).toBeTruthy();
      }

      // Check content area
      await expect(page.locator('[role="tabpanel"]')).toBeVisible();
    });

    test(`Form responsiveness on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/profile');

      // Check form layout
      const form = page.locator('form');
      await expect(form).toBeVisible();

      // Check input field widths
      const inputs = page.locator('input[type="text"], input[type="email"], textarea');
      const inputCount = await inputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        await expect(input).toBeVisible();
        
        // Check input is not overflowing
        const box = await input.boundingBox();
        if (box) {
          expect(box.width).toBeLessThanOrEqual(viewport.width - 32); // Account for padding
        }
      }
    });
  }

  test('RTL layout responsiveness', async ({ page }) => {
    // Test Arabic/RTL mode across viewports
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/dashboard');

      // Switch to Arabic
      await page.click('[data-testid="language-toggle"]');
      await page.click('[data-testid="language-arabic"]');

      // Wait for RTL to apply
      await expect(page.locator('html[dir="rtl"]')).toBeVisible();

      // Check text alignment
      const arabicText = page.locator('.arabic-text').first();
      if (await arabicText.isVisible()) {
        const textAlign = await arabicText.evaluate((el) => 
          window.getComputedStyle(el).textAlign
        );
        expect(textAlign).toBe('right');
      }

      // Check layout direction
      const flexContainers = page.locator('.flex-row-reverse');
      if (await flexContainers.count() > 0) {
        const direction = await flexContainers.first().evaluate((el) =>
          window.getComputedStyle(el).direction
        );
        expect(direction).toBe('rtl');
      }
    }
  });

  test('Touch interactions on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('Skipping touch test on non-mobile browser');
    }

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');

    // Check touch targets are large enough (44px minimum)
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }

    // Test swipe gestures (if implemented)
    const swipeContainer = page.locator('[data-testid="swipe-container"]');
    if (await swipeContainer.isVisible()) {
      await swipeContainer.hover();
      await page.mouse.down();
      await page.mouse.move(100, 0);
      await page.mouse.up();
      
      // Verify swipe action occurred
      await expect(page.locator('[data-testid="swipe-result"]')).toBeVisible();
    }
  });

  test('Accessibility on different screen sizes', async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/dashboard');

      // Check focus indicators
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Check focus ring visibility
      const hasOutline = await focusedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.outline !== 'none' || styles.boxShadow.includes('ring');
      });
      expect(hasOutline).toBeTruthy();

      // Test keyboard navigation
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const currentFocus = page.locator(':focus');
        await expect(currentFocus).toBeVisible();
      }
    }
  });

  test('No container-query utility classes are used', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/dashboard');

    const offending = await page.evaluate(() => {
      const bad: Array<{ tag: string; className: string }> = [];

      document.querySelectorAll<HTMLElement>('[class]').forEach((el) => {
        const classes = Array.from(el.classList);
        if (classes.some((c) => c.startsWith('@'))) {
          bad.push({ tag: el.tagName.toLowerCase(), className: el.className });
        }
      });

      return bad;
    });

    expect(offending).toEqual([]);
  });

  test('Performance on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    
    // Simulate slow network
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto('/dashboard');
    
    // Wait for main content
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    const loadTime = Date.now() - startTime;

    // Performance assertion - adjust threshold as needed
    expect(loadTime).toBeLessThan(5000);

    // Check for layout shifts
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const clsScore = entries.reduce((sum, entry) => sum + entry.value, 0);
          resolve(clsScore);
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Resolve after 2 seconds if no layout shifts
        setTimeout(() => resolve(0), 2000);
      });
    });

    // CLS should be less than 0.1 for good user experience
    expect(cls).toBeLessThan(0.1);
  });
});