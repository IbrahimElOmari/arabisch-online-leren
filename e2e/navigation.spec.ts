import { test, expect } from '@playwright/test';

test.describe('Navigation Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login if needed
    await page.goto('/dashboard');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="navigation-header"]', { timeout: 10000 });
  });

  test('Global Search - Cmd+K opens search dialog', async ({ page }) => {
    // Test keyboard shortcut
    await page.keyboard.press('Meta+k');
    
    // Check if search dialog is open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Check if search input is focused
    await expect(page.locator('input[placeholder*="Zoek"]')).toBeFocused();
    
    // Close the dialog
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('Global Search - Click opens search', async ({ page }) => {
    // Click the search input in the header
    await page.click('input[placeholder*="Zoek"]');
    
    // Check if search dialog is open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('Notifications Bell - shows dropdown', async ({ page }) => {
    // Find and click the notification bell
    const notificationBell = page.locator('button:has([data-lucide="bell"])');
    await notificationBell.click();
    
    // Check if dropdown is visible
    await expect(page.locator('[role="menu"]')).toBeVisible();
    
    // Check for notification content
    await expect(page.locator('text=Meldingen')).toBeVisible();
  });

  test('Search functionality - typing shows results', async ({ page }) => {
    // Open search
    await page.keyboard.press('Meta+k');
    
    // Type in search input
    await page.fill('input[placeholder*="Zoek"]', 'dashboard');
    
    // Wait for search results
    await page.waitForTimeout(500); // Wait for debounce
    
    // Check if results are shown
    await expect(page.locator('[role="option"]')).toBeVisible();
    
    // Press Enter to navigate
    await page.keyboard.press('Enter');
    
    // Check if dialog is closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('User menu - shows profile options', async ({ page }) => {
    // Click user menu button
    const userMenu = page.locator('button:has([data-lucide="user"])');
    await userMenu.click();
    
    // Check if dropdown is visible
    await expect(page.locator('[role="menu"]')).toBeVisible();
    
    // Check for menu items
    await expect(page.locator('text=Profiel')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Uitloggen')).toBeVisible();
  });

  test('Search keyboard navigation', async ({ page }) => {
    // Open search
    await page.keyboard.press('Meta+k');
    
    // Type to get results
    await page.fill('input[placeholder*="Zoek"]', 'test');
    await page.waitForTimeout(500);
    
    // Use arrow keys to navigate
    await page.keyboard.press('ArrowDown');
    
    // Check if first result is highlighted
    await expect(page.locator('[role="option"][aria-selected="true"]')).toBeVisible();
    
    // Navigate down again
    await page.keyboard.press('ArrowDown');
    
    // Press Enter to select
    await page.keyboard.press('Enter');
    
    // Dialog should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});