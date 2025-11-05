export type QuestionType = 
  | 'multiple_choice' 
  | 'drag_drop' 
  | 'fill_blank' 
  | 'audio' 
  | 'voice' 
  | 'sequence';

export interface PlacementQuestion {
  id: string;
  question_type: QuestionType;
  question_text: string;
  options?: string[];
  correct_answer: any;
  points?: number;
  media_url?: string;
}

export interface PlacementTest {
  id: string;
  test_name: string;
  module_id: string;
  questions: any; // Json type from DB
  level_ranges: any; // Json type from DB
  is_active: boolean | null;
  time_limit_minutes?: number | null;
  created_at?: string | null;
}

export interface PlacementResult {
  id: string;
  student_id: string;
  placement_test_id: string;
  score: number;
  assigned_level_id: string | null;
  answers: any; // Json type from DB
  completed_at: string | null;
  test_name?: string | null;
  metadata?: any; // Json type from DB
}

export interface WaitingListEntry {
  id: string;
  enrollment_id: string;
  requested_at: string;
  priority: number;
  status: 'waiting' | 'notified' | 'assigned' | 'expired';
  notified_at?: string;
  expires_at?: string;
  notes?: string;
}