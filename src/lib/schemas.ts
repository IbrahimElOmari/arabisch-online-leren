/**
 * Centralized Zod schemas for API input validation
 * Use these schemas for all API inputs and form validation
 */

import { z } from 'zod';

// ==================== User Schemas ====================

export const emailSchema = z
  .string()
  .email('Ongeldig e-mailadres')
  .max(255, 'E-mailadres te lang')
  .transform((email) => email.toLowerCase().trim());

export const passwordSchema = z
  .string()
  .min(12, 'Wachtwoord moet minimaal 12 karakters zijn')
  .max(128, 'Wachtwoord mag maximaal 128 karakters zijn')
  .regex(/[A-Z]/, 'Wachtwoord moet minimaal één hoofdletter bevatten')
  .regex(/[a-z]/, 'Wachtwoord moet minimaal één kleine letter bevatten')
  .regex(/[0-9]/, 'Wachtwoord moet minimaal één cijfer bevatten')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Wachtwoord moet minimaal één speciaal teken bevatten')
  .refine((pw) => !/(.)\1{2,}/.test(pw), 'Wachtwoord mag niet meer dan 2 identieke opeenvolgende karakters bevatten')
  .refine((pw) => !/123|abc|qwe|password|admin/i.test(pw), 'Wachtwoord mag geen veelvoorkomende patronen bevatten');

export const uuidSchema = z
  .string()
  .uuid('Ongeldige UUID');

export const roleSchema = z.enum(['admin', 'leerkracht', 'leerling'], {
  errorMap: () => ({ message: 'Ongeldige rol' }),
});

export const userProfileSchema = z.object({
  id: uuidSchema,
  full_name: z.string().min(2, 'Naam te kort').max(100, 'Naam te lang').optional(),
  email: emailSchema.optional(),
  avatar_url: z.string().url().optional().nullable(),
});

// ==================== Auth Schemas ====================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Wachtwoord is verplicht'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: z.string().min(2, 'Naam te kort').max(100, 'Naam te lang'),
  role: roleSchema.default('leerling'),
  parentEmail: emailSchema.optional(),
  isUnder16: z.boolean().default(false),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Wachtwoorden komen niet overeen',
  path: ['confirmPassword'],
});

// ==================== Forum Schemas ====================

export const forumPostSchema = z.object({
  title: z
    .string()
    .min(3, 'Titel te kort')
    .max(200, 'Titel te lang')
    .transform((s) => s.trim()),
  content: z
    .string()
    .min(10, 'Inhoud te kort')
    .max(10000, 'Inhoud te lang')
    .transform((s) => s.trim()),
  class_id: uuidSchema,
  parent_post_id: uuidSchema.optional().nullable(),
});

export const forumReplySchema = z.object({
  content: z
    .string()
    .min(1, 'Reactie mag niet leeg zijn')
    .max(5000, 'Reactie te lang')
    .transform((s) => s.trim()),
  post_id: uuidSchema,
});

// ==================== Task Schemas ====================

export const taskSubmissionSchema = z.object({
  task_id: uuidSchema,
  content: z.string().max(50000, 'Inzending te groot').optional(),
  file_url: z.string().url().optional().nullable(),
});

export const taskGradingSchema = z.object({
  submission_id: uuidSchema,
  grade: z.number().min(0).max(100),
  feedback: z.string().max(5000, 'Feedback te lang').optional(),
});

// ==================== Chat Schemas ====================

export const chatMessageSchema = z.object({
  conversation_id: uuidSchema,
  content: z
    .string()
    .min(1, 'Bericht mag niet leeg zijn')
    .max(10000, 'Bericht te lang')
    .transform((s) => s.trim()),
  attachments: z.array(z.string().url()).max(5).optional(),
});

export const createConversationSchema = z.object({
  type: z.enum(['dm', 'class']),
  class_id: uuidSchema.optional(),
  participant_ids: z.array(uuidSchema).min(1, 'Minimaal 1 deelnemer vereist'),
});

// ==================== Search Schemas ====================

export const searchQuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Zoekterm mag niet leeg zijn')
    .max(100, 'Zoekterm te lang')
    .transform((s) => s.trim()),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
  classId: uuidSchema.optional().nullable(),
  entityType: z.enum(['forum_thread', 'forum_post', 'lesson', 'task', 'profile']).optional(),
});

// ==================== File Upload Schemas ====================

export const fileUploadSchema = z.object({
  filename: z
    .string()
    .max(255, 'Bestandsnaam te lang')
    .refine((name) => /^[\w.-]+$/.test(name), 'Ongeldige bestandsnaam'),
  mimeType: z.string(),
  size: z.number().max(100 * 1024 * 1024, 'Bestand te groot (max 100MB)'),
});

export const imageUploadSchema = fileUploadSchema.extend({
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp'], {
    errorMap: () => ({ message: 'Alleen afbeeldingen toegestaan (JPEG, PNG, GIF, WebP)' }),
  }),
  size: z.number().max(10 * 1024 * 1024, 'Afbeelding te groot (max 10MB)'),
});

// ==================== Pagination Schema ====================

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==================== API Response Schemas ====================

export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
});

// ==================== Utility Functions ====================

/**
 * Safe parse with error logging
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map((e) => e.message),
  };
}

/**
 * Parse or throw with formatted error
 */
export function parseOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  const errorMessage = result.error.errors.map((e) => e.message).join(', ');
  throw new Error(`Validatiefout: ${errorMessage}`);
}
