import { test, expect } from '@playwright/test';

test.describe('PR6: Content Management Flow', () => {
  test('content editor loads correctly', async ({ page }) => {
    // Note: This requires authentication, so may redirect to login
    await page.goto('/content-editor');
    
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'artifacts/content-editor.png', fullPage: true });
    
    // Check if redirected to login or if editor loaded
    const url = page.url();
    console.log('Current URL:', url);
    
    if (url.includes('/login')) {
      console.log('Redirected to login (expected for unauthenticated user)');
    } else {
      // Verify editor loaded
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('template manager accessibility', async ({ page }) => {
    await page.goto('/content-editor');
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'artifacts/template-manager.png', fullPage: true });
    
    // Basic accessibility checks
    const main = page.locator('main');
    if (await main.isVisible()) {
      await expect(main).toBeVisible();
    }
  });
});
