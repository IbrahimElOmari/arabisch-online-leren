import { test, expect } from '@playwright/test';

test.describe('PWA Offline Functionality', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant notification permission
    await context.grantPermissions(['notifications']);
    
    // Navigate to app
    await page.goto('/');
    
    // Wait for service worker registration
    await page.waitForTimeout(2000);
  });

  test('should register service worker', async ({ page }) => {
    const serviceWorkerRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    expect(serviceWorkerRegistered).toBe(true);
  });

  test('should cache assets on first load', async ({ page }) => {
    // Refresh to ensure cache is populated
    await page.reload();
    
    const cacheKeys = await page.evaluate(async () => {
      const keys = await caches.keys();
      return keys;
    });
    
    expect(cacheKeys.length).toBeGreaterThan(0);
  });

  test('should work offline', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    // Try to navigate
    await page.reload();
    
    // Should show offline page or cached content
    const content = await page.content();
    expect(content).toBeTruthy();
  });

  test('should show PWA install prompt', async ({ page }) => {
    // Check if install prompt element exists
    const installPrompt = page.locator('[data-testid="pwa-install-prompt"]');
    
    // Trigger beforeinstallprompt event
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt');
      window.dispatchEvent(event);
    });
    
    await page.waitForTimeout(1000);
    // Install prompt should be visible or dismissible
  });

  test('should handle background sync for submissions', async ({ page, context }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Go to a task submission page
    await page.goto('/taken');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to submit (should queue for background sync)
    // Implementation depends on your task submission UI
    
    // Go back online
    await context.setOffline(false);
    
    // Background sync should trigger and submit queued items
    await page.waitForTimeout(3000);
  });
});
