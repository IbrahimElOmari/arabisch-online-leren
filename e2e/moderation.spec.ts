import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * E2E Tests voor Moderatie Portal
 * 
 * Test alle moderatie functionaliteit inclusief:
 * - Waarschuwingen geven
 * - Users bannen/ontbannen
 * - Reputatie beheren
 * - Content moderatie
 * - Toegankelijkheid (WCAG 2.1 AA)
 */

test.describe('Moderation Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Login als admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@test.com');
    await page.fill('[name="password"]', 'adminpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test.describe('User Warnings', () => {
    test('should issue warning to user', async ({ page }) => {
      await page.goto('/admin/moderation');
      await page.click('text=Waarschuwingen');

      // Search for user
      await page.fill('[data-testid="user-search"]', 'student@test.com');
      await page.click('button:has-text("Zoeken")');

      // Issue warning
      await page.click('button:has-text("Waarschuwing Geven")');
      await page.fill('[name="reason"]', 'Ongepaste taal in forum');
      await page.selectOption('[name="severity"]', 'minor');
      await page.click('button:has-text("Bevestigen")');

      // Verify success
      await expect(page.locator('text=Waarschuwing succesvol gegeven')).toBeVisible();
    });

    test('should view user warning history', async ({ page }) => {
      await page.goto('/admin/moderation');
      await page.click('text=Waarschuwingen');

      // Search and view history
      await page.fill('[data-testid="user-search"]', 'student@test.com');
      await page.click('button:has-text("Zoeken")');
      await page.click('button:has-text("Geschiedenis")');

      // Verify warning list
      await expect(page.locator('[data-testid="warning-item"]')).toHaveCount(1, { timeout: 5000 });
    });

    test('should filter warnings by severity', async ({ page }) => {
      await page.goto('/admin/moderation');
      await page.click('text=Waarschuwingen');

      await page.selectOption('[data-testid="severity-filter"]', 'major');
      await page.waitForTimeout(500);

      const warnings = await page.locator('[data-testid="warning-severity"]').allTextContents();
      warnings.forEach(severity => {
        expect(severity.toLowerCase()).toContain('major');
      });
    });
  });

  test.describe('Ban Management', () => {
    test('should ban user temporarily', async ({ page }) => {
      await page.goto('/admin/moderation');
      await page.click('text=Bans');

      // Search user
      await page.fill('[data-testid="user-search"]', 'problematic@test.com');
      await page.click('button:has-text("Zoeken")');

      // Ban user
      await page.click('button:has-text("Ban Gebruiker")');
      await page.fill('[name="reason"]', 'Herhaaldelijk spam plaatsen');
      await page.selectOption('[name="ban_type"]', 'temporary');
      await page.fill('[name="banned_until"]', '2025-12-31');
      await page.click('button:has-text("Ban Bevestigen")');

      // Verify success
      await expect(page.locator('text=Gebruiker succesvol gebanned')).toBeVisible();
    });

    test('should ban user permanently', async ({ page }) => {
      await page.goto('/admin/moderation');
      await page.click('text=Bans');

      await page.fill('[data-testid="user-search"]', 'serious@violator.com');
      await page.click('button:has-text("Zoeken")');

      await page.click('button:has-text("Ban Gebruiker")');
      await page.fill('[name="reason"]', 'Ernstige overtreding: bedreigingen');
      await page.selectOption('[name="ban_type"]', 'permanent');
      await page.click('button:has-text("Ban Bevestigen")');

      await expect(page.locator('text=Permanente ban toegepast')).toBeVisible();
    });

    test('should lift active ban', async ({ page }) => {
      await page.goto('/admin/moderation');
      await page.click('text=Bans');
      await page.click('text=Actieve Bans');

      // Lift first ban
      await page.click('[data-testid="lift-ban-button"]').first();
      await page.fill('[name="lift_reason"]', 'Gebruiker heeft zijn excuses aangeboden');
      await page.click('button:has-text("Ban Opheffen")');

      // Verify
      await expect(page.locator('text=Ban succesvol opgeheven')).toBeVisible();
    });

    test('should view ban history', async ({ page }) => {
      await page.goto('/admin/moderation');
      await page.click('text=Bans');

      await page.fill('[data-testid="user-search"]', 'student@test.com');
      await page.click('button:has-text("Zoeken")');
      await page.click('button:has-text("Ban Geschiedenis")');

      // Verify history displayed
      await expect(page.locator('[data-testid="ban-history-item"]')).toHaveCount(1, { timeout: 5000 });
    });

    test('should filter active bans', async ({ page }) => {
      await page.goto('/admin/moderation');
      await page.click('text=Bans');
      await page.click('text=Actieve Bans');

      // Verify all shown bans are active
      const statuses = await page.locator('[data-testid="ban-status"]').allTextContents();
      statuses.forEach(status => {
        expect(status.toLowerCase()).toContain('actief');
      });
    });
  });

  test.describe('Reputation Management', () => {
    test('should view user reputation', async ({ page }) => {
      await page.goto('/admin/moderation');
      await page.click('text=Reputatie');

      // Search user
      await page.fill('[data-testid="user-search"]', 'student@test.com');
      await page.click('button:has-text("Zoeken")');

      // Verify reputation displayed
      await expect(page.locator('[data-testid="reputation-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="helpful-posts"]')).toBeVisible();
      await expect(page.locator('[data-testid="warning-count"]')).toBeVisible();
    });

    test('should update user reputation', async ({ page }) => {
      await page.goto('/admin/moderation');
      await page.click('text=Reputatie');

      await page.fill('[data-testid="user-search"]', 'helpful@student.com');
      await page.click('button:has-text("Zoeken")');

      // Adjust reputation
      await page.click('button:has-text("Reputatie Aanpassen")');
      await page.fill('[name="reputation_adjustment"]', '10');
      await page.fill('[name="reason"]', 'Uitstekende bijdrage aan forum');
      await page.click('button:has-text("Toepassen")');

      // Verify
      await expect(page.locator('text=Reputatie succesvol aangepast')).toBeVisible();
    });

    test('should view reputation leaderboard', async ({ page }) => {
      await page.goto('/admin/moderation');
      await page.click('text=Reputatie');
      await page.click('text=Leaderboard');

      // Verify leaderboard
      await expect(page.locator('[data-testid="leaderboard-item"]')).toHaveCount(10, { timeout: 5000 });
      
      // Verify sorted by reputation
      const scores = await page.locator('[data-testid="reputation-score"]').allTextContents();
      const numericScores = scores.map(s => parseInt(s));
      for (let i = 0; i < numericScores.length - 1; i++) {
        expect(numericScores[i]).toBeGreaterThanOrEqual(numericScores[i + 1]);
      }
    });
  });

  test.describe('Content Moderation', () => {
    test('should flag inappropriate content', async ({ page }) => {
      await page.goto('/admin/moderation');
      await page.click('text=Content');

      // View flagged content
      await page.click('text=Gerapporteerde Content');

      // Review first item
      await page.click('[data-testid="review-content"]').first();

      // Take action
      await page.click('button:has-text("Verwijderen")');
      await page.fill('[name="reason"]', 'Ongepaste inhoud');
      await page.click('button:has-text("Bevestigen")');

      // Verify
      await expect(page.locator('text=Content succesvol verwijderd')).toBeVisible();
    });

    test('should approve reported content', async ({ page }) => {
      await page.goto('/admin/moderation');
      await page.click('text=Content');
      await page.click('text=Gerapporteerde Content');

      await page.click('[data-testid="review-content"]').first();
      await page.click('button:has-text("Goedkeuren")');

      await expect(page.locator('text=Content goedgekeurd')).toBeVisible();
    });

    test('should view moderation history', async ({ page }) => {
      await page.goto('/admin/moderation');
      await page.click('text=Content');
      await page.click('text=Moderatie Geschiedenis');

      // Verify history
      await expect(page.locator('[data-testid="moderation-action"]')).toHaveCount(5, { timeout: 5000 });
    });
  });

  test.describe('Accessibility (WCAG 2.1 AA)', () => {
    test('moderation portal should be accessible', async ({ page }) => {
      await page.goto('/admin/moderation');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('warning dialog should be accessible', async ({ page }) => {
      await page.goto('/admin/moderation');
      await page.click('text=Waarschuwingen');
      await page.fill('[data-testid="user-search"]', 'test@test.com');
      await page.click('button:has-text("Zoeken")');
      await page.click('button:has-text("Waarschuwing Geven")');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('ban management should be accessible', async ({ page }) => {
      await page.goto('/admin/moderation');
      await page.click('text=Bans');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/admin/moderation');

      // Tab through tabs
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      // Verify navigation
      await expect(page.locator('[data-testid="moderation-section"]')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/admin/moderation');
      await expect(page.locator('[data-testid="moderation-portal"]')).toBeVisible();
    });

    test('should work on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/admin/moderation');
      await expect(page.locator('[data-testid="moderation-portal"]')).toBeVisible();
    });
  });

  test.describe('Bulk Actions', () => {
    test('should perform bulk warning', async ({ page }) => {
      await page.goto('/admin/moderation');
      await page.click('text=Bulk Acties');

      // Select multiple users
      await page.click('[data-testid="user-checkbox"]').nth(0);
      await page.click('[data-testid="user-checkbox"]').nth(1);
      await page.click('[data-testid="user-checkbox"]').nth(2);

      // Apply bulk warning
      await page.click('button:has-text("Bulk Waarschuwing")');
      await page.fill('[name="reason"]', 'Overtreding van gedragsregels');
      await page.selectOption('[name="severity"]', 'minor');
      await page.click('button:has-text("Toepassen")');

      await expect(page.locator('text=3 waarschuwingen gegeven')).toBeVisible();
    });
  });
});
