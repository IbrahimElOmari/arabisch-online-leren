/**
 * FAQ & Knowledge Base Zod Schemas
 * Validation for FAQ items, video tutorials, and community guidelines
 */

import { z } from 'zod';

// FAQ Category
export const faqCategorySchema = z.enum(['account', 'billing', 'learning', 'technical', 'community']);

// FAQ Item Schema
export const faqItemSchema = z.object({
  id: z.string().uuid(),
  question: z.string().min(10, 'Question must be at least 10 characters'),
  answer: z.string().min(20, 'Answer must be at least 20 characters'),
  category: faqCategorySchema,
  order_index: z.number().int().default(0),
  is_published: z.boolean().default(true),
  views_count: z.number().int().default(0),
  helpful_count: z.number().int().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const faqItemInputSchema = faqItemSchema.omit({
  id: true,
  views_count: true,
  helpful_count: true,
  created_at: true,
  updated_at: true,
});

export type FAQItem = z.infer<typeof faqItemSchema>;
export type FAQItemInput = z.infer<typeof faqItemInputSchema>;
export type FAQCategory = z.infer<typeof faqCategorySchema>;

// Video Tutorial Schemas
export const difficultyLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);

export const videoTutorialSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().nullable(),
  video_url: z.string().url('Valid video URL required'),
  thumbnail_url: z.string().url().nullable(),
  duration_seconds: z.number().int().positive().nullable(),
  category: z.string(),
  difficulty_level: difficultyLevelSchema.nullable(),
  order_index: z.number().int().default(0),
  views_count: z.number().int().default(0),
  is_published: z.boolean().default(true),
  created_at: z.string().datetime(),
});

export const videoTutorialInputSchema = videoTutorialSchema.omit({
  id: true,
  views_count: true,
  created_at: true,
});

export type VideoTutorial = z.infer<typeof videoTutorialSchema>;
export type VideoTutorialInput = z.infer<typeof videoTutorialInputSchema>;
export type DifficultyLevel = z.infer<typeof difficultyLevelSchema>;

// Community Guidelines Schema
export const communityGuidelinesSchema = z.object({
  id: z.string().uuid(),
  version: z.string(),
  content_nl: z.string().min(100, 'Dutch content required'),
  content_en: z.string().min(100, 'English content required'),
  content_ar: z.string().min(100, 'Arabic content required'),
  is_current: z.boolean().default(false),
  published_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

export type CommunityGuidelines = z.infer<typeof communityGuidelinesSchema>;

// Search & Feedback Schemas
export const kbSearchQuerySchema = z.object({
  query: z.string().min(2, 'Search query must be at least 2 characters'),
  category: faqCategorySchema.optional(),
  limit: z.number().int().positive().default(10),
});

export const faqFeedbackSchema = z.object({
  faq_id: z.string().uuid(),
  is_helpful: z.boolean(),
});

export type KBSearchQuery = z.infer<typeof kbSearchQuerySchema>;
export type FAQFeedback = z.infer<typeof faqFeedbackSchema>;
