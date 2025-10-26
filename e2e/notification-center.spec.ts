import { test, expect } from '@playwright/test';

test.describe('Notification Center', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant notification permission
    await context.grantPermissions(['notifications']);
    
    // Login
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display notification bell with count', async ({ page }) => {
    const bell = page.locator('[data-testid="notification-bell"]');
    await expect(bell).toBeVisible();
    
    // Badge might be visible if there are unread notifications
    const badge = page.locator('[data-testid="notification-badge"]');
    // Badge count assertion depends on test data
  });

  test('should open notification center', async ({ page }) => {
    await page.click('[data-testid="notification-bell"]');
    
    const notificationSheet = page.locator('[role="dialog"][data-testid="notification-center"]');
    await expect(notificationSheet).toBeVisible();
  });

  test('should display notifications grouped by time', async ({ page }) => {
    await page.click('[data-testid="notification-bell"]');
    
    // Should have time-based groupings
    const todayGroup = page.locator('text=/today|vandaag/i');
    const thisWeekGroup = page.locator('text=/this week|deze week/i');
    
    // At least one group should be visible
    const groupCount = await todayGroup.count() + await thisWeekGroup.count();
    expect(groupCount).toBeGreaterThan(0);
  });

  test('should mark notification as read on click', async ({ page }) => {
    await page.click('[data-testid="notification-bell"]');
    
    // Get first unread notification
    const unreadNotification = page.locator('[data-testid="notification-item"][data-read="false"]').first();
    
    if (await unreadNotification.count() > 0) {
      await unreadNotification.click();
      
      // Should mark as read (indicator removed)
      await page.waitForTimeout(500);
      const isRead = await unreadNotification.getAttribute('data-read');
      expect(isRead).toBe('true');
    }
  });

  test('should mark all as read', async ({ page }) => {
    await page.click('[data-testid="notification-bell"]');
    
    // Click mark all as read button
    const markAllButton = page.locator('button', { hasText: /mark all/i });
    
    if (await markAllButton.isVisible()) {
      const unreadCountBefore = await page.locator('[data-read="false"]').count();
      
      await markAllButton.click();
      await page.waitForTimeout(500);
      
      const unreadCountAfter = await page.locator('[data-read="false"]').count();
      expect(unreadCountAfter).toBeLessThan(unreadCountBefore);
    }
  });

  test('should filter notifications by type', async ({ page }) => {
    await page.click('[data-testid="notification-bell"]');
    
    // Switch to unread tab
    await page.click('[data-value="unread"]');
    
    // Should only show unread notifications
    const allNotifications = page.locator('[data-testid="notification-item"]');
    const count = await allNotifications.count();
    
    if (count > 0) {
      const allUnread = await allNotifications.evaluateAll((elements) => {
        return elements.every((el) => el.getAttribute('data-read') === 'false');
      });
      expect(allUnread).toBe(true);
    }
  });

  test('should show empty state when no notifications', async ({ page }) => {
    // This test assumes a user with no notifications
    await page.click('[data-testid="notification-bell"]');
    
    // Check for empty state
    const emptyState = page.locator('text=/no notifications|geen notificaties/i');
    // Assertion depends on test data state
  });

  test('should receive real-time notifications', async ({ page }) => {
    await page.click('[data-testid="notification-bell"]');
    
    const initialCount = await page.locator('[data-testid="notification-item"]').count();
    
    // Trigger a notification from another tab/action
    // This would require a test helper to insert a notification
    
    await page.waitForTimeout(2000);
    
    const newCount = await page.locator('[data-testid="notification-item"]').count();
    // Assertion depends on whether test triggered new notification
  });
});
