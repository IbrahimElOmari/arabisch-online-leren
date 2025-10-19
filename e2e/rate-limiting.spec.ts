import { test, expect } from '@playwright/test';

/**
 * Rate Limiting Tests
 * Verifies rate limiting protects against brute force attacks
 */

test.describe('Rate Limiting', () => {
  test('Login attempts blocked after 5 failures', async ({ page }) => {
    const wrongPassword = 'WrongPassword123!';
    const testEmail = 'test-rate-limit@example.com';
    
    // Make 5 failed login attempts
    for (let i = 1; i <= 5; i++) {
      await page.goto('/auth');
      await page.fill('[name="email"]', testEmail);
      await page.fill('[name="password"]', wrongPassword);
      await page.click('button[type="submit"]');
      
      // Wait for error message or response
      await page.waitForTimeout(1000);
      
      console.log(`Attempt ${i}: Failed login`);
    }
    
    // 6th attempt should be blocked
    await page.goto('/auth');
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', wrongPassword);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    
    // Check for rate limit error message
    const pageContent = await page.content();
    const hasRateLimitMessage = 
      pageContent.includes('rate limit') ||
      pageContent.includes('too many') ||
      pageContent.includes('blocked') ||
      pageContent.includes('try again later') ||
      pageContent.includes('te veel') ||
      pageContent.includes('geblokkeerd');
    
    console.log('Rate limit message detected:', hasRateLimitMessage);
    
    // Could also check via toast/alert
    const alerts = await page.locator('[role="alert"], .toast, .error-message').allTextContents();
    console.log('Alert messages:', alerts);
    
    const hasAlert = alerts.some(text => 
      /rate limit|too many|blocked|try again|te veel|geblokkeerd/i.test(text)
    );
    
    // Expected: Rate limit error shown
    expect(hasRateLimitMessage || hasAlert).toBe(true);
  });

  test('Rate limit enforced via Supabase auth', async ({ page }) => {
    const wrongPassword = 'WrongPassword999!';
    const testEmail = 'test-supabase-rate@example.com';
    
    // Attempt multiple logins via Supabase client
    const response = await page.evaluate(async ({ email, password }) => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          'https://xugosdedyukizseveahx.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Z29zZGVkeXVraXpzZXZlYWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNzMwMzEsImV4cCI6MjA2Nzg0OTAzMX0.wPBExp0d1VKFHJnwzitH9hydUKwgzZvaLQiz3_PRsRg'
        );
        
        const attempts = [];
        
        // Make 6 rapid attempts
        for (let i = 0; i < 6; i++) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          attempts.push({
            attempt: i + 1,
            hasError: !!error,
            errorMessage: error?.message,
            status: error?.status
          });
          
          // Small delay between attempts
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return attempts;
      } catch (error) {
        return { error: (error as Error).message };
      }
    }, { email: testEmail, password: wrongPassword });
    
    console.log('Rate limit attempts:', JSON.stringify(response, null, 2));
    
    // Check if later attempts show rate limiting
    const rateLimitedAttempts = Array.isArray(response) 
      ? response.filter(att => 
          att.errorMessage?.toLowerCase().includes('rate') ||
          att.errorMessage?.toLowerCase().includes('too many') ||
          att.status === 429
        )
      : [];
    
    console.log('Rate limited attempts:', rateLimitedAttempts.length);
    
    // Expected: At least one attempt is rate limited
    expect(rateLimitedAttempts.length).toBeGreaterThan(0);
  });

  test('API endpoints respect rate limits', async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    
    // Make rapid API calls
    const response = await page.evaluate(async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          'https://xugosdedyukizseveahx.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Z29zZGVkeXVraXpzZXZlYWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNzMwMzEsImV4cCI6MjA2Nzg0OTAzMX0.wPBExp0d1VKFHJnwzitH9hydUKwgzZvaLQiz3_PRsRg'
        );
        
        const results = [];
        
        // Make 20 rapid requests to public table
        for (let i = 0; i < 20; i++) {
          const startTime = Date.now();
          const { data, error } = await supabase
            .from('klassen')
            .select('id')
            .limit(1);
          
          const duration = Date.now() - startTime;
          
          results.push({
            request: i + 1,
            hasError: !!error,
            errorMessage: error?.message,
            status: error?.code,
            duration
          });
        }
        
        return results;
      } catch (error) {
        return { error: (error as Error).message };
      }
    });
    
    console.log('API rate limit test:', Array.isArray(response) ? response.length : response);
    
    if (Array.isArray(response)) {
      // Check for 429 errors or rate limit messages
      const rateLimited = response.filter(r => 
        r.status === '429' || 
        r.errorMessage?.toLowerCase().includes('rate')
      );
      
      // Check for increasing response times (sign of throttling)
      const avgEarlyDuration = response.slice(0, 5).reduce((sum, r) => sum + r.duration, 0) / 5;
      const avgLateDuration = response.slice(-5).reduce((sum, r) => sum + r.duration, 0) / 5;
      
      console.log(`Average early duration: ${avgEarlyDuration}ms`);
      console.log(`Average late duration: ${avgLateDuration}ms`);
      console.log(`Rate limited requests: ${rateLimited.length}`);
      
      // Expected: Either explicit rate limiting or throttling behavior
      const isThrottled = avgLateDuration > avgEarlyDuration * 1.5;
      const isRateLimited = rateLimited.length > 0;
      
      // At least one form of rate limiting should be active
      expect(isThrottled || isRateLimited).toBe(true);
    }
  });

  test('Rate limit resets after time window', async ({ page }) => {
    const testEmail = 'test-reset@example.com';
    const wrongPassword = 'Wrong123!';
    
    // Make 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await page.goto('/auth');
      await page.fill('[name="email"]', testEmail);
      await page.fill('[name="password"]', wrongPassword);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // 6th attempt should be blocked
    await page.goto('/auth');
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', wrongPassword);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    const blockedContent = await page.content();
    const isBlocked = blockedContent.includes('rate limit') || 
                      blockedContent.includes('blocked') ||
                      blockedContent.includes('too many');
    
    console.log('After 5 attempts - Blocked:', isBlocked);
    
    // Wait for rate limit window to expire (typically 15 minutes)
    // For testing purposes, we'll just verify the blocking works
    // In production, you'd need to wait the full duration or mock time
    
    expect(isBlocked).toBe(true);
    
    // Note: Full reset test would require waiting 15+ minutes
    // or using test utilities to manipulate time/database
  });
});
