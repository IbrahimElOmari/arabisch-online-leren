import { test, expect } from '@playwright/test';

test.describe('Privacy Tools', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication as regular user
    await page.goto('/auth');
    await page.fill('[data-testid="email"]', 'user@test.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('/dashboard');
  });

  test('should access privacy tools', async ({ page }) => {
    // Navigate to privacy tools
    await page.goto('/account/privacy');
    
    // Check privacy tools page is loaded
    await expect(page.locator('h1')).toContainText('Privacy Tools');
    await expect(page.locator('text=Download mijn data')).toBeVisible();
    await expect(page.locator('text=Verwijder mijn account')).toBeVisible();
  });

  test('should download user data', async ({ page }) => {
    await page.goto('/account/privacy');
    
    // Set up download promise before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click download data button
    await page.click('[data-testid="download-data-button"]');
    
    // Wait for download to start
    const download = await downloadPromise;
    
    // Check download filename contains user data
    expect(download.suggestedFilename()).toMatch(/user-data.*\.json/);
  });

  test('should request account deletion', async ({ page }) => {
    await page.goto('/account/privacy');
    
    // Click delete account button
    await page.click('[data-testid="delete-account-button"]');
    
    // Check confirmation dialog appears
    await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
    
    // Confirm understanding
    await page.check('[data-testid="delete-understanding-checkbox"]');
    
    // Submit deletion request
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Check success message
    await expect(page.locator('text=Verwijderingsverzoek ingediend')).toBeVisible();
  });

  test('should show privacy policy and terms links', async ({ page }) => {
    await page.goto('/account/privacy');
    
    // Check privacy policy link works
    await page.click('text=Privacybeleid');
    await page.waitForURL('/privacy');
    await expect(page.locator('h1')).toContainText('Privacybeleid');
    
    // Go back and check terms link
    await page.goBack();
    await page.click('text=Algemene Voorwaarden');
    await page.waitForURL('/terms');
    await expect(page.locator('h1')).toContainText('Algemene Voorwaarden');
  });
});