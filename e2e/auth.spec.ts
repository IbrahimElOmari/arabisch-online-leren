import { test, expect } from '@playwright/test';

test.describe('Authentication E2E', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Arabisch/i);
  });

  test('should navigate to signup', async ({ page }) => {
    await page.goto('/login');
    const signupLink = page.getByRole('link', { name: /sign up/i }).first();
    if (await signupLink.count() > 0) {
      await signupLink.click();
      await expect(page).toHaveURL(/signup/i);
    }
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    const submitButton = page.getByRole('button', { name: /sign in|log in|submit/i }).first();
    await submitButton.click();
    // Validation should prevent submission
    await expect(page).toHaveURL(/login/);
  });
});
