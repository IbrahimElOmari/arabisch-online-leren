import { z } from 'zod';

// ============================================
// COMPLETION CRITERIA SCHEMA
// ============================================

export const completionCriteriaSchema = z.object({
  theory_score: z.number().min(0).max(100),
  practice_score: z.number().min(0).max(100),
  consistency_weeks: z.number().min(1).max(52),
});

// ============================================
// CURRICULUM LEVEL SCHEMA
// ============================================

export const cefrLevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

export const levelKeySchema = z.enum([
  'basis',
  'beginner', 
  'gemiddeld',
  'gevorderd',
  'professioneel',
  'specialist',
]);

export const curriculumLevelSchema = z.object({
  id: z.number().int().min(1).max(6),
  key: levelKeySchema,
  nl: z.string().min(1).max(100),
  en: z.string().min(1).max(100),
  ar: z.string().min(1).max(100),
  description_nl: z.string().max(500),
  description_en: z.string().max(500),
  cefr: cefrLevelSchema,
  estimated_hours: z.number().min(10).max(500),
  completion_criteria: completionCriteriaSchema,
});

// ============================================
// LEARNING PILLAR SCHEMA
// ============================================

export const learningPillarKeySchema = z.enum([
  'reading',
  'writing',
  'morphology',
  'grammar',
]);

export const learningPillarSchema = z.object({
  key: learningPillarKeySchema,
  nl: z.string().min(1).max(100),
  en: z.string().min(1).max(100),
  ar: z.string().min(1).max(100),
  description_nl: z.string().max(500),
  description_en: z.string().max(500),
});

// ============================================
// CONTENT MAPPING SCHEMA
// ============================================

export const contentTypeSchema = z.enum(['lesson', 'task', 'exercise']);
export const difficultySchema = z.enum(['easy', 'medium', 'hard']);

export const contentMappingSchema = z.object({
  content_id: z.string().uuid(),
  content_type: contentTypeSchema,
  niveau_id: z.string().uuid(),
  pillar: learningPillarKeySchema,
  topics: z.array(z.string().min(1).max(100)).min(1).max(20),
  difficulty: difficultySchema,
  estimated_minutes: z.number().min(1).max(480),
});

// ============================================
// STUDENT PROGRESS SCHEMAS
// ============================================

export const studentProgressInputSchema = z.object({
  student_id: z.string().uuid(),
  module_id: z.string().uuid(),
  niveau_id: z.string().uuid().optional(),
});

export const levelCompletionResultSchema = z.object({
  completed: z.boolean(),
  theory_score: z.number().min(0).max(100),
  practice_score: z.number().min(0).max(100),
  consistency_weeks: z.number().min(0),
  missing: z.array(z.string()),
});

export const recommendedContentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  type: z.string(),
  pillar: z.string(),
  difficulty: difficultySchema,
  reason: z.string().max(500),
});

export const pillarProgressSchema = z.object({
  pillar: learningPillarKeySchema,
  percentage: z.number().min(0).max(100),
});

export const studentProgressResultSchema = z.object({
  current_niveau: curriculumLevelSchema,
  completion_percentage: z.number().min(0).max(100),
  pillars_progress: z.array(pillarProgressSchema),
  next_niveau: curriculumLevelSchema.nullable(),
  recommended_content: z.array(recommendedContentSchema).optional(),
});

// ============================================
// CURRICULUM SERVICE RESPONSE SCHEMAS
// ============================================

export const curriculumLevelsResponseSchema = z.array(curriculumLevelSchema);
export const learningPillarsResponseSchema = z.array(learningPillarSchema);

// ============================================
// TYPE EXPORTS
// ============================================

export type CEFRLevel = z.infer<typeof cefrLevelSchema>;
export type LevelKey = z.infer<typeof levelKeySchema>;
export type CompletionCriteria = z.infer<typeof completionCriteriaSchema>;
export type CurriculumLevel = z.infer<typeof curriculumLevelSchema>;
export type LearningPillarKey = z.infer<typeof learningPillarKeySchema>;
export type LearningPillar = z.infer<typeof learningPillarSchema>;
export type ContentType = z.infer<typeof contentTypeSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
export type ContentMapping = z.infer<typeof contentMappingSchema>;
export type StudentProgressInput = z.infer<typeof studentProgressInputSchema>;
export type LevelCompletionResult = z.infer<typeof levelCompletionResultSchema>;
export type RecommendedContent = z.infer<typeof recommendedContentSchema>;
export type PillarProgress = z.infer<typeof pillarProgressSchema>;
export type StudentProgressResult = z.infer<typeof studentProgressResultSchema>;
