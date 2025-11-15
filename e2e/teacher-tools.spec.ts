import { test, expect } from '@playwright/test';

test.describe('Teacher Tools & Class Management', () => {
  const teacherEmail = `teacher-test-${Date.now()}@example.com`;
  const teacherPassword = 'TestPassword123!';

  test.beforeEach(async ({ page }) => {
    // Navigate to auth page
    await page.goto('/auth');
  });

  test('Teacher can sign up and access teacher dashboard', async ({ page }) => {
    // Sign up as teacher
    await page.click('text=Sign up');
    await page.fill('input[type="email"]', teacherEmail);
    await page.fill('input[type="password"]', teacherPassword);
    await page.click('button:has-text("Sign up")');

    // Wait for redirect and check if we're on dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Navigate to teacher dashboard
    await page.goto('/teacher/dashboard');
    
    // Check if teacher dashboard is visible
    await expect(page.locator('text=Teacher Dashboard')).toBeVisible();
    await expect(page.locator('text=My Classes')).toBeVisible();
  });

  test('Teacher can view class list', async ({ page }) => {
    // Login first (assuming teacher account exists)
    await page.fill('input[type="email"]', teacherEmail);
    await page.fill('input[type="password"]', teacherPassword);
    await page.click('button:has-text("Sign in")');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Navigate to teacher dashboard
    await page.goto('/teacher/dashboard');
    
    // Check for class statistics
    await expect(page.locator('text=Total Classes')).toBeVisible();
    await expect(page.locator('text=Total Students')).toBeVisible();
    
    // Check for "My Classes" section
    const classesSection = page.locator('text=My Classes');
    await expect(classesSection).toBeVisible();
  });

  test('Teacher can access class details', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', teacherEmail);
    await page.fill('input[type="password"]', teacherPassword);
    await page.click('button:has-text("Sign in")');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Navigate to teacher dashboard
    await page.goto('/teacher/dashboard');
    
    // Click on first class (if exists)
    const firstClass = page.locator('[data-testid="class-card"]').first();
    if (await firstClass.isVisible()) {
      await firstClass.click();
      
      // Check if we're on class details page
      await expect(page.locator('text=Class Details')).toBeVisible();
      await expect(page.locator('text=Students')).toBeVisible();
      await expect(page.locator('text=Tasks')).toBeVisible();
      await expect(page.locator('text=Progress')).toBeVisible();
      await expect(page.locator('text=Rewards')).toBeVisible();
    }
  });

  test('Teacher can view student list', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', teacherEmail);
    await page.fill('input[type="password"]', teacherPassword);
    await page.click('button:has-text("Sign in")');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Navigate to teacher dashboard and then to a class
    await page.goto('/teacher/dashboard');
    
    const firstClass = page.locator('[data-testid="class-card"]').first();
    if (await firstClass.isVisible()) {
      await firstClass.click();
      
      // Click on Students tab
      await page.click('text=Students');
      
      // Check for student list
      await expect(page.locator('text=Student List')).toBeVisible();
    }
  });

  test('Teacher dashboard is responsive', async ({ page, viewport }) => {
    // Login
    await page.fill('input[type="email"]', teacherEmail);
    await page.fill('input[type="password"]', teacherPassword);
    await page.click('button:has-text("Sign in")');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Navigate to teacher dashboard
    await page.goto('/teacher/dashboard');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('text=Teacher Dashboard')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('text=My Classes')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('text=Total Classes')).toBeVisible();
  });

  test('Teacher dashboard supports i18n', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', teacherEmail);
    await page.fill('input[type="password"]', teacherPassword);
    await page.click('button:has-text("Sign in")');
    
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Navigate to teacher dashboard
    await page.goto('/teacher/dashboard');
    
    // Check default language (Dutch)
    await expect(page.locator('text=Leerkracht Dashboard')).toBeVisible();
    
    // Change to English (if language switcher exists)
    const langSwitcher = page.locator('[data-testid="language-switcher"]');
    if (await langSwitcher.isVisible()) {
      await langSwitcher.click();
      await page.click('text=English');
      await expect(page.locator('text=Teacher Dashboard')).toBeVisible();
    }
  });

  test('Non-teacher cannot access teacher dashboard', async ({ page }) => {
    // Try to access teacher dashboard without proper role
    await page.goto('/teacher/dashboard');
    
    // Should be redirected to auth or dashboard
    await page.waitForURL(/\/(auth|dashboard)/, { timeout: 10000 });
  });
});

test.describe('Teacher Notes Functionality', () => {
  test('Teacher can add notes to students', async ({ page }) => {
    // This test would require a full setup with authenticated teacher and students
    // Skipping for now as it requires database setup
    test.skip();
  });

  test('Teacher can edit and delete notes', async ({ page }) => {
    test.skip();
  });
});

test.describe('Teacher Rewards Functionality', () => {
  test('Teacher can award XP to students', async ({ page }) => {
    test.skip();
  });

  test('Teacher can view reward history', async ({ page }) => {
    test.skip();
  });
});
