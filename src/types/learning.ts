/**
 * Type definitions for Interactive Learning (F2)
 */

export interface LearningAnalytics {
  id: string;
  student_id: string;
  niveau_id: string | null;
  module_id: string | null;
  topic: string;
  accuracy_rate: number | null;
  avg_time_per_question: string | null;
  weak_areas: string[];
  strong_areas: string[];
  recommended_exercises: string[];
  last_updated: string;
}

export interface PracticeSession {
  id: string;
  student_id: string;
  session_type: 'solo' | 'peer' | 'group' | null;
  questions_attempted: number;
  questions_correct: number;
  started_at: string;
  ended_at: string | null;
  session_data: Record<string, any> | null;
}

export interface StudyRoom {
  id: string;
  room_name: string;
  created_by: string | null;
  niveau_id: string | null;
  module_id: string | null;
  max_participants: number;
  is_active: boolean;
  created_at: string;
  room_config: Record<string, any> | null;
}

export interface StudyRoomParticipant {
  id: string;
  room_id: string;
  participant_id: string;
  joined_at: string;
  left_at: string | null;
}

export type QuestionType = 
  | 'multiple_choice'
  | 'drag_drop'
  | 'fill_blank'
  | 'audio_listening'
  | 'voice_recording'
  | 'handwriting'
  | 'sequence_ordering';

export interface InteractiveQuestionConfig {
  type: QuestionType;
  options?: string[];
  correctAnswer?: any;
  draggableItems?: Array<{ id: string; content: string }>;
  dropZones?: Array<{ id: string; label: string }>;
  audioUrl?: string;
  wordBank?: string[];
  sequenceItems?: Array<{ id: string; content: string; correctPosition: number }>;
}
