/**
 * Type definitions for Module System (F11)
 */

export interface Module {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean | null;
  price_one_time_cents: number;
  installment_months: number | null;
  installment_monthly_cents: number | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ModuleClass {
  id: string;
  module_id: string;
  class_name: string;
  capacity: number;
  current_enrollment: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

export interface ModuleLevel {
  id: string;
  module_id: string;
  level_code: string;
  level_name: string;
  sequence_order: number;
  created_at: string | null;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  is_minor: boolean;
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  emergency_contact: EmergencyContact | Record<string, any>;
  consent_given: boolean;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  module_id: string;
  class_id: string | null;
  level_id: string | null;
  payment_type: string | null;
  status: string | null;
  enrolled_at: string | null;
  activated_at: string | null;
  last_activity: string | null;
}

export interface Payment {
  id: string;
  enrollment_id: string;
  amount_cents: number;
  payment_type: string;
  payment_method: string | null;
  payment_status: string | null;
  transaction_id: string | null;
  metadata: Record<string, any>;
  created_at: string | null;
  completed_at: string | null;
}

export interface PlacementTest {
  id: string;
  module_id: string;
  test_name: string;
  questions: any;
  level_ranges: any;
  is_active: boolean | null;
  created_at: string | null;
}

export interface PlacementResult {
  id: string;
  student_id: string;
  placement_test_id: string;
  score: number;
  assigned_level_id: string | null;
  answers: any;
  completed_at: string | null;
}

export interface EnrollmentFormData {
  dateOfBirth: string;
  isMinor: boolean;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  emergencyContact: EmergencyContact;
  consentGiven: boolean;
  paymentType: 'one_time' | 'installment';
}
