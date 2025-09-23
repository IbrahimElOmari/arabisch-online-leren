import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/auth');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('Dashboard accessibility audit', async ({ page }) => {
    await page.goto('/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Admin dashboard accessibility', async ({ page }) => {
    // Switch to admin role
    await page.evaluate(() => {
      localStorage.setItem('user-role', 'admin');
    });
    
    await page.goto('/admin');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Test Tab navigation
    await page.keyboard.press('Tab');
    let focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Navigate through several focusable elements
    const focusableElements = [];
    for (let i = 0; i < 10; i++) {
      const element = await page.locator(':focus').textContent();
      focusableElements.push(element);
      await page.keyboard.press('Tab');
    }

    // Check that focus moved between different elements
    const uniqueElements = new Set(focusableElements.filter(Boolean));
    expect(uniqueElements.size).toBeGreaterThan(1);
  });

  test('Keyboard shortcuts', async ({ page }) => {
    await page.goto('/dashboard');

    // Test Escape key closes modals/dropdowns
    const dropdown = page.locator('[data-testid="user-dropdown"]');
    if (await dropdown.isVisible()) {
      await dropdown.click();
      await page.keyboard.press('Escape');
      await expect(page.locator('[role="menu"]')).not.toBeVisible();
    }

    // Test Enter key activates buttons
    const button = page.locator('button').first();
    await button.focus();
    await page.keyboard.press('Enter');
    // Verify button action occurred (this depends on specific button behavior)
  });

  test('Screen reader compatibility', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    let previousLevel = 0;
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const currentLevel = parseInt(tagName.replace('h', ''));
      
      // Heading levels should not skip (e.g., h1 -> h3)
      if (previousLevel > 0) {
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      }
      previousLevel = currentLevel;
    }

    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Images should have alt text or be marked as decorative
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }

    // Check for proper form labels
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        // Input should have associated label or aria-label
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('Color contrast', async ({ page }) => {
    await page.goto('/dashboard');

    // Test in light mode
    const lightModeResults = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze();

    expect(lightModeResults.violations).toEqual([]);

    // Switch to dark mode
    await page.click('[data-testid="theme-toggle"]');
    await page.waitForTimeout(500); // Wait for theme transition

    // Test in dark mode
    const darkModeResults = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze();

    expect(darkModeResults.violations).toEqual([]);
  });

  test('Focus management in modals', async ({ page }) => {
    await page.goto('/dashboard');

    // Open a modal (adjust selector based on your modals)
    const modalTrigger = page.locator('[data-testid="open-modal"]');
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();
      
      // Check that focus moves to modal
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Focus should be trapped within modal
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      const isWithinModal = await focusedElement.evaluate((el, modal) => {
        return modal.contains(el);
      }, await modal.elementHandle());
      
      expect(isWithinModal).toBeTruthy();
      
      // Escape should close modal and restore focus
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
      
      // Focus should return to trigger element
      await expect(modalTrigger).toBeFocused();
    }
  });

  test('RTL accessibility', async ({ page }) => {
    await page.goto('/dashboard');

    // Switch to Arabic/RTL mode
    await page.click('[data-testid="language-toggle"]');
    await page.click('[data-testid="language-arabic"]');
    
    // Wait for RTL to apply
    await expect(page.locator('html[dir="rtl"]')).toBeVisible();

    // Run accessibility scan in RTL mode
    const rtlResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(rtlResults.violations).toEqual([]);

    // Test keyboard navigation in RTL
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Test arrow key navigation (if applicable)
    const menu = page.locator('[role="menu"]');
    if (await menu.isVisible()) {
      await page.keyboard.press('ArrowRight');
      // In RTL, right arrow should move to previous item
      // Verify based on your specific implementation
    }
  });

  test('Reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/dashboard');

    // Check that animations are reduced or disabled
    const animatedElements = page.locator('.animate-spin, .animate-pulse, .animate-bounce');
    const count = await animatedElements.count();

    for (let i = 0; i < count; i++) {
      const element = animatedElements.nth(i);
      const animationDuration = await element.evaluate((el) => {
        return window.getComputedStyle(el).animationDuration;
      });
      
      // Animations should be disabled or very fast
      expect(animationDuration === '0s' || animationDuration === '0.01s').toBeTruthy();
    }
  });

  test('High contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
    await page.goto('/dashboard');

    // Check that content is still visible and usable
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // Check that interactive elements are distinguishable
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const styles = await button.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
            border: computed.border
          };
        });
        
        // Button should have distinct background or border
        expect(
          styles.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
          styles.border !== 'none' ||
          styles.color !== 'rgb(0, 0, 0)'
        ).toBeTruthy();
      }
    }
  });

  test('Skip links', async ({ page }) => {
    await page.goto('/dashboard');

    // Test skip to main content link
    await page.keyboard.press('Tab');
    const firstFocusable = page.locator(':focus');
    const text = await firstFocusable.textContent();
    
    if (text?.toLowerCase().includes('skip')) {
      await page.keyboard.press('Enter');
      
      // Focus should move to main content
      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeFocused();
    }
  });

  test('Form error announcements', async ({ page }) => {
    await page.goto('/profile'); // Or any page with forms

    // Fill form with invalid data
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid-email');
      await emailInput.blur();

      // Check for error message
      const errorMessage = page.locator('[role="alert"], .text-destructive');
      if (await errorMessage.count() > 0) {
        // Error should be associated with input
        const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');
        const errorId = await errorMessage.getAttribute('id');
        
        expect(ariaDescribedBy).toContain(errorId || '');
      }
    }
  });
});