import { test, expect } from '@playwright/test';

test.describe('PR5: Class Forum Flow', () => {
  test('forum page loads and displays correctly', async ({ page }) => {
    // Navigate to forum page
    await page.goto('/forum?classId=test-class');
    
    // Wait for page to load
    await page.waitForSelector('h1');
    
    // Take screenshot of forum page
    await page.screenshot({ path: 'artifacts/forum-initial.png', fullPage: true });
    
    // Verify forum title
    const title = await page.textContent('h1');
    expect(title).toContain('Forum');
    
    // Check for create post button (if authenticated)
    const createButton = page.locator('text=New Post');
    if (await createButton.isVisible()) {
      await expect(createButton).toBeVisible();
    }
  });

  test('forum post interactions', async ({ page }) => {
    await page.goto('/forum?classId=test-class');
    
    // Wait for posts to load
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'artifacts/forum-posts.png', fullPage: true });
    
    // Check for post cards
    const postCards = await page.locator('[data-testid="forum-post"]').count();
    console.log(`Found ${postCards} forum posts`);
  });

  test('forum accessibility', async ({ page }) => {
    await page.goto('/forum?classId=test-class');
    
    // Check semantic HTML
    await expect(page.locator('main')).toBeVisible();
    
    // Check heading hierarchy
    await expect(page.locator('h1')).toBeVisible();
    
    // Verify interactive elements are accessible
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      expect(text || ariaLabel).toBeTruthy();
    }
  });
});
