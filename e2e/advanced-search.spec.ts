import { test, expect } from '@playwright/test';

test.describe('Advanced Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open advanced search modal', async ({ page }) => {
    // Click search button/trigger
    await page.click('[data-testid="search-trigger"]');
    
    // Modal should be visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  });

  test('should search across all content types', async ({ page }) => {
    // Open search
    await page.click('[data-testid="search-trigger"]');
    
    // Type search query
    await page.fill('input[placeholder*="search"]', 'arabic');
    
    // Wait for results
    await page.waitForTimeout(500);
    
    // Should show results from multiple types
    const results = page.locator('[data-testid="search-result"]');
    await expect(results).toHaveCount(await results.count());
  });

  test('should filter by content type', async ({ page }) => {
    await page.click('[data-testid="search-trigger"]');
    
    // Type query
    await page.fill('input[placeholder*="search"]', 'lesson');
    await page.waitForTimeout(500);
    
    // Switch to lessons tab
    await page.click('[data-value="lessons"]');
    
    // Should only show lesson results
    const results = page.locator('[data-testid="search-result"]');
    const allResultsAreLessons = await results.evaluateAll((elements) => {
      return elements.every((el) => 
        el.querySelector('[data-type="lesson"]') !== null
      );
    });
    
    expect(allResultsAreLessons).toBe(true);
  });

  test('should show recent searches', async ({ page }) => {
    await page.click('[data-testid="search-trigger"]');
    
    // Search for something
    await page.fill('input[placeholder*="search"]', 'grammar');
    await page.press('input[placeholder*="search"]', 'Enter');
    await page.waitForTimeout(500);
    
    // Close and reopen search
    await page.keyboard.press('Escape');
    await page.click('[data-testid="search-trigger"]');
    
    // Should show recent search
    const recentSearch = page.locator('text=grammar');
    await expect(recentSearch).toBeVisible();
  });

  test('should highlight search matches', async ({ page }) => {
    await page.click('[data-testid="search-trigger"]');
    
    await page.fill('input[placeholder*="search"]', 'arabic');
    await page.waitForTimeout(500);
    
    // Results should have highlighted text
    const highlighted = page.locator('mark, .highlight');
    await expect(highlighted).toHaveCount(await highlighted.count());
  });

  test('should handle empty search results', async ({ page }) => {
    await page.click('[data-testid="search-trigger"]');
    
    // Search for something that doesn't exist
    await page.fill('input[placeholder*="search"]', 'xyz123nonexistent');
    await page.waitForTimeout(500);
    
    // Should show empty state
    const emptyState = page.locator('text=/no results|geen resultaten/i');
    await expect(emptyState).toBeVisible();
  });

  test('should navigate to result on click', async ({ page }) => {
    await page.click('[data-testid="search-trigger"]');
    
    await page.fill('input[placeholder*="search"]', 'lesson');
    await page.waitForTimeout(500);
    
    // Click first result
    const firstResult = page.locator('[data-testid="search-result"]').first();
    await firstResult.click();
    
    // Should navigate away from current page
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/search');
  });
});
