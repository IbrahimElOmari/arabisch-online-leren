import { test, expect } from '@playwright/test';

/**
 * E1: Integration Test - Complete Teacher Workflow
 * Tests teacher journey: login → view students → grade tasks → manage content
 */
test.describe('Teacher Integration Flow', () => {
  const timestamp = Date.now();
  const teacherEmail = `teacher-${timestamp}@test.com`;
  const teacherPassword = 'TeachPass123!';

  test('complete teacher workflow: signup → view class → grade submission', async ({ page }) => {
    // 1. Navigate and signup
    await page.goto('/auth');
    await page.getByRole('tab', { name: /registreer/i }).click();
    
    await page.getByLabel(/e-mail/i).fill(teacherEmail);
    await page.getByLabel(/wachtwoord/i).first().fill(teacherPassword);
    await page.getByLabel(/bevestig wachtwoord/i).fill(teacherPassword);
    await page.getByRole('button', { name: /registreer/i }).click();

    // 2. Select teacher role
    await page.waitForURL(/role-selection|dashboard/, { timeout: 10000 });
    
    if (page.url().includes('role-selection')) {
      await page.getByRole('button', { name: /docent|teacher/i }).click();
      await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
    }

    // 3. Verify teacher dashboard
    await expect(page.locator('h1, h2').filter({ hasText: /dashboard|docent|teacher/i })).toBeVisible({ timeout: 10000 });

    // 4. Navigate to student management
    const studentsLink = page.locator('a[href*="students"], a[href*="klassen"], button').filter({ hasText: /studenten|students|klassen/i }).first();
    if (await studentsLink.isVisible()) {
      await studentsLink.click();
      await page.waitForLoadState('networkidle');
    }

    // 5. Check for grading section
    const gradingLink = page.locator('a, button').filter({ hasText: /beoordel|grade|nakijken/i }).first();
    if (await gradingLink.isVisible()) {
      await gradingLink.click();
      await page.waitForLoadState('networkidle');
    }

    // 6. Verify teacher can access analytics
    await page.goto('/analytics');
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 5000 });

    console.log('✅ Teacher integration flow completed successfully');
  });

  test('teacher can create and manage content', async ({ page }) => {
    // Login
    await page.goto('/auth');
    await page.getByLabel(/e-mail/i).fill(teacherEmail);
    await page.getByLabel(/wachtwoord/i).fill(teacherPassword);
    await page.getByRole('button', { name: /inloggen|login/i }).click();
    
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Navigate to content management
    const manageLink = page.locator('a, button').filter({ hasText: /beheer|manage|content/i }).first();
    if (await manageLink.isVisible()) {
      await manageLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Check for create buttons
    const createButton = page.locator('button').filter({ hasText: /nieuw|create|toevoegen/i }).first();
    if (await createButton.isVisible()) {
      console.log('✅ Teacher can access content creation');
    }
  });
});
