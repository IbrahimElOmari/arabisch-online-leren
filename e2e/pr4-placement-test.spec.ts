import { test, expect } from '@playwright/test';

test.describe('PR4: Placement Test Flow', () => {
  test('complete placement test workflow', async ({ page }) => {
    // Navigate to placement test
    await page.goto('/placement-test?moduleId=test-module&enrollmentId=test-enrollment');
    
    // Wait for test to load
    await page.waitForSelector('h1');
    
    // Verify test title is present
    const title = await page.textContent('h1');
    expect(title).toBeTruthy();
    
    // Take screenshot of placement test page
    await page.screenshot({ path: 'artifacts/placement-test-initial.png', fullPage: true });
    
    // Answer questions if present
    const questionCards = await page.locator('[data-testid="question-card"]').count();
    
    if (questionCards > 0) {
      // Answer first question (multiple choice if present)
      const firstOption = page.locator('button[role="radio"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await page.screenshot({ path: 'artifacts/placement-test-answered.png', fullPage: true });
      }
    }
    
    // Verify navigation buttons are present
    await expect(page.locator('text=Submit')).toBeVisible();
  });

  test('placement test accessibility', async ({ page }) => {
    await page.goto('/placement-test?moduleId=test-module&enrollmentId=test-enrollment');
    
    // Check for semantic HTML
    await expect(page.locator('main')).toBeVisible();
    
    // Check for proper heading hierarchy
    await expect(page.locator('h1')).toBeVisible();
    
    // Verify buttons have accessible names
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
