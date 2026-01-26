/**
 * Marketing Zod Schemas
 * Validation for testimonials, lead magnets, and referrals
 */

import { z } from 'zod';

// Testimonial Schemas
export const testimonialSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.string().nullable(),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  rating: z.number().int().min(1).max(5),
  avatar_url: z.string().url().nullable().optional(),
  is_featured: z.boolean().default(false),
  is_approved: z.boolean().default(false),
  source: z.enum(['manual', 'form', 'import']).default('form'),
  created_at: z.string().datetime(),
});

export const testimonialInputSchema = testimonialSchema.omit({
  id: true,
  is_approved: true,
  created_at: true,
});

export type Testimonial = z.infer<typeof testimonialSchema>;
export type TestimonialInput = z.infer<typeof testimonialInputSchema>;

// Lead Magnet Schemas
export const leadMagnetTypeSchema = z.enum(['ebook', 'checklist', 'video', 'template']);

export const leadMagnetSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().nullable(),
  type: leadMagnetTypeSchema,
  file_url: z.string().url().nullable(),
  thumbnail_url: z.string().url().nullable(),
  download_count: z.number().int().default(0),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
});

export const leadMagnetDownloadSchema = z.object({
  id: z.string().uuid(),
  lead_magnet_id: z.string().uuid(),
  email: z.string().email('Valid email required'),
  name: z.string().nullable(),
  user_id: z.string().uuid().nullable(),
  utm_source: z.string().nullable(),
  utm_campaign: z.string().nullable(),
  downloaded_at: z.string().datetime(),
});

export const leadCaptureInputSchema = z.object({
  email: z.string().email('Valid email required'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  lead_magnet_id: z.string().uuid(),
  utm_source: z.string().optional(),
  utm_campaign: z.string().optional(),
});

export type LeadMagnet = z.infer<typeof leadMagnetSchema>;
export type LeadMagnetDownload = z.infer<typeof leadMagnetDownloadSchema>;
export type LeadCaptureInput = z.infer<typeof leadCaptureInputSchema>;

// Referral Schemas
export const referralStatusSchema = z.enum(['pending', 'registered', 'enrolled', 'rewarded']);

export const referralSchema = z.object({
  id: z.string().uuid(),
  referrer_id: z.string().uuid(),
  referee_id: z.string().uuid().nullable(),
  referral_code: z.string().min(6).max(10),
  status: referralStatusSchema.default('pending'),
  reward_type: z.string().nullable(),
  reward_amount: z.number().int().nullable(),
  referee_email: z.string().email().nullable(),
  created_at: z.string().datetime(),
  converted_at: z.string().datetime().nullable(),
  rewarded_at: z.string().datetime().nullable(),
});

export const referralRewardSchema = z.object({
  id: z.string().uuid(),
  tier: z.enum(['bronze', 'silver', 'gold']),
  min_referrals: z.number().int().positive(),
  reward_type: z.string(),
  reward_value: z.number().int().positive(),
  description: z.string().nullable(),
  is_active: z.boolean().default(true),
});

export const referralInviteInputSchema = z.object({
  email: z.string().email('Valid email required'),
  message: z.string().max(500).optional(),
});

export type Referral = z.infer<typeof referralSchema>;
export type ReferralReward = z.infer<typeof referralRewardSchema>;
export type ReferralInviteInput = z.infer<typeof referralInviteInputSchema>;
