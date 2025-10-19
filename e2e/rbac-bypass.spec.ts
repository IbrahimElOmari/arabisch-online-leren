import { test, expect } from '@playwright/test';

/**
 * RBAC Bypass Prevention Tests
 * Verifies role-based access control cannot be bypassed
 */

test.describe('RBAC Bypass Prevention', () => {
  test('Student cannot access /admin route', async ({ page }) => {
    // Login as student
    await page.goto('/auth');
    await page.fill('[name="email"]', 'student@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 5000 });
    
    // Attempt to navigate to /admin
    const response = await page.goto('/admin');
    await page.waitForTimeout(2000); // Wait for any redirects
    
    const url = page.url();
    console.log('Admin route access attempt - Final URL:', url);
    
    // Expected: Redirect away from /admin
    expect(url).not.toContain('/admin');
    
    // Should be redirected to dashboard or unauthorized page
    expect(url).toMatch(/\/(dashboard|403|unauthorized|niet-toegestaan)/);
  });

  test('Student cannot access /admin/users route', async ({ page }) => {
    // Login as student
    await page.goto('/auth');
    await page.fill('[name="email"]', 'student@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 5000 });
    
    // Try to access specific admin route
    await page.goto('/admin/users');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    console.log('Admin users route - Final URL:', url);
    
    // Expected: Not on admin routes
    expect(url).not.toContain('/admin');
  });

  test('Student cannot call admin RPC functions', async ({ page }) => {
    // Login as student
    await page.goto('/auth');
    await page.fill('[name="email"]', 'student@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 5000 });
    
    // Attempt admin RPC via DevTools
    const response = await page.evaluate(async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          'https://xugosdedyukizseveahx.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Z29zZGVkeXVraXpzZXZlYWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNzMwMzEsImV4cCI6MjA2Nzg0OTAzMX0.wPBExp0d1VKFHJnwzitH9hydUKwgzZvaLQiz3_PRsRg'
        );
        
        // Try to change another user's role (admin-only operation)
        const { data, error } = await supabase.rpc('change_user_role', {
          target_user_id: '00000000-0000-0000-0000-000000000001',
          new_role: 'admin',
          reason: 'Bypass attempt test'
        });
        
        return { 
          data,
          hasError: !!error,
          errorMessage: error?.message,
          errorCode: error?.code
        };
      } catch (error) {
        return { 
          hasError: true,
          errorMessage: (error as Error).message 
        };
      }
    });
    
    console.log('Admin RPC Call Test:', response);
    
    // Expected: Error (permission denied)
    expect(response.hasError).toBe(true);
    expect(response.errorMessage).toMatch(/permission|unauthorized|admin|not allowed/i);
  });

  test('Teacher cannot access other teachers classes', async ({ page }) => {
    // Login as Teacher A
    await page.goto('/auth');
    await page.fill('[name="email"]', 'teacher-a@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 5000 });
    
    // Try to modify a class belonging to Teacher B
    const response = await page.evaluate(async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          'https://xugosdedyukizseveahx.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Z29zZGVkeXVraXpzZXZlYWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNzMwMzEsImV4cCI6MjA2Nzg0OTAzMX0.wPBExp0d1VKFHJnwzitH9hydUKwgzZvaLQiz3_PRsRg'
        );
        
        const { data: { user } } = await supabase.auth.getUser();
        
        // Get all classes
        const { data: allClasses } = await supabase
          .from('klassen')
          .select('id, teacher_id');
        
        // Find a class NOT belonging to current teacher
        const otherTeacherClass = allClasses?.find(
          cls => cls.teacher_id !== user?.id
        );
        
        if (!otherTeacherClass) {
          return { skipped: true, reason: 'No other teacher classes found' };
        }
        
        // Try to update that class
        const { data, error } = await supabase
          .from('klassen')
          .update({ description: 'Hacked by Teacher A' })
          .eq('id', otherTeacherClass.id);
        
        return {
          hasError: !!error,
          errorMessage: error?.message,
          modifiedClass: otherTeacherClass.id,
          updated: !!data
        };
      } catch (error) {
        return { 
          hasError: true,
          errorMessage: (error as Error).message 
        };
      }
    });
    
    console.log('Cross-teacher Access Test:', response);
    
    if (!response.skipped) {
      // Expected: Error or no modification
      expect(response.hasError || !response.updated).toBe(true);
    }
  });

  test('Student cannot create tasks', async ({ page }) => {
    // Login as student
    await page.goto('/auth');
    await page.fill('[name="email"]', 'student@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/dashboard', { timeout: 5000 });
    
    // Try to create a task (teacher-only operation)
    const response = await page.evaluate(async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          'https://xugosdedyukizseveahx.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Z29zZGVkeXVraXpzZXZlYWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNzMwMzEsImV4cCI6MjA2Nzg0OTAzMX0.wPBExp0d1VKFHJnwzitH9hydUKwgzZvaLQiz3_PRsRg'
        );
        
        const { data: { user } } = await supabase.auth.getUser();
        
        // Get first level from enrolled classes
        const { data: enrollments } = await supabase
          .from('inschrijvingen')
          .select('class_id')
          .eq('payment_status', 'paid')
          .limit(1)
          .maybeSingle();
        
        if (!enrollments) {
          return { skipped: true, reason: 'No enrollment found' };
        }
        
        const { data: niveau } = await supabase
          .from('niveaus')
          .select('id')
          .eq('class_id', enrollments.class_id)
          .limit(1)
          .maybeSingle();
        
        if (!niveau) {
          return { skipped: true, reason: 'No niveau found' };
        }
        
        // Attempt to create task
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            level_id: niveau.id,
            author_id: user?.id,
            title: 'Unauthorized Task',
            required_submission_type: 'text',
            grading_scale: 10,
            status: 'published'
          });
        
        return {
          hasError: !!error,
          errorMessage: error?.message,
          created: !!data
        };
      } catch (error) {
        return { 
          hasError: true,
          errorMessage: (error as Error).message 
        };
      }
    });
    
    console.log('Student Task Creation Test:', response);
    
    if (!response.skipped) {
      // Expected: Error
      expect(response.hasError).toBe(true);
      expect(response.created).toBe(false);
    }
  });

  test('Unauthenticated user cannot access protected routes', async ({ page }) => {
    // Navigate without logging in
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    console.log('Unauthenticated dashboard access - Final URL:', url);
    
    // Expected: Redirected to auth page
    expect(url).toContain('/auth');
    
    // Try admin route
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    const adminUrl = page.url();
    console.log('Unauthenticated admin access - Final URL:', adminUrl);
    
    // Expected: Still on auth page
    expect(adminUrl).toContain('/auth');
  });
});
