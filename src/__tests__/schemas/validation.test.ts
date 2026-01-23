import { describe, it, expect } from 'vitest';
import { 
  loginSchema, 
  registerSchema, 
  profileSchema,
  passwordChangeSchema 
} from '@/schemas/auth.schema';
import { 
  taskSchema, 
  createTaskSchema,
  submitTaskSchema 
} from '@/schemas/task.schema';
import { 
  createPostSchema,
  createReplySchema 
} from '@/schemas/forum.schema';
import { 
  createEnrollmentSchema 
} from '@/schemas/enrollment.schema';
import {
  checkoutSessionSchema,
} from '@/schemas/subscription.schema';
import {
  dateRangeSchema,
  dashboardFiltersSchema,
  funnelMetricsSchema,
} from '@/schemas/analytics.schema';

// ============================================
// AUTH SCHEMA TESTS
// ============================================
describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123'
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '123'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        confirm_password: 'password123'
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-matching passwords', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        confirm_password: 'different'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('profileSchema', () => {
    it('should validate valid profile', () => {
      const result = profileSchema.safeParse({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'leerling',
        created_at: new Date().toISOString(),
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const result = profileSchema.safeParse({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        email: 'test@example.com',
        role: 'invalid_role',
        created_at: new Date().toISOString(),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('passwordChangeSchema', () => {
    it('should validate matching passwords', () => {
      const result = passwordChangeSchema.safeParse({
        current_password: 'oldpassword123',
        new_password: 'newpassword456',
        confirm_password: 'newpassword456'
      });
      expect(result.success).toBe(true);
    });
  });
});

// ============================================
// TASK SCHEMA TESTS
// ============================================
describe('Task Schemas', () => {
  describe('taskSchema', () => {
    it('should validate complete task', () => {
      const result = taskSchema.safeParse({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        title: 'Test Task',
        required_submission_type: 'text',
        grading_scale: 10,
        level_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        author_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        is_published: true,
        created_at: new Date().toISOString(),
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = createTaskSchema.safeParse({
        title: '',
        required_submission_type: 'text',
        grading_scale: 10,
        level_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('submitTaskSchema', () => {
    it('should require content or file', () => {
      const result = submitTaskSchema.safeParse({
        task_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      });
      expect(result.success).toBe(false);
    });

    it('should accept content submission', () => {
      const result = submitTaskSchema.safeParse({
        task_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        submission_content: 'My answer',
      });
      expect(result.success).toBe(true);
    });
  });
});

// ============================================
// FORUM SCHEMA TESTS
// ============================================
describe('Forum Schemas', () => {
  describe('createPostSchema', () => {
    it('should validate valid post', () => {
      const result = createPostSchema.safeParse({
        titel: 'Test Post Title',
        inhoud: 'This is the post content with more than 10 characters',
        class_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      });
      expect(result.success).toBe(true);
    });

    it('should reject short title', () => {
      const result = createPostSchema.safeParse({
        titel: 'Hi',
        inhoud: 'This is the post content',
        class_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createReplySchema', () => {
    it('should validate valid reply', () => {
      const result = createReplySchema.safeParse({
        post_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        inhoud: 'This is a reply',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty reply', () => {
      const result = createReplySchema.safeParse({
        post_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        inhoud: '',
      });
      expect(result.success).toBe(false);
    });
  });
});

// ============================================
// ENROLLMENT SCHEMA TESTS
// ============================================
describe('Enrollment Schemas', () => {
  describe('createEnrollmentSchema', () => {
    it('should validate valid enrollment', () => {
      const result = createEnrollmentSchema.safeParse({
        student_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        module_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional fields', () => {
      const result = createEnrollmentSchema.safeParse({
        student_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        module_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        class_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'active',
      });
      expect(result.success).toBe(true);
    });
  });
});

// ============================================
// SUBSCRIPTION SCHEMA TESTS
// ============================================
describe('Subscription Schemas', () => {
  describe('checkoutSessionSchema', () => {
    it('should validate valid checkout session', () => {
      const result = checkoutSessionSchema.safeParse({
        plan_type: 'premium',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid plan type', () => {
      const result = checkoutSessionSchema.safeParse({
        plan_type: 'invalid_plan',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      });
      expect(result.success).toBe(false);
    });
  });
});

// ============================================
// ANALYTICS SCHEMA TESTS
// ============================================
describe('Analytics Schemas', () => {
  describe('dateRangeSchema', () => {
    it('should validate valid date range', () => {
      const result = dateRangeSchema.safeParse({
        start_date: '2024-01-01T00:00:00.000Z',
        end_date: '2024-01-31T23:59:59.999Z',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid date range', () => {
      const result = dateRangeSchema.safeParse({
        start_date: '2024-01-31T00:00:00.000Z',
        end_date: '2024-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('dashboardFiltersSchema', () => {
    it('should accept empty filters', () => {
      const result = dashboardFiltersSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept partial filters', () => {
      const result = dashboardFiltersSchema.safeParse({
        module_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        role: 'leerling',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('funnelMetricsSchema', () => {
    it('should validate funnel metrics', () => {
      const result = funnelMetricsSchema.safeParse({
        registration: 1000,
        first_login: 800,
        first_lesson: 500,
        first_completion: 300,
        active_users: 200,
        conversion_rates: {
          registration_to_login: 0.8,
          login_to_lesson: 0.625,
          lesson_to_completion: 0.6,
          completion_to_active: 0.667,
        },
      });
      expect(result.success).toBe(true);
    });
  });
});
