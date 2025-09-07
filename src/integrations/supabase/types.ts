export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      aanwezigheid: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          status: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aanwezigheid_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aanwezigheid_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_impersonation_sessions: {
        Row: {
          admin_id: string
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          session_token: string
          target_user_id: string
          user_agent: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          session_token: string
          target_user_id: string
          user_agent?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          session_token?: string
          target_user_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      antwoorden: {
        Row: {
          antwoord: Json
          beoordeeld_door: string | null
          created_at: string
          feedback: string | null
          id: string
          is_correct: boolean | null
          punten: number | null
          student_id: string
          updated_at: string
          vraag_id: string
        }
        Insert: {
          antwoord: Json
          beoordeeld_door?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          is_correct?: boolean | null
          punten?: number | null
          student_id: string
          updated_at?: string
          vraag_id: string
        }
        Update: {
          antwoord?: Json
          beoordeeld_door?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          is_correct?: boolean | null
          punten?: number | null
          student_id?: string
          updated_at?: string
          vraag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "antwoorden_beoordeeld_door_fkey"
            columns: ["beoordeeld_door"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "antwoorden_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "antwoorden_vraag_id_fkey"
            columns: ["vraag_id"]
            isOneToOne: false
            referencedRelation: "vragen"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          actie: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          severity: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          actie: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          actie?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_rate_limits: {
        Row: {
          action_type: string
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          first_attempt: string | null
          id: string
          identifier: string
          last_attempt: string | null
        }
        Insert: {
          action_type: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt?: string | null
          id?: string
          identifier: string
          last_attempt?: string | null
        }
        Update: {
          action_type?: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt?: string | null
          id?: string
          identifier?: string
          last_attempt?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          event_type: string
          id: string
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          event_type?: string
          id?: string
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          event_type?: string
          id?: string
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "klassen"
            referencedColumns: ["id"]
          },
        ]
      }
      content_moderation: {
        Row: {
          automated: boolean | null
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          moderation_action: string
          moderator_id: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          automated?: boolean | null
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          moderation_action: string
          moderator_id?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          automated?: boolean | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          moderation_action?: string
          moderator_id?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_moderation_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_moderation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_retention_policies: {
        Row: {
          created_at: string | null
          delete_field: string | null
          id: string
          is_active: boolean | null
          retention_days: number
          table_name: string
        }
        Insert: {
          created_at?: string | null
          delete_field?: string | null
          id?: string
          is_active?: boolean | null
          retention_days: number
          table_name: string
        }
        Update: {
          created_at?: string | null
          delete_field?: string | null
          id?: string
          is_active?: boolean | null
          retention_days?: number
          table_name?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      forum_likes: {
        Row: {
          created_at: string
          id: string
          is_like: boolean
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_like: boolean
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_like?: boolean
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          class_id: string
          created_at: string
          dislikes_count: number | null
          id: string
          inhoud: string
          is_gerapporteerd: boolean | null
          is_verwijderd: boolean | null
          likes_count: number | null
          media_type: string | null
          media_url: string | null
          niveau_id: string | null
          parent_post_id: string | null
          thread_id: string | null
          titel: string
          updated_at: string
          verwijderd_door: string | null
        }
        Insert: {
          author_id: string
          class_id: string
          created_at?: string
          dislikes_count?: number | null
          id?: string
          inhoud: string
          is_gerapporteerd?: boolean | null
          is_verwijderd?: boolean | null
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          niveau_id?: string | null
          parent_post_id?: string | null
          thread_id?: string | null
          titel: string
          updated_at?: string
          verwijderd_door?: string | null
        }
        Update: {
          author_id?: string
          class_id?: string
          created_at?: string
          dislikes_count?: number | null
          id?: string
          inhoud?: string
          is_gerapporteerd?: boolean | null
          is_verwijderd?: boolean | null
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          niveau_id?: string | null
          parent_post_id?: string | null
          thread_id?: string | null
          titel?: string
          updated_at?: string
          verwijderd_door?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "klassen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_verwijderd_door_fkey"
            columns: ["verwijderd_door"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_reacties: {
        Row: {
          author_id: string
          created_at: string
          id: string
          inhoud: string
          is_gerapporteerd: boolean | null
          is_verwijderd: boolean | null
          post_id: string
          updated_at: string
          verwijderd_door: string | null
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          inhoud: string
          is_gerapporteerd?: boolean | null
          is_verwijderd?: boolean | null
          post_id: string
          updated_at?: string
          verwijderd_door?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          inhoud?: string
          is_gerapporteerd?: boolean | null
          is_verwijderd?: boolean | null
          post_id?: string
          updated_at?: string
          verwijderd_door?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_reacties_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_reacties_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_reacties_verwijderd_door_fkey"
            columns: ["verwijderd_door"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          author_id: string
          class_id: string
          comments_enabled: boolean | null
          content: string
          created_at: string
          id: string
          is_pinned: boolean | null
          title: string
        }
        Insert: {
          author_id: string
          class_id: string
          comments_enabled?: boolean | null
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          title: string
        }
        Update: {
          author_id?: string
          class_id?: string
          comments_enabled?: boolean | null
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_threads_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_threads_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "klassen"
            referencedColumns: ["id"]
          },
        ]
      }
      inschrijvingen: {
        Row: {
          class_id: string
          created_at: string
          id: string
          payment_status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          payment_status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          payment_status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inschrijvingen_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "klassen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inschrijvingen_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      klassen: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          stripe_price_id: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          stripe_price_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          stripe_price_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "klassen_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      les_content: {
        Row: {
          content_type: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          niveau_id: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          content_type: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          niveau_id: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          niveau_id?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "les_content_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "les_content_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaus"
            referencedColumns: ["id"]
          },
        ]
      }
      lessen: {
        Row: {
          class_id: string
          created_at: string
          id: string
          live_lesson_datetime: string | null
          live_lesson_url: string | null
          preparation_deadline: string | null
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          live_lesson_datetime?: string | null
          live_lesson_url?: string | null
          preparation_deadline?: string | null
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          live_lesson_datetime?: string | null
          live_lesson_url?: string | null
          preparation_deadline?: string | null
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessen_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "klassen"
            referencedColumns: ["id"]
          },
        ]
      }
      niveaus: {
        Row: {
          beschrijving: string | null
          class_id: string
          created_at: string
          id: string
          is_actief: boolean | null
          naam: string
          niveau_nummer: number
          updated_at: string
        }
        Insert: {
          beschrijving?: string | null
          class_id: string
          created_at?: string
          id?: string
          is_actief?: boolean | null
          naam: string
          niveau_nummer: number
          updated_at?: string
        }
        Update: {
          beschrijving?: string | null
          class_id?: string
          created_at?: string
          id?: string
          is_actief?: boolean | null
          naam?: string
          niveau_nummer?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "niveaus_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "klassen"
            referencedColumns: ["id"]
          },
        ]
      }
      password_history: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          parent_email: string | null
          phone_number: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          parent_email?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          parent_email?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          actie: string
          created_at: string
          details: Json | null
          event_category: string | null
          id: string
          ip_address: unknown | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          actie: string
          created_at?: string
          details?: Json | null
          event_category?: string | null
          id?: string
          ip_address?: unknown | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          actie?: string
          created_at?: string
          details?: Json | null
          event_category?: string | null
          id?: string
          ip_address?: unknown | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      student_niveau_progress: {
        Row: {
          completed_at: string | null
          completed_questions: number
          completed_tasks: number
          created_at: string
          id: string
          is_completed: boolean
          niveau_id: string
          student_id: string
          total_points: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_questions?: number
          completed_tasks?: number
          created_at?: string
          id?: string
          is_completed?: boolean
          niveau_id: string
          student_id: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_questions?: number
          completed_tasks?: number
          created_at?: string
          id?: string
          is_completed?: boolean
          niveau_id?: string
          student_id?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      task_submissions: {
        Row: {
          feedback: string | null
          grade: number | null
          id: string
          student_id: string
          submission_content: string | null
          submission_file_path: string | null
          submitted_at: string
          task_id: string
        }
        Insert: {
          feedback?: string | null
          grade?: number | null
          id?: string
          student_id: string
          submission_content?: string | null
          submission_file_path?: string | null
          submitted_at?: string
          task_id: string
        }
        Update: {
          feedback?: string | null
          grade?: number | null
          id?: string
          student_id?: string
          submission_content?: string | null
          submission_file_path?: string | null
          submitted_at?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          author_id: string
          created_at: string
          description: string | null
          external_link: string | null
          grading_scale: number
          id: string
          level_id: string
          media_type: string | null
          media_url: string | null
          required_submission_type: Database["public"]["Enums"]["submission_type"]
          title: string
          youtube_url: string | null
        }
        Insert: {
          author_id: string
          created_at?: string
          description?: string | null
          external_link?: string | null
          grading_scale: number
          id?: string
          level_id: string
          media_type?: string | null
          media_url?: string | null
          required_submission_type: Database["public"]["Enums"]["submission_type"]
          title: string
          youtube_url?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string | null
          external_link?: string | null
          grading_scale?: number
          id?: string
          level_id?: string
          media_type?: string | null
          media_url?: string | null
          required_submission_type?: Database["public"]["Enums"]["submission_type"]
          title?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "niveaus"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          consent_type: string
          consent_version: string
          consented: boolean
          consented_at: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          consent_type: string
          consent_version: string
          consented: boolean
          consented_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
          withdrawn_at?: string | null
        }
        Update: {
          consent_type?: string
          consent_version?: string
          consented?: boolean
          consented_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_security_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_activity: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_security_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          duration_seconds: number | null
          id: string
          session_end: string | null
          session_start: string
          user_id: string
        }
        Insert: {
          duration_seconds?: number | null
          id?: string
          session_end?: string | null
          session_start: string
          user_id: string
        }
        Update: {
          duration_seconds?: number | null
          id?: string
          session_end?: string | null
          session_start?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vragen: {
        Row: {
          audio_url: string | null
          correct_antwoord: Json | null
          created_at: string
          id: string
          niveau_id: string
          opties: Json | null
          updated_at: string
          video_url: string | null
          volgorde: number | null
          vraag_tekst: string
          vraag_type: string
        }
        Insert: {
          audio_url?: string | null
          correct_antwoord?: Json | null
          created_at?: string
          id?: string
          niveau_id: string
          opties?: Json | null
          updated_at?: string
          video_url?: string | null
          volgorde?: number | null
          vraag_tekst: string
          vraag_type: string
        }
        Update: {
          audio_url?: string | null
          correct_antwoord?: Json | null
          created_at?: string
          id?: string
          niveau_id?: string
          opties?: Json | null
          updated_at?: string
          video_url?: string | null
          volgorde?: number | null
          vraag_tekst?: string
          vraag_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vragen_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaus"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_identifier: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      export_user_data: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_conversation_messages: {
        Args: { user1_id: string; user2_id: string }
        Returns: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
          updated_at: string
        }[]
      }
      get_direct_messages: {
        Args: { user_id: string }
        Returns: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
          updated_at: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      mark_messages_read: {
        Args: { receiver_id: string; sender_id: string }
        Returns: undefined
      }
      send_direct_message: {
        Args: {
          message_content: string
          receiver_id: string
          sender_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "leerkracht" | "leerling"
      submission_type: "text" | "file"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "leerkracht", "leerling"],
      submission_type: ["text", "file"],
    },
  },
} as const
