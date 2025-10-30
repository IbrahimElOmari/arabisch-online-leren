/**
 * Data Transfer Objects (DTOs)
 * Central source of truth for API contracts
 */

// ============================================================================
// MODULE SYSTEM DTOs
// ============================================================================

export interface ModuleDTO {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  price_one_time_cents: number;
  installment_months: number | null;
  installment_monthly_cents: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModuleClassDTO {
  id: string;
  module_id: string;
  class_name: string;
  capacity: number;
  current_enrollment: number;
  is_active: boolean;
  created_at: string;
}

export interface ModuleLevelDTO {
  id: string;
  module_id: string;
  level_code: string;
  level_name: string;
  sequence_order: number;
  created_at: string;
}

export interface EnrollmentDTO {
  id: string;
  student_id: string;
  module_id: string;
  class_id: string | null;
  level_id: string | null;
  payment_type: 'one_time' | 'installment';
  status: 'pending_payment' | 'pending_placement' | 'pending_class' | 'active' | 'suspended' | 'completed';
  enrolled_at: string;
  activated_at: string | null;
  last_activity: string | null;
}

export interface PaymentDTO {
  id: string;
  enrollment_id: string;
  amount_cents: number;
  payment_type: 'one_time' | 'installment';
  payment_method: string;
  payment_status: 'pending' | 'success' | 'failed';
  transaction_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
}

export interface StudentProfileDTO {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  is_minor: boolean;
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  emergency_contact: string;
  consent_given: boolean;
  created_at: string;
}

// ============================================================================
// PLACEMENT DTOs
// ============================================================================

export interface PlacementTestDTO {
  id: string;
  module_id: string;
  test_name: string;
  questions: PlacementQuestionDTO[];
  level_ranges: Record<string, { min: number; max: number }>;
  is_active: boolean;
  created_at: string;
}

export interface PlacementQuestionDTO {
  id: string;
  question_type: 'multiple_choice' | 'fill_blank' | 'matching' | 'ordering';
  question_text: string;
  options?: string[];
  correct_answer: unknown;
  points: number;
}

export interface PlacementResultDTO {
  id: string;
  student_id: string;
  placement_test_id: string;
  score: number;
  assigned_level_id: string | null;
  answers: AnswerDTO[];
  completed_at: string;
}

export interface AnswerDTO {
  question_id: string;
  answer: unknown;
  is_correct?: boolean;
  time_spent_ms?: number;
}

// ============================================================================
// PAYMENT STUB DTOs
// ============================================================================

export interface CheckoutSessionRequestDTO {
  enrollment_id: string;
  module_id: string;
  payment_type: 'one_time' | 'installment';
}

export interface CheckoutSessionResponseDTO {
  url: string;
  payment_id: string;
}

export interface WebhookEventDTO {
  event: 'payment.success' | 'payment.failure';
  payment_id: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// ADMIN DTOs
// ============================================================================

export interface CreateModuleDTO {
  name: string;
  description: string | null;
  is_active: boolean;
  price_one_time_cents: number;
  installment_months: number | null;
  installment_monthly_cents: number | null;
}

export interface UpdateModuleDTO {
  name?: string;
  description?: string | null;
  is_active?: boolean;
  price_one_time_cents?: number;
  installment_months?: number | null;
  installment_monthly_cents?: number | null;
}

export interface CreateModuleClassDTO {
  module_id: string;
  class_name: string;
  capacity: number;
  is_active: boolean;
}

export interface CreateModuleLevelDTO {
  module_id: string;
  level_code: string;
  level_name: string;
  sequence_order: number;
}

// ============================================================================
// LEARNING DTOs
// ============================================================================

export interface QuestionSubmissionDTO {
  question_id: string;
  student_id: string;
  answer: unknown;
  time_spent_ms: number;
}

export interface QuestionResultDTO {
  is_correct: boolean;
  points_earned: number;
  feedback: string | null;
  correct_answer?: unknown;
}

// ============================================================================
// AUDIT DTOs
// ============================================================================

export interface AuditEventDTO {
  event_type: string;
  actor_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  metadata: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}
