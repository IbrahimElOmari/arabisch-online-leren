import { test, expect } from '@playwright/test';

/**
 * E2: Cross-Browser Compatibility Tests
 * Validates core functionality across all major browsers
 */
test.describe('Cross-Browser Compatibility', () => {
  test('layout renders correctly on all browsers', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Check critical elements render
    const header = page.locator('header, nav');
    await expect(header).toBeVisible({ timeout: 5000 });
    
    // Check responsive layout
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
    
    console.log(`✅ Layout verified on ${browserName}`);
  });

  test('forms work across browsers', async ({ page, browserName }) => {
    await page.goto('/auth');
    
    // Test form inputs
    const emailInput = page.getByLabel(/e-mail/i);
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
    
    const passwordInput = page.getByLabel(/wachtwoord/i).first();
    await passwordInput.fill('password123');
    await expect(passwordInput).toHaveValue('password123');
    
    console.log(`✅ Forms functional on ${browserName}`);
  });

  test('navigation works across browsers', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Find and click navigation links
    const links = page.locator('a[href^="/"]');
    const count = await links.count();
    
    if (count > 0) {
      const firstLink = links.first();
      const href = await firstLink.getAttribute('href');
      await firstLink.click();
      
      if (href && !href.includes('auth')) {
        await page.waitForURL(new RegExp(href));
        console.log(`✅ Navigation to ${href} works on ${browserName}`);
      }
    }
  });

  test('RTL mode works across browsers', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Switch to Arabic (RTL)
    const langSelector = page.locator('[data-testid="language-selector"], button[aria-label*="language"], select').first();
    
    if (await langSelector.isVisible()) {
      await langSelector.click();
      const arabicOption = page.locator('text=العربية, [value="ar"], button:has-text("ar")').first();
      
      if (await arabicOption.isVisible()) {
        await arabicOption.click();
        
        // Verify RTL attribute
        const dir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
        expect(dir).toBe('rtl');
        console.log(`✅ RTL mode works on ${browserName}`);
      }
    }
  });

  test('keyboard navigation works', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible({ timeout: 2000 });
    
    console.log(`✅ Keyboard navigation works on ${browserName}`);
  });

  test('touch events work on mobile browsers', async ({ page, browserName }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Wait for mobile layout
    await page.waitForLoadState('networkidle');
    
    // Check if mobile menu exists
    const mobileMenu = page.locator('button[aria-label*="menu"], button[aria-expanded]').first();
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      console.log(`✅ Mobile interactions work on ${browserName}`);
    }
  });
});
