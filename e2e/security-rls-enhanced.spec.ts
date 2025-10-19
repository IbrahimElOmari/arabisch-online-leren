import { test, expect } from '@playwright/test';

/**
 * Enhanced RLS Security Tests
 * Verifies Row Level Security policies prevent unauthorized data access
 */

test.describe('RLS Security Enforcement', () => {
  test('Student A cannot access Student B submissions', async ({ page }) => {
    // Login as Student A
    await page.goto('/auth');
    await page.fill('[name="email"]', 'student-a@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await page.waitForURL('/dashboard', { timeout: 5000 });
    
    // Navigate to tasks
    await page.goto('/dashboard');
    await expect(page.locator('h1, h2')).toContainText(/dashboard|overzicht/i);
    
    // Try to fetch all submissions via DevTools console
    const response = await page.evaluate(async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          'https://xugosdedyukizseveahx.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Z29zZGVkeXVraXpzZXZlYWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNzMwMzEsImV4cCI6MjA2Nzg0OTAzMX0.wPBExp0d1VKFHJnwzitH9hydUKwgzZvaLQiz3_PRsRg'
        );
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // Attempt to fetch ALL submissions (should be filtered by RLS)
        const { data, error, count } = await supabase
          .from('task_submissions')
          .select('*', { count: 'exact' });
        
        return { 
          count: data?.length || 0, 
          error: error?.message,
          userId: user?.id,
          submissions: data
        };
      } catch (error) {
        return { error: (error as Error).message };
      }
    });
    
    console.log('RLS Test Result:', response);
    
    // Verify: Only own submissions visible (should not see all students' data)
    expect(response.count).toBeGreaterThanOrEqual(0);
    
    // If submissions exist, verify they all belong to current user
    if (response.count > 0 && response.submissions) {
      const allOwnSubmissions = response.submissions.every(
        (sub: { student_id: string }) => sub.student_id === response.userId
      );
      expect(allOwnSubmissions).toBe(true);
    }
  });
  
  test('Teacher can only see own class data', async ({ page }) => {
    // Login as Teacher A
    await page.goto('/auth');
    await page.fill('[name="email"]', 'teacher-a@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 });
    
    // Try to fetch all classes via console
    const response = await page.evaluate(async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          'https://xugosdedyukizseveahx.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Z29zZGVkeXVraXpzZXZlYWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNzMwMzEsImV4cCI6MjA2Nzg0OTAzMX0.wPBExp0d1VKFHJnwzitH9hydUKwgzZvaLQiz3_PRsRg'
        );
        
        const { data: { user } } = await supabase.auth.getUser();
        
        // Attempt to fetch ALL classes
        const { data, error } = await supabase
          .from('klassen')
          .select('*');
        
        return { 
          count: data?.length || 0,
          userId: user?.id,
          classes: data,
          error: error?.message
        };
      } catch (error) {
        return { error: (error as Error).message };
      }
    });
    
    console.log('Teacher RLS Test Result:', response);
    
    // Verify: Only own classes visible
    expect(response.count).toBeGreaterThanOrEqual(0);
    
    // If classes exist, verify they all belong to current teacher
    if (response.count > 0 && response.classes) {
      const allOwnClasses = response.classes.every(
        (cls: { teacher_id: string }) => cls.teacher_id === response.userId
      );
      expect(allOwnClasses).toBe(true);
    }
  });

  test('Student cannot access admin tables', async ({ page }) => {
    // Login as student
    await page.goto('/auth');
    await page.fill('[name="email"]', 'student@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 5000 });
    
    // Try to access audit logs (admin-only table)
    const response = await page.evaluate(async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          'https://xugosdedyukizseveahx.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Z29zZGVkeXVraXpzZXZlYWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNzMwMzEsImV4cCI6MjA2Nzg0OTAzMX0.wPBExp0d1VKFHJnwzitH9hydUKwgzZvaLQiz3_PRsRg'
        );
        
        const { data, error } = await supabase
          .from('audit_log')
          .select('*');
        
        return { 
          hasData: !!data && data.length > 0,
          error: error?.message,
          code: error?.code
        };
      } catch (error) {
        return { error: (error as Error).message };
      }
    });
    
    console.log('Admin Table Access Test:', response);
    
    // Expected: Error or empty result (no access)
    expect(response.hasData).toBe(false);
  });

  test('Cross-class data isolation', async ({ page }) => {
    // Login as student enrolled in Class A
    await page.goto('/auth');
    await page.fill('[name="email"]', 'student-class-a@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 5000 });
    
    // Try to access forum posts from Class B
    const response = await page.evaluate(async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          'https://xugosdedyukizseveahx.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Z29zZGVkeXVraXpzZXZlYWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNzMwMzEsImV4cCI6MjA2Nzg0OTAzMX0.wPBExp0d1VKFHJnwzitH9hydUKwgzZvaLQiz3_PRsRg'
        );
        
        // Get enrolled classes
        const { data: enrollments } = await supabase
          .from('inschrijvingen')
          .select('class_id');
        
        const enrolledClassIds = enrollments?.map(e => e.class_id) || [];
        
        // Try to fetch ALL forum posts
        const { data: allPosts } = await supabase
          .from('forum_posts')
          .select('class_id');
        
        // Check if any posts from non-enrolled classes are visible
        const unauthorizedPosts = allPosts?.filter(
          post => !enrolledClassIds.includes(post.class_id)
        ) || [];
        
        return {
          enrolledClasses: enrolledClassIds.length,
          totalVisiblePosts: allPosts?.length || 0,
          unauthorizedPostsCount: unauthorizedPosts.length
        };
      } catch (error) {
        return { error: (error as Error).message };
      }
    });
    
    console.log('Cross-class Isolation Test:', response);
    
    // Verify: No posts from other classes visible
    expect(response.unauthorizedPostsCount).toBe(0);
  });
});
