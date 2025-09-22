import { test, expect } from '@playwright/test';

test.describe('Payments Defer Mode', () => {
  test('pricing page shows coming soon when payments disabled', async ({ page }) => {
    await page.goto('/pricing');
    
    // Should show the "coming soon" notice
    await expect(page.getByText('Betalingen binnenkort beschikbaar')).toBeVisible();
    
    // Buttons should be disabled or show "Binnenkort Beschikbaar"
    const buttons = page.getByRole('button', { name: /Binnenkort Beschikbaar|Start/ });
    await expect(buttons.first()).toBeVisible();
  });

  test('clicking plan button redirects to coming soon page', async ({ page }) => {
    await page.goto('/pricing');
    
    // Click on a plan button
    await page.getByRole('button', { name: /Binnenkort Beschikbaar/ }).first().click();
    
    // Should navigate to coming-soon page
    await expect(page).toHaveURL('/billing/coming-soon');
    await expect(page.getByText('Betalingen Binnenkort Beschikbaar')).toBeVisible();
  });

  test('billing page shows coming soon when payments disabled', async ({ page }) => {
    // Navigate to auth first if needed
    await page.goto('/auth');
    
    // Fill in login form (mock user)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: /inloggen/i }).click();
    
    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');
    
    // Navigate to billing
    await page.goto('/billing');
    
    // Should show coming soon content
    await expect(page.getByText('Betalingen Binnenkort Beschikbaar')).toBeVisible();
    await expect(page.getByText('gratis toegankelijk')).toBeVisible();
  });

  test('coming soon page has proper navigation', async ({ page }) => {
    await page.goto('/billing/coming-soon');
    
    // Should show the page title
    await expect(page.getByText('Betalingen Binnenkort Beschikbaar')).toBeVisible();
    
    // Should have navigation buttons
    await expect(page.getByRole('button', { name: /Terug naar Dashboard/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Naar Startpagina/ })).toBeVisible();
    
    // Test navigation
    await page.getByRole('button', { name: /Terug naar Dashboard/ }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('webhook returns 501 when payments disabled', async ({ request }) => {
    const response = await request.post('/functions/v1/stripe-webhook', {
      data: {
        type: 'checkout.session.completed',
        data: {}
      }
    });
    
    expect(response.status()).toBe(501);
    
    const body = await response.json();
    expect(body.error).toBe('Payments are disabled');
  });
});