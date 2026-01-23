import { z } from 'zod';

// ============================================
// AUTH SCHEMAS
// Authentication & User Profile Validation
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
  password: z.string().min(8, 'Minimaal 8 tekens'),
});

export const registerSchema = loginSchema.extend({
  full_name: z.string().min(2, 'Naam is verplicht'),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: 'Wachtwoorden komen niet overeen',
  path: ['confirm_password'],
});

export const profileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  role: z.enum(['leerling', 'leerkracht', 'admin']),
  date_of_birth: z.string().optional().nullable(),
  preferred_language: z.enum(['nl', 'en', 'ar']).optional().nullable(),
  theme_preference: z.enum(['auto', 'playful', 'professional']).optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
});

export const updateProfileSchema = profileSchema.partial().omit({ 
  id: true, 
  email: true, 
  created_at: true 
});

export const passwordResetSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
});

export const passwordChangeSchema = z.object({
  current_password: z.string().min(8),
  new_password: z.string().min(8, 'Minimaal 8 tekens'),
  confirm_password: z.string(),
}).refine(data => data.new_password === data.confirm_password, {
  message: 'Wachtwoorden komen niet overeen',
  path: ['confirm_password'],
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
