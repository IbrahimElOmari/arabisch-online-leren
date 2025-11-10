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
    PostgrestVersion: "13.0.5"
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
      achievement_definitions: {
        Row: {
          achievement_category: string | null
          achievement_description: string | null
          achievement_icon: string | null
          achievement_id: string
          achievement_name: string
          achievement_tier: string | null
          created_at: string | null
          id: string
          is_hidden: boolean | null
          points_value: number | null
          unlock_criteria: Json
        }
        Insert: {
          achievement_category?: string | null
          achievement_description?: string | null
          achievement_icon?: string | null
          achievement_id: string
          achievement_name: string
          achievement_tier?: string | null
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          points_value?: number | null
          unlock_criteria: Json
        }
        Update: {
          achievement_category?: string | null
          achievement_description?: string | null
          achievement_icon?: string | null
          achievement_id?: string
          achievement_name?: string
          achievement_tier?: string | null
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          points_value?: number | null
          unlock_criteria?: Json
        }
        Relationships: []
      }
      activity_feed: {
        Row: {
          activity_data: Json
          activity_type: string
          created_at: string | null
          id: string
          student_id: string
          visibility: string | null
        }
        Insert: {
          activity_data: Json
          activity_type: string
          created_at?: string | null
          id?: string
          student_id: string
          visibility?: string | null
        }
        Update: {
          activity_data?: Json
          activity_type?: string
          created_at?: string | null
          id?: string
          student_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_student_id_fkey"
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
          is_active?: boolean | null
          session_token?: string
          target_user_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          page_url: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          page_url?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          page_url?: string | null
          session_id?: string | null
          user_id?: string | null
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          meta: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          meta?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          meta?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
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
      awarded_badges: {
        Row: {
          awarded_by: string | null
          badge_description: string | null
          badge_id: string
          badge_name: string
          badge_type: string
          earned_at: string
          id: string
          niveau_id: string
          points_threshold: number | null
          reason: string | null
          student_id: string
        }
        Insert: {
          awarded_by?: string | null
          badge_description?: string | null
          badge_id: string
          badge_name: string
          badge_type: string
          earned_at?: string
          id?: string
          niveau_id: string
          points_threshold?: number | null
          reason?: string | null
          student_id: string
        }
        Update: {
          awarded_by?: string | null
          badge_description?: string | null
          badge_id?: string
          badge_name?: string
          badge_type?: string
          earned_at?: string
          id?: string
          niveau_id?: string
          points_threshold?: number | null
          reason?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "awarded_badges_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awarded_badges_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awarded_badges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_jobs: {
        Row: {
          artifact_url: string | null
          created_at: string
          finished_at: string | null
          id: string
          note: string | null
          requested_by: string | null
          status: string
        }
        Insert: {
          artifact_url?: string | null
          created_at?: string
          finished_at?: string | null
          id?: string
          note?: string | null
          requested_by?: string | null
          status?: string
        }
        Update: {
          artifact_url?: string | null
          created_at?: string
          finished_at?: string | null
          id?: string
          note?: string | null
          requested_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_jobs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          badge_description: string
          badge_icon: string
          badge_key: string
          badge_name: string
          badge_tier: string
          created_at: string
          game_mode: string
          id: string
          unlock_criteria: Json
          xp_requirement: number
        }
        Insert: {
          badge_description: string
          badge_icon: string
          badge_key: string
          badge_name: string
          badge_tier: string
          created_at?: string
          game_mode: string
          id?: string
          unlock_criteria?: Json
          xp_requirement?: number
        }
        Update: {
          badge_description?: string
          badge_icon?: string
          badge_key?: string
          badge_name?: string
          badge_tier?: string
          created_at?: string
          game_mode?: string
          id?: string
          unlock_criteria?: Json
          xp_requirement?: number
        }
        Relationships: []
      }
      bonus_points: {
        Row: {
          awarded_by: string
          created_at: string
          id: string
          niveau_id: string
          points: number
          reason: string
          student_id: string
        }
        Insert: {
          awarded_by: string
          created_at?: string
          id?: string
          niveau_id: string
          points: number
          reason: string
          student_id: string
        }
        Update: {
          awarded_by?: string
          created_at?: string
          id?: string
          niveau_id?: string
          points?: number
          reason?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bonus_points_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonus_points_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonus_points_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      certificate_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          template_design: Json
          template_language: string | null
          template_name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          template_design: Json
          template_language?: string | null
          template_name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          template_design?: Json
          template_language?: string | null
          template_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_verifications: {
        Row: {
          certificate_id: string
          id: string
          verification_method: string | null
          verified_at: string | null
          verifier_ip: unknown
        }
        Insert: {
          certificate_id: string
          id?: string
          verification_method?: string | null
          verified_at?: string | null
          verifier_ip?: unknown
        }
        Update: {
          certificate_id?: string
          id?: string
          verification_method?: string | null
          verified_at?: string | null
          verifier_ip?: unknown
        }
        Relationships: []
      }
      challenges: {
        Row: {
          challenge_type: string
          completion_criteria: Json
          created_at: string
          description: string
          game_mode: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
          valid_from: string
          valid_until: string
          xp_reward: number
        }
        Insert: {
          challenge_type: string
          completion_criteria?: Json
          created_at?: string
          description: string
          game_mode: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          valid_from: string
          valid_until: string
          xp_reward?: number
        }
        Update: {
          challenge_type?: string
          completion_criteria?: Json
          created_at?: string
          description?: string
          game_mode?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string
          xp_reward?: number
        }
        Relationships: []
      }
      completion_criteria: {
        Row: {
          criteria_config: Json
          criteria_type: string
          id: string
          is_required: boolean | null
          module_id: string | null
          niveau_id: string | null
          weight: number | null
        }
        Insert: {
          criteria_config: Json
          criteria_type: string
          id?: string
          is_required?: boolean | null
          module_id?: string | null
          niveau_id?: string | null
          weight?: number | null
        }
        Update: {
          criteria_config?: Json
          criteria_type?: string
          id?: string
          is_required?: boolean | null
          module_id?: string | null
          niveau_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "completion_criteria_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completion_criteria_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaus"
            referencedColumns: ["id"]
          },
        ]
      }
      content_library: {
        Row: {
          content_data: Json
          content_type: string
          created_at: string
          created_by: string | null
          id: string
          level_id: string | null
          metadata: Json | null
          module_id: string | null
          owner_id: string | null
          parent_version_id: string | null
          published_at: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          content_data?: Json
          content_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          level_id?: string | null
          metadata?: Json | null
          module_id?: string | null
          owner_id?: string | null
          parent_version_id?: string | null
          published_at?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          content_data?: Json
          content_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          level_id?: string | null
          metadata?: Json | null
          module_id?: string | null
          owner_id?: string | null
          parent_version_id?: string | null
          published_at?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_library_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "content_library"
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
      content_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_public: boolean | null
          owner_id: string | null
          template_data: Json
          template_name: string
          template_type: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_public?: boolean | null
          owner_id?: string | null
          template_data: Json
          template_name: string
          template_type: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_public?: boolean | null
          owner_id?: string | null
          template_data?: Json
          template_name?: string
          template_type?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_versions: {
        Row: {
          change_summary: string | null
          content_data: Json
          content_id: string
          content_type: string
          created_at: string | null
          created_by: string | null
          id: string
          is_published: boolean | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          content_data: Json
          content_id: string
          content_type: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          version_number: number
        }
        Update: {
          change_summary?: string | null
          content_data?: Json
          content_id?: string
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string
          id: string
          type: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          type: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "klassen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
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
      enrollments: {
        Row: {
          activated_at: string | null
          class_id: string | null
          enrolled_at: string | null
          id: string
          last_activity: string | null
          level_id: string | null
          module_id: string
          payment_type: string | null
          status: string | null
          student_id: string
        }
        Insert: {
          activated_at?: string | null
          class_id?: string | null
          enrolled_at?: string | null
          id?: string
          last_activity?: string | null
          level_id?: string | null
          module_id: string
          payment_type?: string | null
          status?: string | null
          student_id: string
        }
        Update: {
          activated_at?: string | null
          class_id?: string | null
          enrolled_at?: string | null
          id?: string
          last_activity?: string | null
          level_id?: string | null
          module_id?: string
          payment_type?: string | null
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "module_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "module_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          flag_description: string | null
          flag_name: string
          id: string
          is_enabled: boolean | null
          rollout_percentage: number | null
          target_roles: string[] | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          flag_description?: string | null
          flag_name: string
          id?: string
          is_enabled?: boolean | null
          rollout_percentage?: number | null
          target_roles?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          flag_description?: string | null
          flag_name?: string
          id?: string
          is_enabled?: boolean | null
          rollout_percentage?: number | null
          target_roles?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      forum_members: {
        Row: {
          forum_room_id: string | null
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          forum_room_id?: string | null
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          forum_room_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_members_forum_room_id_fkey"
            columns: ["forum_room_id"]
            isOneToOne: false
            referencedRelation: "forum_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_post_views: {
        Row: {
          id: string
          post_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          body: string
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
          tsv: unknown
          updated_at: string
          verwijderd_door: string | null
        }
        Insert: {
          author_id: string
          body?: string
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
          tsv?: unknown
          updated_at?: string
          verwijderd_door?: string | null
        }
        Update: {
          author_id?: string
          body?: string
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
          tsv?: unknown
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
      forum_rooms: {
        Row: {
          class_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          level_id: string | null
          module_id: string
          room_description: string | null
          room_name: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          level_id?: string | null
          module_id: string
          room_description?: string | null
          room_name: string
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          level_id?: string | null
          module_id?: string
          room_description?: string | null
          room_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_rooms_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "module_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_rooms_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "module_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_rooms_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          author_id: string
          body: string
          class_id: string
          comments_enabled: boolean | null
          content: string
          created_at: string
          id: string
          is_pinned: boolean | null
          status: string | null
          title: string
          tsv: unknown
        }
        Insert: {
          author_id: string
          body?: string
          class_id: string
          comments_enabled?: boolean | null
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          status?: string | null
          title: string
          tsv?: unknown
        }
        Update: {
          author_id?: string
          body?: string
          class_id?: string
          comments_enabled?: boolean | null
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          status?: string | null
          title?: string
          tsv?: unknown
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
      grading_rubrics: {
        Row: {
          created_at: string | null
          created_by: string | null
          criteria: Json
          id: string
          is_template: boolean | null
          rubric_name: string
          rubric_type: string | null
          total_points: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          criteria: Json
          id?: string
          is_template?: boolean | null
          rubric_name: string
          rubric_type?: string | null
          total_points: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          criteria?: Json
          id?: string
          is_template?: boolean | null
          rubric_name?: string
          rubric_type?: string | null
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "grading_rubrics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      issued_certificates: {
        Row: {
          certificate_data: Json
          certificate_id: string
          id: string
          is_revoked: boolean | null
          issued_at: string | null
          issued_by: string | null
          module_id: string | null
          niveau_id: string | null
          pdf_url: string | null
          qr_code_url: string | null
          revoked_at: string | null
          revoked_reason: string | null
          signature_hash: string
          student_id: string
          template_id: string | null
          verification_url: string | null
        }
        Insert: {
          certificate_data: Json
          certificate_id: string
          id?: string
          is_revoked?: boolean | null
          issued_at?: string | null
          issued_by?: string | null
          module_id?: string | null
          niveau_id?: string | null
          pdf_url?: string | null
          qr_code_url?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          signature_hash: string
          student_id: string
          template_id?: string | null
          verification_url?: string | null
        }
        Update: {
          certificate_data?: Json
          certificate_id?: string
          id?: string
          is_revoked?: boolean | null
          issued_at?: string | null
          issued_by?: string | null
          module_id?: string | null
          niveau_id?: string | null
          pdf_url?: string | null
          qr_code_url?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          signature_hash?: string
          student_id?: string
          template_id?: string | null
          verification_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issued_certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issued_certificates_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issued_certificates_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issued_certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issued_certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
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
      leaderboard_entries: {
        Row: {
          calculated_at: string | null
          id: string
          leaderboard_type: string
          rank: number | null
          scope_id: string | null
          score: number
          student_id: string
          time_period: string | null
        }
        Insert: {
          calculated_at?: string | null
          id?: string
          leaderboard_type: string
          rank?: number | null
          scope_id?: string | null
          score: number
          student_id: string
          time_period?: string | null
        }
        Update: {
          calculated_at?: string | null
          id?: string
          leaderboard_type?: string
          rank?: number | null
          scope_id?: string | null
          score?: number
          student_id?: string
          time_period?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_rankings: {
        Row: {
          calculated_at: string
          id: string
          leaderboard_type: string
          period: string
          rank: number
          scope_id: string | null
          student_id: string
          xp_points: number
        }
        Insert: {
          calculated_at?: string
          id?: string
          leaderboard_type: string
          period: string
          rank: number
          scope_id?: string | null
          student_id: string
          xp_points?: number
        }
        Update: {
          calculated_at?: string
          id?: string
          leaderboard_type?: string
          period?: string
          rank?: number
          scope_id?: string | null
          student_id?: string
          xp_points?: number
        }
        Relationships: []
      }
      learning_analytics: {
        Row: {
          accuracy_rate: number | null
          avg_time_per_question: unknown
          id: string
          last_updated: string | null
          module_id: string | null
          niveau_id: string | null
          recommended_exercises: string[] | null
          strong_areas: string[] | null
          student_id: string
          topic: string
          weak_areas: string[] | null
        }
        Insert: {
          accuracy_rate?: number | null
          avg_time_per_question?: unknown
          id?: string
          last_updated?: string | null
          module_id?: string | null
          niveau_id?: string | null
          recommended_exercises?: string[] | null
          strong_areas?: string[] | null
          student_id: string
          topic: string
          weak_areas?: string[] | null
        }
        Update: {
          accuracy_rate?: number | null
          avg_time_per_question?: unknown
          id?: string
          last_updated?: string | null
          module_id?: string | null
          niveau_id?: string | null
          recommended_exercises?: string[] | null
          strong_areas?: string[] | null
          student_id?: string
          topic?: string
          weak_areas?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_analytics_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_analytics_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_analytics_student_id_fkey"
            columns: ["student_id"]
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
          status: string | null
          title: string
          tsv: unknown
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
          status?: string | null
          title: string
          tsv?: unknown
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
          status?: string | null
          title?: string
          tsv?: unknown
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
      live_lessons: {
        Row: {
          class_id: string
          content_id: string | null
          created_at: string | null
          created_by: string | null
          duration_minutes: number
          id: string
          join_url: string | null
          lesson_title: string
          level_id: string
          module_id: string
          recording_url: string | null
          scheduled_at: string
          status: string | null
        }
        Insert: {
          class_id: string
          content_id?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_minutes: number
          id?: string
          join_url?: string | null
          lesson_title: string
          level_id: string
          module_id: string
          recording_url?: string | null
          scheduled_at: string
          status?: string | null
        }
        Update: {
          class_id?: string
          content_id?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number
          id?: string
          join_url?: string | null
          lesson_title?: string
          level_id?: string
          module_id?: string
          recording_url?: string | null
          scheduled_at?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_lessons_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "module_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_lessons_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_lessons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_lessons_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "module_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      media_library: {
        Row: {
          alt_text: string | null
          file_size: number
          file_type: string
          file_url: string
          filename: string
          id: string
          mime_type: string
          tags: string[] | null
          thumbnail_url: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          usage_count: number | null
        }
        Insert: {
          alt_text?: string | null
          file_size: number
          file_type: string
          file_url: string
          filename: string
          id?: string
          mime_type: string
          tags?: string[] | null
          thumbnail_url?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          usage_count?: number | null
        }
        Update: {
          alt_text?: string | null
          file_size?: number
          file_type?: string
          file_url?: string
          filename?: string
          id?: string
          mime_type?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_library_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_shared: boolean | null
          template_category: string | null
          template_content: string
          template_name: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_shared?: boolean | null
          template_category?: string | null
          template_content: string
          template_name: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_shared?: boolean | null
          template_category?: string | null
          template_content?: string
          template_name?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_thresholds: {
        Row: {
          created_at: string
          created_by: string | null
          critical_threshold: number
          evaluation_window_minutes: number
          id: string
          metric_type: string
          notification_enabled: boolean | null
          updated_at: string
          warning_threshold: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          critical_threshold: number
          evaluation_window_minutes?: number
          id?: string
          metric_type: string
          notification_enabled?: boolean | null
          updated_at?: string
          warning_threshold: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          critical_threshold?: number
          evaluation_window_minutes?: number
          id?: string
          metric_type?: string
          notification_enabled?: boolean | null
          updated_at?: string
          warning_threshold?: number
        }
        Relationships: []
      }
      module_class_teachers: {
        Row: {
          assigned_at: string | null
          class_id: string
          teacher_id: string
        }
        Insert: {
          assigned_at?: string | null
          class_id: string
          teacher_id: string
        }
        Update: {
          assigned_at?: string | null
          class_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_class_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "module_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      module_classes: {
        Row: {
          capacity: number
          class_name: string
          created_at: string | null
          current_enrollment: number | null
          id: string
          is_active: boolean | null
          module_id: string
        }
        Insert: {
          capacity?: number
          class_name: string
          created_at?: string | null
          current_enrollment?: number | null
          id?: string
          is_active?: boolean | null
          module_id: string
        }
        Update: {
          capacity?: number
          class_name?: string
          created_at?: string | null
          current_enrollment?: number | null
          id?: string
          is_active?: boolean | null
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_classes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_levels: {
        Row: {
          created_at: string | null
          id: string
          level_code: string
          level_name: string
          module_id: string
          sequence_order: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          level_code: string
          level_name: string
          module_id: string
          sequence_order: number
        }
        Update: {
          created_at?: string | null
          id?: string
          level_code?: string
          level_name?: string
          module_id?: string
          sequence_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "module_levels_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          installment_monthly_cents: number | null
          installment_months: number | null
          is_active: boolean | null
          name: string
          price_one_time_cents: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          installment_monthly_cents?: number | null
          installment_months?: number | null
          is_active?: boolean | null
          name: string
          price_one_time_cents?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          installment_monthly_cents?: number | null
          installment_months?: number | null
          is_active?: boolean | null
          name?: string
          price_one_time_cents?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          payload: Json
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          payload?: Json
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          payload?: Json
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      payments: {
        Row: {
          amount_cents: number
          completed_at: string | null
          created_at: string | null
          enrollment_id: string
          id: string
          metadata: Json | null
          payment_method: string | null
          payment_status: string | null
          payment_type: string
          transaction_id: string | null
        }
        Insert: {
          amount_cents: number
          completed_at?: string | null
          created_at?: string | null
          enrollment_id: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          payment_type: string
          transaction_id?: string | null
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          created_at?: string | null
          enrollment_id?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          payment_type?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_results: {
        Row: {
          answers: Json
          assigned_level_id: string | null
          completed_at: string | null
          id: string
          metadata: Json | null
          placement_test_id: string
          score: number
          student_id: string
          test_name: string | null
        }
        Insert: {
          answers: Json
          assigned_level_id?: string | null
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          placement_test_id: string
          score: number
          student_id: string
          test_name?: string | null
        }
        Update: {
          answers?: Json
          assigned_level_id?: string | null
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          placement_test_id?: string
          score?: number
          student_id?: string
          test_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "placement_results_assigned_level_id_fkey"
            columns: ["assigned_level_id"]
            isOneToOne: false
            referencedRelation: "module_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_results_placement_test_id_fkey"
            columns: ["placement_test_id"]
            isOneToOne: false
            referencedRelation: "placement_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_tests: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          level_ranges: Json
          module_id: string
          questions: Json
          test_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          level_ranges: Json
          module_id: string
          questions: Json
          test_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          level_ranges?: Json
          module_id?: string
          questions?: Json
          test_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "placement_tests_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_sessions: {
        Row: {
          ended_at: string | null
          id: string
          questions_attempted: number | null
          questions_correct: number | null
          session_data: Json | null
          session_type: string | null
          started_at: string | null
          student_id: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          questions_attempted?: number | null
          questions_correct?: number | null
          session_data?: Json | null
          session_type?: string | null
          started_at?: string | null
          student_id: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          questions_attempted?: number | null
          questions_correct?: number | null
          session_data?: Json | null
          session_type?: string | null
          started_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prep_lessons: {
        Row: {
          content_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_published: boolean | null
          lesson_content: Json
          lesson_order: number
          lesson_title: string
          level_id: string
          module_id: string
        }
        Insert: {
          content_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          lesson_content: Json
          lesson_order: number
          lesson_title: string
          level_id: string
          module_id: string
        }
        Update: {
          content_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          lesson_content?: Json
          lesson_order?: number
          lesson_title?: string
          level_id?: string
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prep_lessons_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prep_lessons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prep_lessons_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "module_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prep_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          parent_email: string | null
          phone_number: string | null
          role: Database["public"]["Enums"]["app_role"]
          theme_preference: string | null
          tsv: unknown
          updated_at: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          parent_email?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          theme_preference?: string | null
          tsv?: unknown
          updated_at?: string
        }
        Update: {
          age?: number | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          parent_email?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          theme_preference?: string | null
          tsv?: unknown
          updated_at?: string
        }
        Relationships: []
      }
      reward_items: {
        Row: {
          cost_coins: number
          cost_xp: number | null
          id: string
          is_available: boolean | null
          item_data: Json | null
          item_description: string | null
          item_name: string
          item_type: string | null
          rarity: string | null
        }
        Insert: {
          cost_coins: number
          cost_xp?: number | null
          id?: string
          is_available?: boolean | null
          item_data?: Json | null
          item_description?: string | null
          item_name: string
          item_type?: string | null
          rarity?: string | null
        }
        Update: {
          cost_coins?: number
          cost_xp?: number | null
          id?: string
          is_available?: boolean | null
          item_data?: Json | null
          item_description?: string | null
          item_name?: string
          item_type?: string | null
          rarity?: string | null
        }
        Relationships: []
      }
      scheduled_messages: {
        Row: {
          id: string
          message_content: string
          recipient_ids: string[] | null
          recipient_type: string | null
          scheduled_for: string
          sender_id: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          id?: string
          message_content: string
          recipient_ids?: string[] | null
          recipient_type?: string | null
          scheduled_for: string
          sender_id: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          id?: string
          message_content?: string
          recipient_ids?: string[] | null
          recipient_type?: string | null
          scheduled_for?: string
          sender_id?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          actie: string
          created_at: string
          details: Json | null
          event_category: string | null
          id: string
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      student_achievements: {
        Row: {
          achievement_id: string | null
          id: string
          is_showcased: boolean | null
          progress_data: Json | null
          student_id: string
          unlocked_at: string | null
        }
        Insert: {
          achievement_id?: string | null
          id?: string
          is_showcased?: boolean | null
          progress_data?: Json | null
          student_id: string
          unlocked_at?: string | null
        }
        Update: {
          achievement_id?: string | null
          id?: string
          is_showcased?: boolean | null
          progress_data?: Json | null
          student_id?: string
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievement_definitions"
            referencedColumns: ["achievement_id"]
          },
          {
            foreignKeyName: "student_achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          is_showcased: boolean
          student_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          is_showcased?: boolean
          student_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          is_showcased?: boolean
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      student_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          progress: Json
          student_id: string
          updated_at: string
          xp_earned: number
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          progress?: Json
          student_id: string
          updated_at?: string
          xp_earned?: number
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          progress?: Json
          student_id?: string
          updated_at?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      student_connections: {
        Row: {
          connected_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          connected_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          connected_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_connections_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_connections_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_game_profiles: {
        Row: {
          avatar_id: string | null
          created_at: string
          game_mode: string
          id: string
          last_activity_date: string | null
          level: number
          streak_days: number
          student_id: string
          title: string | null
          updated_at: string
          xp_points: number
        }
        Insert: {
          avatar_id?: string | null
          created_at?: string
          game_mode: string
          id?: string
          last_activity_date?: string | null
          level?: number
          streak_days?: number
          student_id: string
          title?: string | null
          updated_at?: string
          xp_points?: number
        }
        Update: {
          avatar_id?: string | null
          created_at?: string
          game_mode?: string
          id?: string
          last_activity_date?: string | null
          level?: number
          streak_days?: number
          student_id?: string
          title?: string | null
          updated_at?: string
          xp_points?: number
        }
        Relationships: []
      }
      student_inventory: {
        Row: {
          acquired_at: string | null
          id: string
          is_equipped: boolean | null
          item_id: string
          student_id: string
        }
        Insert: {
          acquired_at?: string | null
          id?: string
          is_equipped?: boolean | null
          item_id: string
          student_id: string
        }
        Update: {
          acquired_at?: string | null
          id?: string
          is_equipped?: boolean | null
          item_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "reward_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_inventory_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      student_profiles: {
        Row: {
          consent_given: boolean | null
          created_at: string | null
          date_of_birth: string | null
          emergency_contact: string | null
          id: string
          is_minor: boolean | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          user_id: string
        }
        Insert: {
          consent_given?: boolean | null
          created_at?: string | null
          date_of_birth?: string | null
          emergency_contact?: string | null
          id?: string
          is_minor?: boolean | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          user_id: string
        }
        Update: {
          consent_given?: boolean | null
          created_at?: string | null
          date_of_birth?: string | null
          emergency_contact?: string | null
          id?: string
          is_minor?: boolean | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_topic_progress: {
        Row: {
          completion_percentage: number | null
          exercises_completed: number | null
          exercises_total: number
          id: string
          last_practiced: string | null
          mastery_level: string | null
          module_id: string | null
          niveau_id: string | null
          student_id: string
          topic_name: string
          updated_at: string | null
        }
        Insert: {
          completion_percentage?: number | null
          exercises_completed?: number | null
          exercises_total: number
          id?: string
          last_practiced?: string | null
          mastery_level?: string | null
          module_id?: string | null
          niveau_id?: string | null
          student_id: string
          topic_name: string
          updated_at?: string | null
        }
        Update: {
          completion_percentage?: number | null
          exercises_completed?: number | null
          exercises_total?: number
          id?: string
          last_practiced?: string | null
          mastery_level?: string | null
          module_id?: string | null
          niveau_id?: string | null
          student_id?: string
          topic_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_topic_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_topic_progress_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_topic_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_wallet: {
        Row: {
          current_level: number | null
          last_activity_date: string | null
          last_xp_update: string | null
          streak_days: number | null
          student_id: string
          total_xp: number | null
          virtual_coins: number | null
        }
        Insert: {
          current_level?: number | null
          last_activity_date?: string | null
          last_xp_update?: string | null
          streak_days?: number | null
          student_id: string
          total_xp?: number | null
          virtual_coins?: number | null
        }
        Update: {
          current_level?: number | null
          last_activity_date?: string | null
          last_xp_update?: string | null
          streak_days?: number | null
          student_id?: string
          total_xp?: number | null
          virtual_coins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_wallet_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_room_participants: {
        Row: {
          id: string
          joined_at: string | null
          left_at: string | null
          participant_id: string | null
          room_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          left_at?: string | null
          participant_id?: string | null
          room_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          left_at?: string | null
          participant_id?: string | null
          room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_room_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_rooms: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          max_participants: number | null
          module_id: string | null
          niveau_id: string | null
          room_config: Json | null
          room_name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          module_id?: string | null
          niveau_id?: string | null
          room_config?: Json | null
          room_name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          module_id?: string | null
          niveau_id?: string | null
          room_config?: Json | null
          room_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_rooms_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_rooms_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaus"
            referencedColumns: ["id"]
          },
        ]
      }
      system_announcements: {
        Row: {
          announcement_content: string
          announcement_title: string
          announcement_type: string | null
          created_at: string | null
          created_by: string | null
          display_from: string | null
          display_until: string | null
          id: string
          is_active: boolean | null
          target_roles: string[] | null
        }
        Insert: {
          announcement_content: string
          announcement_title: string
          announcement_type?: string | null
          created_at?: string | null
          created_by?: string | null
          display_from?: string | null
          display_until?: string | null
          id?: string
          is_active?: boolean | null
          target_roles?: string[] | null
        }
        Update: {
          announcement_content?: string
          announcement_title?: string
          announcement_type?: string | null
          created_at?: string | null
          created_by?: string | null
          display_from?: string | null
          display_until?: string | null
          id?: string
          is_active?: boolean | null
          target_roles?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "system_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health_checks: {
        Row: {
          check_timestamp: string
          check_type: string
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          response_time_ms: number
          status: string
        }
        Insert: {
          check_timestamp?: string
          check_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms: number
          status: string
        }
        Update: {
          check_timestamp?: string
          check_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number
          status?: string
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          id: string
          metric_name: string
          metric_unit: string | null
          metric_value: number
          recorded_at: string | null
        }
        Insert: {
          id?: string
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          recorded_at?: string | null
        }
        Update: {
          id?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          recorded_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
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
          status: string | null
          title: string
          tsv: unknown
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
          status?: string | null
          title: string
          tsv?: unknown
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
          status?: string | null
          title?: string
          tsv?: unknown
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
      teacher_analytics_cache: {
        Row: {
          calculated_at: string | null
          class_id: string | null
          id: string
          metric_data: Json
          metric_type: string
          teacher_id: string
          valid_until: string | null
        }
        Insert: {
          calculated_at?: string | null
          class_id?: string | null
          id?: string
          metric_data: Json
          metric_type: string
          teacher_id: string
          valid_until?: string | null
        }
        Update: {
          calculated_at?: string | null
          class_id?: string | null
          id?: string
          metric_data?: Json
          metric_type?: string
          teacher_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_analytics_cache_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "klassen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_analytics_cache_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_rewards: {
        Row: {
          awarded_at: string | null
          id: string
          reason: string | null
          reward_type: string | null
          reward_value: number
          student_id: string
          teacher_id: string
        }
        Insert: {
          awarded_at?: string | null
          id?: string
          reason?: string | null
          reward_type?: string | null
          reward_value: number
          student_id: string
          teacher_id: string
        }
        Update: {
          awarded_at?: string | null
          id?: string
          reason?: string | null
          reward_type?: string | null
          reward_value?: number
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_rewards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_rewards_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      user_points: {
        Row: {
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          created_at: string | null
          evidence_urls: string[] | null
          id: string
          report_reason: string
          report_type: string
          reported_by: string | null
          reported_user_id: string | null
          resolution: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          evidence_urls?: string[] | null
          id?: string
          report_reason: string
          report_type: string
          reported_by?: string | null
          reported_user_id?: string | null
          resolution?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          evidence_urls?: string[] | null
          id?: string
          report_reason?: string
          report_type?: string
          reported_by?: string | null
          reported_user_id?: string | null
          resolution?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_security_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
          explanation: Json | null
          hints: Json[] | null
          id: string
          interaction_config: Json | null
          niveau_id: string
          opties: Json | null
          question_type: string | null
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
          explanation?: Json | null
          hints?: Json[] | null
          id?: string
          interaction_config?: Json | null
          niveau_id: string
          opties?: Json | null
          question_type?: string | null
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
          explanation?: Json | null
          hints?: Json[] | null
          id?: string
          interaction_config?: Json | null
          niveau_id?: string
          opties?: Json | null
          question_type?: string | null
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
      waiting_list: {
        Row: {
          enrollment_id: string
          expires_at: string | null
          id: string
          notes: string | null
          notified_at: string | null
          priority: number | null
          requested_at: string
          status: string
        }
        Insert: {
          enrollment_id: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          priority?: number | null
          requested_at?: string
          status?: string
        }
        Update: {
          enrollment_id?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          priority?: number | null
          requested_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiting_list_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_activities: {
        Row: {
          activity_type: string
          context: Json
          created_at: string
          id: string
          student_id: string
          xp_earned: number
        }
        Insert: {
          activity_type: string
          context?: Json
          created_at?: string
          id?: string
          student_id: string
          xp_earned: number
        }
        Update: {
          activity_type?: string
          context?: Json
          created_at?: string
          id?: string
          student_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
    }
    Views: {
      global_search_index: {
        Row: {
          body: string | null
          class_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          title: string | null
          tsv: unknown
        }
        Relationships: []
      }
    }
    Functions: {
      change_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          reason?: string
          target_user_id: string
        }
        Returns: Json
      }
      check_metric_threshold: {
        Args: { p_metric_type: string; p_metric_value: number }
        Returns: undefined
      }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_identifier: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      export_user_data: { Args: { p_user_id: string }; Returns: Json }
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
      get_total_niveau_points: {
        Args: { p_niveau_id: string; p_student_id: string }
        Returns: number
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role_name: { Args: { user_id: string }; Returns: string }
      get_web_vitals_summary: {
        Args: { days_ago?: number }
        Returns: {
          metrics: Database["public"]["CompositeTypes"]["web_vital_row"]
          trends: Record<string, unknown>
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_enrolled_in_class: {
        Args: { _class: string; _user: string }
        Returns: boolean
      }
      is_service_role: { Args: never; Returns: boolean }
      is_teacher_of_class: {
        Args: { _class: string; _user: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_entity_id?: string
          p_entity_type: string
          p_meta?: Json
        }
        Returns: undefined
      }
      mark_messages_read: {
        Args: { receiver_id: string; sender_id: string }
        Returns: undefined
      }
      search_global: {
        Args: {
          p_class_id?: string
          p_limit?: number
          p_offset?: number
          p_query: string
        }
        Returns: {
          body: string
          class_id: string
          created_at: string
          entity_id: string
          entity_type: string
          rank: number
          title: string
        }[]
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
      web_vital_row: {
        metric: string | null
        rating: string | null
        avg_value: number | null
        p75_value: number | null
        sample_count: number | null
      }
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
