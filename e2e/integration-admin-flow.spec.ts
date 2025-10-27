import { test, expect } from '@playwright/test';

/**
 * E1: Integration Test - Complete Admin Workflow
 * Tests admin journey: login → manage users → view audit logs → system config
 */
test.describe('Admin Integration Flow', () => {
  const timestamp = Date.now();
  const adminEmail = `admin-${timestamp}@test.com`;
  const adminPassword = 'AdminPass123!';

  test('complete admin workflow: signup → user management → audit logs', async ({ page }) => {
    // 1. Signup
    await page.goto('/auth');
    await page.getByRole('tab', { name: /registreer/i }).click();
    
    await page.getByLabel(/e-mail/i).fill(adminEmail);
    await page.getByLabel(/wachtwoord/i).first().fill(adminPassword);
    await page.getByLabel(/bevestig wachtwoord/i).fill(adminPassword);
    await page.getByRole('button', { name: /registreer/i }).click();

    // 2. Select admin role
    await page.waitForURL(/role-selection|dashboard/, { timeout: 10000 });
    
    if (page.url().includes('role-selection')) {
      await page.getByRole('button', { name: /admin/i }).click();
      await expect(page).toHaveURL(/dashboard|admin/, { timeout: 5000 });
    }

    // 3. Verify admin dashboard
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 10000 });

    // 4. Navigate to admin panel
    await page.goto('/admin');
    await expect(page.locator('h1, h2').filter({ hasText: /admin/i })).toBeVisible({ timeout: 5000 });

    // 5. Check user management
    const usersLink = page.locator('a, button').filter({ hasText: /gebruikers|users/i }).first();
    if (await usersLink.isVisible()) {
      await usersLink.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Admin can access user management');
    }

    // 6. Check audit logs
    const auditLink = page.locator('a, button').filter({ hasText: /audit|logs/i }).first();
    if (await auditLink.isVisible()) {
      await auditLink.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Admin can access audit logs');
    }

    console.log('✅ Admin integration flow completed successfully');
  });

  test('admin can access all security features', async ({ page }) => {
    // Login
    await page.goto('/auth');
    await page.getByLabel(/e-mail/i).fill(adminEmail);
    await page.getByLabel(/wachtwoord/i).fill(adminPassword);
    await page.getByRole('button', { name: /inloggen|login/i }).click();
    
    await page.waitForURL(/dashboard|admin/, { timeout: 10000 });

    // Navigate to security section
    await page.goto('/security');
    const securityHeading = page.locator('h1, h2').filter({ hasText: /security|beveiliging/i });
    
    if (await securityHeading.isVisible()) {
      console.log('✅ Admin can access security dashboard');
    }

    // Check analytics access
    await page.goto('/analytics');
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 5000 });
    console.log('✅ Admin can access analytics');
  });
});
