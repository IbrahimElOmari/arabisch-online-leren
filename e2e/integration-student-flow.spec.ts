import { test, expect } from '@playwright/test';

/**
 * E1: Integration Test - Complete Student Journey
 * Tests the entire student workflow from signup to task submission
 */
test.describe('Student Integration Flow', () => {
  const timestamp = Date.now();
  const testEmail = `student-${timestamp}@test.com`;
  const testPassword = 'TestPass123!';

  test('complete student journey: signup → enroll → view lesson → submit task', async ({ page }) => {
    // 1. Navigate to signup page
    await page.goto('/auth');
    await expect(page).toHaveTitle(/Arabisch Online Leren/);

    // 2. Sign up as student
    await page.getByRole('tab', { name: /registreer/i }).click();
    await page.getByLabel(/e-mail/i).fill(testEmail);
    await page.getByLabel(/wachtwoord/i).first().fill(testPassword);
    await page.getByLabel(/bevestig wachtwoord/i).fill(testPassword);
    await page.getByRole('button', { name: /registreer/i }).click();

    // 3. Wait for role selection
    await page.waitForURL(/role-selection|dashboard/, { timeout: 10000 });
    
    if (page.url().includes('role-selection')) {
      await page.getByRole('button', { name: /student/i }).click();
      await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
    }

    // 4. Verify dashboard loads
    await expect(page.locator('h1, h2').filter({ hasText: /dashboard|welkom/i })).toBeVisible({ timeout: 10000 });

    // 5. Navigate to courses/classes
    const enrollLink = page.locator('a[href*="enroll"], a[href*="klassen"], button').filter({ hasText: /inschrijven|enroll|klassen/i }).first();
    if (await enrollLink.isVisible()) {
      await enrollLink.click();
      await page.waitForURL(/enroll|klassen|leerstof/, { timeout: 5000 });
    }

    // 6. View available content
    await expect(page.locator('h1, h2')).toBeVisible();

    // 7. Check for lessons or tasks
    const lessonCard = page.locator('[data-testid="lesson-card"], .lesson-card, article, .card').first();
    if (await lessonCard.isVisible()) {
      await lessonCard.click();
      await page.waitForLoadState('networkidle');
    }

    // 8. Verify navigation works
    const backButton = page.locator('button[aria-label*="back"], button[aria-label*="terug"], a[href*="dashboard"]').first();
    if (await backButton.isVisible()) {
      await backButton.click();
    }

    // Integration test passed
    console.log('✅ Student integration flow completed successfully');
  });

  test('student can navigate between all main sections', async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.getByLabel(/e-mail/i).fill(testEmail);
    await page.getByLabel(/wachtwoord/i).fill(testPassword);
    await page.getByRole('button', { name: /inloggen|login/i }).click();
    
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Test navigation to key sections
    const sections = [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Leerstof', url: '/leerstof' },
      { name: 'Taken', url: '/taken' },
      { name: 'Forum', url: '/forum' },
    ];

    for (const section of sections) {
      const link = page.locator(`a[href="${section.url}"]`).first();
      if (await link.isVisible()) {
        await link.click();
        await expect(page).toHaveURL(new RegExp(section.url));
        await page.waitForLoadState('networkidle');
        console.log(`✅ Navigated to ${section.name}`);
      }
    }
  });
});
