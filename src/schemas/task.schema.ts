import { z } from 'zod';

// ============================================
// TASK SCHEMAS
// Task & Submission Validation
// ============================================

export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Titel is verplicht').max(200),
  description: z.string().optional().nullable(),
  required_submission_type: z.enum(['text', 'file', 'both']),
  grading_scale: z.number().int().min(1).max(100).default(10),
  level_id: z.string().uuid(),
  author_id: z.string().uuid(),
  is_published: z.boolean().default(false),
  deadline: z.string().datetime().optional().nullable(),
  max_points: z.number().int().min(1).max(100).optional(),
  instructions: z.string().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
});

export const taskSubmissionSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  student_id: z.string().uuid(),
  submission_content: z.string().optional().nullable(),
  submission_file_path: z.string().optional().nullable(),
  grade: z.number().min(0).max(100).optional().nullable(),
  feedback: z.string().optional().nullable(),
  graded_by: z.string().uuid().optional().nullable(),
  graded_at: z.string().datetime().optional().nullable(),
  submitted_at: z.string().datetime(),
  status: z.enum(['pending', 'graded', 'returned']).default('pending'),
});

export const createTaskSchema = taskSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true,
  author_id: true 
});

export const updateTaskSchema = createTaskSchema.partial();

export const submitTaskSchema = z.object({
  task_id: z.string().uuid(),
  submission_content: z.string().optional(),
  submission_file_path: z.string().optional(),
}).refine(data => data.submission_content || data.submission_file_path, {
  message: 'Lever tekst of bestand in',
});

export const gradeSubmissionSchema = z.object({
  submission_id: z.string().uuid(),
  grade: z.number().min(0).max(100),
  feedback: z.string().optional(),
});

// Type exports
export type Task = z.infer<typeof taskSchema>;
export type TaskSubmission = z.infer<typeof taskSubmissionSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type SubmitTaskInput = z.infer<typeof submitTaskSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
