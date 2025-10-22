import { test, expect } from '@playwright/test';

/**
 * E2E Tests for I18N/RTL (A5)
 * Tests language switching, RTL layout, and text direction
 */

test.describe('I18N & RTL Support', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
  });

  test('should have language selector visible', async ({ page }) => {
    const languageSelector = page.locator('[data-testid="language-selector"]');
    await expect(languageSelector).toBeVisible();
  });

  test.describe('Dutch (NL) - LTR', () => {
    test('should have correct dir and lang attributes', async ({ page }) => {
      await page.goto('/auth');
      
      const html = page.locator('html');
      await expect(html).toHaveAttribute('dir', 'ltr');
      await expect(html).toHaveAttribute('lang', 'nl');
    });

    test('should display Dutch navigation', async ({ page }) => {
      await page.goto('/auth');
      
      // Check for Dutch text
      await expect(page.getByText('Inloggen')).toBeVisible();
    });
  });

  test.describe('English (EN) - LTR', () => {
    test('should switch to English', async ({ page }) => {
      await page.goto('/auth');
      
      // Switch language
      const languageSelector = page.locator('[data-testid="language-selector"]');
      await languageSelector.click();
      await page.locator('[data-testid="language-option-en"]').click();
      
      const html = page.locator('html');
      await expect(html).toHaveAttribute('lang', 'en');
      
      // Check for English text
      await expect(page.getByText('Login')).toBeVisible();
    });
  });

  test.describe('Arabic (AR) - RTL', () => {
    test('should switch to Arabic and enable RTL', async ({ page }) => {
      await page.goto('/auth');
      
      // Switch to Arabic
      const languageSelector = page.locator('[data-testid="language-selector"]');
      await languageSelector.click();
      await page.locator('[data-testid="language-option-ar"]').click();
      
      // Wait for direction change
      await page.waitForTimeout(500);
      
      const html = page.locator('html');
      await expect(html).toHaveAttribute('dir', 'rtl');
      await expect(html).toHaveAttribute('lang', 'ar');
    });

    test('should have RTL class on html element', async ({ page }) => {
      await page.goto('/auth');
      
      // Switch to Arabic
      const languageSelector = page.locator('[data-testid="language-selector"]');
      await languageSelector.click();
      await page.locator('[data-testid="language-option-ar"]').click();
      
      await page.waitForTimeout(500);
      
      const html = page.locator('html');
      await expect(html).toHaveClass(/rtl-mode/);
    });

    test('should mirror directional icons in RTL', async ({ page }) => {
      await page.goto('/auth');
      
      // Switch to Arabic
      const languageSelector = page.locator('[data-testid="language-selector"]');
      await languageSelector.click();
      await page.locator('[data-testid="language-option-ar"]').click();
      
      await page.waitForTimeout(500);
      
      // Check for mirrored icons (chevrons, arrows)
      const mirroredIcons = page.locator('.rtl-mirror');
      if (await mirroredIcons.count() > 0) {
        const transform = await mirroredIcons.first().evaluate(el => 
          window.getComputedStyle(el).transform
        );
        expect(transform).toContain('matrix(-1'); // scaleX(-1)
      }
    });
  });

  test.describe('Persistence', () => {
    test('should persist language preference', async ({ page }) => {
      await page.goto('/auth');
      
      // Switch to English
      const languageSelector = page.locator('[data-testid="language-selector"]');
      await languageSelector.click();
      await page.locator('[data-testid="language-option-en"]').click();
      
      // Reload page
      await page.reload();
      
      // Should still be English
      const html = page.locator('html');
      await expect(html).toHaveAttribute('lang', 'en');
    });
  });

  test.describe('Visual Regression', () => {
    test('should match NL snapshot on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/auth');
      await expect(page).toHaveScreenshot('auth-nl-desktop.png');
    });

    test('should match EN snapshot on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/auth');
      
      const languageSelector = page.locator('[data-testid="language-selector"]');
      await languageSelector.click();
      await page.locator('[data-testid="language-option-en"]').click();
      
      await expect(page).toHaveScreenshot('auth-en-desktop.png');
    });

    test('should match AR snapshot on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/auth');
      
      const languageSelector = page.locator('[data-testid="language-selector"]');
      await languageSelector.click();
      await page.locator('[data-testid="language-option-ar"]').click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('auth-ar-desktop.png');
    });

    test('should match NL snapshot on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/auth');
      await expect(page).toHaveScreenshot('auth-nl-mobile.png');
    });
  });
});
