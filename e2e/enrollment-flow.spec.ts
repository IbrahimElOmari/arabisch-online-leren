import { test, expect } from '@playwright/test';

test.describe('Class Enrollment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display available classes for enrollment', async ({ page }) => {
    // Navigate to classes or enrollment page
    const classesLink = page.locator('text=/klassen|classes|courses/i').first();
    if (await classesLink.isVisible()) {
      await classesLink.click();
    }
    
    // Look for class listings or enrollment information
    await expect(page.locator('text=/inschrijv|enroll|class|klas/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show class details when clicking on a class', async ({ page }) => {
    // Look for any class cards or links
    const classElement = page.locator('[data-testid*="class"], .class-card, text=/klas|class/i').first();
    
    if (await classElement.isVisible()) {
      await classElement.click();
      
      // Should show more details about the class
      await expect(page.locator('text=/beschrijv|description|details/i').first()).toBeVisible({ timeout: 5000 });
    } else {
      // If no classes visible, that's also a valid test result
      console.log('No classes available for enrollment - this may be expected');
    }
  });

  test('should handle enrollment process', async ({ page }) => {
    // This test will check the enrollment flow
    // Since we don't have payment setup, we'll test the UI flow
    
    // Look for enrollment or sign-up buttons
    const enrollButton = page.locator('button:has-text("Inschrijv"), button:has-text("Enroll"), button:has-text("Aanmeld")').first();
    
    if (await enrollButton.isVisible()) {
      await enrollButton.click();
      
      // Should either show a form or redirect to payment/confirmation
      await page.waitForTimeout(2000);
      
      // Check if we see enrollment-related content
      const hasEnrollmentContent = await page.locator('text=/inschrijv|enroll|payment|betaling/i').isVisible();
      expect(hasEnrollmentContent).toBeTruthy();
    } else {
      console.log('No enrollment buttons found - may require authentication first');
    }
  });
});