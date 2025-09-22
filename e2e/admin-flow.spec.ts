import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication as admin user
    await page.goto('/auth');
    await page.fill('[data-testid="email"]', 'admin@test.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('/dashboard');
  });

  test('should navigate to admin dashboard', async ({ page }) => {
    // Check if admin navigation is visible
    await expect(page.locator('text=Admin')).toBeVisible();
    
    // Navigate to admin area
    await page.click('text=Admin');
    await page.waitForURL('/admin/users');
    
    // Check admin dashboard is loaded
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    await expect(page.locator('text=Gebruikersbeheer')).toBeVisible();
  });

  test('should toggle maintenance mode', async ({ page }) => {
    await page.goto('/admin/operations');
    
    // Find maintenance toggle
    const maintenanceToggle = page.locator('[data-testid="maintenance-toggle"]');
    
    // Toggle maintenance mode on
    await maintenanceToggle.click();
    
    // Check that maintenance banner appears
    await expect(page.locator('[data-testid="maintenance-banner"]')).toBeVisible();
    await expect(page.locator('text=Onderhoudsmodus actief')).toBeVisible();
  });

  test('should create backup job', async ({ page }) => {
    await page.goto('/admin/operations');
    
    // Click create backup button
    await page.click('[data-testid="create-backup-button"]');
    
    // Fill backup note
    await page.fill('[data-testid="backup-note"]', 'Test backup job');
    
    // Submit backup job
    await page.click('[data-testid="submit-backup"]');
    
    // Check success message
    await expect(page.locator('text=Backup job aangemaakt')).toBeVisible();
    
    // Check backup appears in list
    await expect(page.locator('text=Test backup job')).toBeVisible();
  });

  test('should change user role', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Find first user in list
    const firstUser = page.locator('[data-testid="user-row"]').first();
    
    // Click role change button
    await firstUser.locator('text=Rol wijzigen').click();
    
    // Select new role
    await page.selectOption('[data-testid="role-select"]', 'leerkracht');
    
    // Add reason
    await page.fill('[data-testid="role-reason"]', 'Promoted to teacher');
    
    // Confirm change
    await page.click('[data-testid="confirm-role-change"]');
    
    // Check success message
    await expect(page.locator('text=Rol gewijzigd')).toBeVisible();
  });

  test('should view audit logs', async ({ page }) => {
    await page.goto('/admin/audit');
    
    // Check audit logs table is visible
    await expect(page.locator('[data-testid="audit-logs-table"]')).toBeVisible();
    
    // Check table headers
    await expect(page.locator('text=Actie')).toBeVisible();
    await expect(page.locator('text=Actor')).toBeVisible();
    await expect(page.locator('text=Entiteit')).toBeVisible();
    await expect(page.locator('text=Datum')).toBeVisible();
  });
});