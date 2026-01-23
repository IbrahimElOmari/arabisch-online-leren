import { z } from 'zod';

// ============================================
// ENROLLMENT SCHEMAS
// Module & Class Enrollment Validation
// ============================================

export const enrollmentStatusSchema = z.enum([
  'pending', 
  'active', 
  'completed', 
  'cancelled', 
  'suspended'
]);

export const paymentTypeSchema = z.enum([
  'free',
  'one_time',
  'subscription',
  'school_license'
]);

export const enrollmentSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  module_id: z.string().uuid(),
  class_id: z.string().uuid().optional().nullable(),
  level_id: z.string().uuid().optional().nullable(),
  status: enrollmentStatusSchema.default('pending'),
  payment_type: paymentTypeSchema.optional().nullable(),
  enrolled_at: z.string().datetime().optional(),
  activated_at: z.string().datetime().optional().nullable(),
  last_activity: z.string().datetime().optional().nullable(),
});

export const inschrijvingSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  class_id: z.string().uuid(),
  payment_status: z.enum(['pending', 'completed', 'failed', 'refunded']).default('pending'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
});

export const createEnrollmentSchema = enrollmentSchema.omit({ 
  id: true, 
  enrolled_at: true,
  activated_at: true,
  last_activity: true,
}).extend({
  status: enrollmentStatusSchema.default('pending'),
});

export const updateEnrollmentSchema = z.object({
  status: enrollmentStatusSchema.optional(),
  level_id: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
});

export const moduleSchema = z.object({
  id: z.string().uuid(),
  module_name: z.string().min(2).max(100),
  module_description: z.string().optional().nullable(),
  module_order: z.number().int().min(0),
  is_active: z.boolean().default(true),
  price_cents: z.number().int().min(0).optional().nullable(),
  currency: z.string().default('EUR'),
  created_at: z.string().datetime(),
});

export const moduleLevelSchema = z.object({
  id: z.string().uuid(),
  module_id: z.string().uuid(),
  level_name: z.string().min(1).max(100),
  level_order: z.number().int().min(0),
  level_description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  required_points: z.number().int().min(0).optional(),
  created_at: z.string().datetime(),
});

// Type exports
export type EnrollmentStatus = z.infer<typeof enrollmentStatusSchema>;
export type PaymentType = z.infer<typeof paymentTypeSchema>;
export type Enrollment = z.infer<typeof enrollmentSchema>;
export type Inschrijving = z.infer<typeof inschrijvingSchema>;
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
export type Module = z.infer<typeof moduleSchema>;
export type ModuleLevel = z.infer<typeof moduleLevelSchema>;
