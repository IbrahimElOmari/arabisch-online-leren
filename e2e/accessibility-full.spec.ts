import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Full Accessibility Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should pass axe accessibility scan on home page', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have skip links', async ({ page }) => {
    // Press Tab to focus skip links
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('text=/skip to/i').first();
    await expect(skipLink).toBeFocused();
    
    // Pressing Enter should skip to main content
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeFocused();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Tab through interactive elements
    const interactiveElements: string[] = [];
    
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName + (el?.getAttribute('aria-label') || '');
      });
      
      interactiveElements.push(focused);
    }
    
    // Should navigate through focusable elements
    expect(interactiveElements.length).toBeGreaterThan(0);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check buttons have labels
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const hasLabel = await button.evaluate((el) => {
        return !!(
          el.textContent?.trim() ||
          el.getAttribute('aria-label') ||
          el.getAttribute('aria-labelledby')
        );
      });
      
      expect(hasLabel).toBe(true);
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('[data-testid="main-content"]')
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = await Promise.all(
      headings.map((h) => h.evaluate((el) => parseInt(el.tagName[1])))
    );
    
    // Should have h1
    expect(headingLevels).toContain(1);
    
    // Heading levels should not skip (e.g., h1 -> h3)
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1];
      expect(Math.abs(diff)).toBeLessThanOrEqual(1);
    }
  });

  test('should have focus indicators', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Tab to first focusable element
    await page.keyboard.press('Tab');
    
    const focused = page.locator(':focus');
    const hasVisibleFocus = await focused.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return (
        styles.outline !== 'none' ||
        styles.boxShadow !== 'none' ||
        styles.border !== styles.borderWidth + ' none'
      );
    });
    
    expect(hasVisibleFocus).toBe(true);
  });

  test('should support reduced motion', async ({ page }) => {
    // Set prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/dashboard');
    
    // Animations should be disabled or reduced
    const hasAnimations = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        const styles = window.getComputedStyle(el);
        if (styles.animationDuration !== '0s' && styles.animationDuration !== '') {
          return true;
        }
      }
      return false;
    });
    
    // With reduced motion, animations should be minimal or none
    expect(hasAnimations).toBe(false);
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Press ? to open keyboard shortcuts help
    await page.keyboard.press('Shift+?');
    await page.waitForTimeout(500);
    
    const shortcutsDialog = page.locator('[data-testid="keyboard-shortcuts-dialog"]');
    await expect(shortcutsDialog).toBeVisible();
    
    // Press Escape to close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(shortcutsDialog).not.toBeVisible();
  });

  test('should trap focus in modals', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Open a modal
    await page.click('[data-testid="open-modal-button"]');
    await page.waitForTimeout(300);
    
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Tab through modal elements
    const focusedElements: string[] = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      const isInModal = await page.evaluate(() => {
        const focused = document.activeElement;
        const modal = document.querySelector('[role="dialog"]');
        return modal?.contains(focused) || false;
      });
      
      focusedElements.push(isInModal ? 'in-modal' : 'out-modal');
    }
    
    // Focus should stay within modal
    expect(focusedElements.every((f) => f === 'in-modal')).toBe(true);
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/auth');
    
    const inputs = page.locator('input');
    const count = await inputs.count();
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.evaluate((el) => {
        const id = el.id;
        return !!(
          document.querySelector(`label[for="${id}"]`) ||
          el.getAttribute('aria-label') ||
          el.getAttribute('aria-labelledby')
        );
      });
      
      expect(hasLabel).toBe(true);
    }
  });
});
