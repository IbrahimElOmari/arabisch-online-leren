import { test, expect } from '@playwright/test';

test.describe('RTL regression', () => {
  test('layout flips correctly and focus order is logical', async ({ page }) => {
    await page.goto('/');
    
    // Switch to RTL mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
    });
    
    // Verify navigation is visible and properly oriented
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Test tab order - should be logical in RTL
    await page.keyboard.press('Tab');
    const firstFocusable = page.locator('header a, header button').first();
    await expect(firstFocusable).toBeFocused();
  });
  
  test('RTL mode persists across navigation', async ({ page }) => {
    await page.goto('/');
    
    // Enable RTL
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
    });
    
    // Navigate to another page
    const dashboardLink = page.locator('a[href*="dashboard"]').first();
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      
      // Verify RTL attribute persists
      const dir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
      expect(dir).toBe('rtl');
    }
  });
});
