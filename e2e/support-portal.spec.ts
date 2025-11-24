import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * E2E Tests voor Support Portal
 * 
 * Test alle support portal functionaliteit inclusief:
 * - Tickets aanmaken
 * - Tickets bekijken
 * - Berichten versturen
 * - Knowledge base doorzoeken
 * - Toegankelijkheid (WCAG 2.1 AA)
 */

test.describe('Support Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Login als student
    await page.goto('/login');
    await page.fill('[name="email"]', 'student@test.com');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test.describe('Ticket Creation', () => {
    test('should create a new support ticket', async ({ page }) => {
      // Navigate to support
      await page.goto('/support');
      await page.click('text=Nieuw Ticket');

      // Fill ticket form
      await page.fill('[name="subject"]', 'Probleem met inloggen');
      await page.fill('[name="description"]', 'Ik kan niet inloggen op mijn account. De pagina blijft laden.');
      await page.selectOption('[name="category"]', 'technical');
      await page.selectOption('[name="priority"]', 'high');

      // Submit
      await page.click('button:has-text("Ticket Aanmaken")');

      // Verify success
      await expect(page.locator('text=Ticket succesvol aangemaakt')).toBeVisible();
      
      // Verify ticket appears in list
      await expect(page.locator('text=Probleem met inloggen')).toBeVisible();
      
      // Verify ticket number format TK-YYYYMMDD-NNNNN
      const ticketNumber = await page.locator('[data-testid="ticket-number"]').first().textContent();
      expect(ticketNumber).toMatch(/TK-\d{8}-\d{5}/);
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/support');
      await page.click('text=Nieuw Ticket');

      // Try to submit without filling
      await page.click('button:has-text("Ticket Aanmaken")');

      // Verify validation errors
      await expect(page.locator('text=Onderwerp is verplicht')).toBeVisible();
      await expect(page.locator('text=Beschrijving is verplicht')).toBeVisible();
    });

    test('should enforce minimum description length', async ({ page }) => {
      await page.goto('/support');
      await page.click('text=Nieuw Ticket');

      await page.fill('[name="subject"]', 'Test');
      await page.fill('[name="description"]', 'Kort'); // Too short

      await page.click('button:has-text("Ticket Aanmaken")');

      await expect(page.locator('text=Beschrijving moet minimaal 20 tekens zijn')).toBeVisible();
    });
  });

  test.describe('Ticket Management', () => {
    test('should view ticket details', async ({ page }) => {
      await page.goto('/support');

      // Click on first ticket
      await page.click('[data-testid="ticket-item"]').first();

      // Verify details page
      await expect(page.locator('[data-testid="ticket-detail"]')).toBeVisible();
      await expect(page.locator('[data-testid="ticket-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="ticket-messages"]')).toBeVisible();
    });

    test('should send message in ticket', async ({ page }) => {
      await page.goto('/support');
      await page.click('[data-testid="ticket-item"]').first();

      // Send message
      await page.fill('[name="message"]', 'Ik heb meer informatie: het probleem treedt alleen op in Chrome.');
      await page.click('button:has-text("Verstuur")');

      // Verify message appears
      await expect(page.locator('text=het probleem treedt alleen op in Chrome')).toBeVisible();
    });

    test('should filter tickets by status', async ({ page }) => {
      await page.goto('/support');

      // Filter to open tickets
      await page.selectOption('[data-testid="status-filter"]', 'open');
      await page.waitForTimeout(500); // Wait for filter

      // Verify all visible tickets are open
      const statuses = await page.locator('[data-testid="ticket-status"]').allTextContents();
      statuses.forEach(status => {
        expect(status.toLowerCase()).toContain('open');
      });
    });

    test('should close ticket', async ({ page }) => {
      await page.goto('/support');
      await page.click('[data-testid="ticket-item"]').first();

      // Close ticket
      await page.click('button:has-text("Ticket Sluiten")');
      await page.click('button:has-text("Bevestigen")'); // Confirm dialog

      // Verify status changed
      await expect(page.locator('[data-testid="ticket-status"]:has-text("Gesloten")')).toBeVisible();
    });
  });

  test.describe('Knowledge Base', () => {
    test('should browse knowledge base articles', async ({ page }) => {
      await page.goto('/support');
      await page.click('text=Knowledge Base');

      // Verify articles are visible
      await expect(page.locator('[data-testid="kb-article"]')).toHaveCount(3, { timeout: 5000 });
    });

    test('should search knowledge base', async ({ page }) => {
      await page.goto('/support');
      await page.click('text=Knowledge Base');

      // Search
      await page.fill('[data-testid="kb-search"]', 'wachtwoord');
      await page.waitForTimeout(500);

      // Verify search results
      const articles = await page.locator('[data-testid="kb-article"]').allTextContents();
      articles.forEach(article => {
        expect(article.toLowerCase()).toContain('wachtwoord');
      });
    });

    test('should view article details', async ({ page }) => {
      await page.goto('/support');
      await page.click('text=Knowledge Base');
      
      // Click article
      await page.click('[data-testid="kb-article"]').first();

      // Verify article content
      await expect(page.locator('[data-testid="article-content"]')).toBeVisible();
      await expect(page.locator('[data-testid="article-helpful"]')).toBeVisible();
    });

    test('should mark article as helpful', async ({ page }) => {
      await page.goto('/support');
      await page.click('text=Knowledge Base');
      await page.click('[data-testid="kb-article"]').first();

      // Mark as helpful
      await page.click('button:has-text("Nuttig")');

      // Verify feedback
      await expect(page.locator('text=Bedankt voor je feedback')).toBeVisible();
    });

    test('should filter articles by category', async ({ page }) => {
      await page.goto('/support');
      await page.click('text=Knowledge Base');

      // Filter by category
      await page.selectOption('[data-testid="category-filter"]', 'technical');
      await page.waitForTimeout(500);

      // Verify filtered results
      const articles = await page.locator('[data-testid="kb-article"]').count();
      expect(articles).toBeGreaterThan(0);
    });
  });

  test.describe('Accessibility (WCAG 2.1 AA)', () => {
    test('support portal should be accessible', async ({ page }) => {
      await page.goto('/support');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('ticket creation form should be accessible', async ({ page }) => {
      await page.goto('/support');
      await page.click('text=Nieuw Ticket');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('knowledge base should be accessible', async ({ page }) => {
      await page.goto('/support');
      await page.click('text=Knowledge Base');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/support');

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Open first ticket

      // Verify navigation worked
      await expect(page.locator('[data-testid="ticket-detail"]')).toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/support');

      // Check for ARIA labels
      const newTicketButton = page.locator('button:has-text("Nieuw Ticket")');
      await expect(newTicketButton).toHaveAttribute('aria-label');

      const searchInput = page.locator('[data-testid="kb-search"]');
      if (await searchInput.count() > 0) {
        await expect(searchInput).toHaveAttribute('aria-label');
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone size

      await page.goto('/support');

      // Verify mobile layout
      await expect(page.locator('[data-testid="support-portal"]')).toBeVisible();
      
      // Mobile menu should be accessible
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      if (await mobileMenu.count() > 0) {
        await mobileMenu.click();
        await expect(page.locator('text=Nieuw Ticket')).toBeVisible();
      }
    });

    test('should work on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad size

      await page.goto('/support');
      await expect(page.locator('[data-testid="support-portal"]')).toBeVisible();
    });
  });
});
