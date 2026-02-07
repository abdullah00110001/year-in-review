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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accountability_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accountability_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "accountability_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      accountability_groups: {
        Row: {
          can_approve_unlock: boolean | null
          can_extend_focus: boolean | null
          can_send_encouragement: boolean | null
          can_view_shield_status: boolean | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          invite_code: string | null
          name: string
          notification_level: string | null
          updated_at: string
        }
        Insert: {
          can_approve_unlock?: boolean | null
          can_extend_focus?: boolean | null
          can_send_encouragement?: boolean | null
          can_view_shield_status?: boolean | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          invite_code?: string | null
          name: string
          notification_level?: string | null
          updated_at?: string
        }
        Update: {
          can_approve_unlock?: boolean | null
          can_extend_focus?: boolean | null
          can_send_encouragement?: boolean | null
          can_view_shield_status?: boolean | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          name?: string
          notification_level?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      activity_tags: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          name_bn: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          name_bn: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          name_bn?: string
        }
        Relationships: []
      }
      admin_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_resolved: boolean | null
          message: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_feedback: {
        Row: {
          admin_id: string
          created_at: string
          daily_entry_id: string | null
          date: string
          feedback_type: string
          id: string
          is_private: boolean | null
          message: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          daily_entry_id?: string | null
          date?: string
          feedback_type: string
          id?: string
          is_private?: boolean | null
          message: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          daily_entry_id?: string | null
          date?: string
          feedback_type?: string
          id?: string
          is_private?: boolean | null
          message?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_feedback_daily_entry_id_fkey"
            columns: ["daily_entry_id"]
            isOneToOne: false
            referencedRelation: "daily_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      challenges: {
        Row: {
          badge_icon: string | null
          badge_name: string | null
          challenge_type: string
          created_at: string
          description: string
          description_bn: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          mode: string | null
          reward_points: number
          start_date: string | null
          target_metric: string
          target_value: number
          title: string
          title_bn: string | null
        }
        Insert: {
          badge_icon?: string | null
          badge_name?: string | null
          challenge_type?: string
          created_at?: string
          description: string
          description_bn?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          mode?: string | null
          reward_points?: number
          start_date?: string | null
          target_metric: string
          target_value: number
          title: string
          title_bn?: string | null
        }
        Update: {
          badge_icon?: string | null
          badge_name?: string | null
          challenge_type?: string
          created_at?: string
          description?: string
          description_bn?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          mode?: string | null
          reward_points?: number
          start_date?: string | null
          target_metric?: string
          target_value?: number
          title?: string
          title_bn?: string | null
        }
        Relationships: []
      }
      daily_entries: {
        Row: {
          akhirah_score: number | null
          asr_completed: boolean | null
          asr_on_time: boolean | null
          barakah_index: number | null
          biggest_time_leak: string | null
          created_at: string
          current_mood: string | null
          date: string
          day_reset_time: string | null
          day_reset_used: boolean | null
          device_time_minutes: number | null
          dhuhr_completed: boolean | null
          dhuhr_on_time: boolean | null
          discipline_level: number | null
          dunya_score: number | null
          energy_level: number | null
          exercise_done: boolean | null
          exercise_duration_minutes: number | null
          exercise_intensity: string | null
          exercise_type: string | null
          fajr_completed: boolean | null
          fajr_on_time: boolean | null
          focus_level: number | null
          focused_study_minutes: number | null
          free_reflection: string | null
          id: string
          is_locked: boolean | null
          isha_completed: boolean | null
          isha_on_time: boolean | null
          khushu_level: number | null
          locked_at: string | null
          maghrib_completed: boolean | null
          maghrib_on_time: boolean | null
          mawt_preparedness: number | null
          mental_state: string | null
          mindless_scrolling_minutes: number | null
          most_important_task: string | null
          niyyah_type: string | null
          overall_day_rating: number | null
          quran_ayah_from: number | null
          quran_ayah_to: number | null
          quran_minutes: number | null
          quran_mood_shift: boolean | null
          quran_read: boolean | null
          quran_surah: string | null
          quran_type: string | null
          regret_of_day: string | null
          revision_minutes: number | null
          service_hours: number | null
          service_type: string | null
          session_value_rating: number | null
          shorts_reels_minutes: number | null
          skill_learning_minutes: number | null
          sleep_duration_minutes: number | null
          sleep_end_time: string | null
          sleep_quality: number | null
          sleep_start_time: string | null
          social_media_minutes: number | null
          tahajjud_performed: boolean | null
          task_status: string | null
          updated_at: string
          urges_resisted: number | null
          urges_succumbed: number | null
          user_id: string
          weighted_daily_score: number | null
        }
        Insert: {
          akhirah_score?: number | null
          asr_completed?: boolean | null
          asr_on_time?: boolean | null
          barakah_index?: number | null
          biggest_time_leak?: string | null
          created_at?: string
          current_mood?: string | null
          date?: string
          day_reset_time?: string | null
          day_reset_used?: boolean | null
          device_time_minutes?: number | null
          dhuhr_completed?: boolean | null
          dhuhr_on_time?: boolean | null
          discipline_level?: number | null
          dunya_score?: number | null
          energy_level?: number | null
          exercise_done?: boolean | null
          exercise_duration_minutes?: number | null
          exercise_intensity?: string | null
          exercise_type?: string | null
          fajr_completed?: boolean | null
          fajr_on_time?: boolean | null
          focus_level?: number | null
          focused_study_minutes?: number | null
          free_reflection?: string | null
          id?: string
          is_locked?: boolean | null
          isha_completed?: boolean | null
          isha_on_time?: boolean | null
          khushu_level?: number | null
          locked_at?: string | null
          maghrib_completed?: boolean | null
          maghrib_on_time?: boolean | null
          mawt_preparedness?: number | null
          mental_state?: string | null
          mindless_scrolling_minutes?: number | null
          most_important_task?: string | null
          niyyah_type?: string | null
          overall_day_rating?: number | null
          quran_ayah_from?: number | null
          quran_ayah_to?: number | null
          quran_minutes?: number | null
          quran_mood_shift?: boolean | null
          quran_read?: boolean | null
          quran_surah?: string | null
          quran_type?: string | null
          regret_of_day?: string | null
          revision_minutes?: number | null
          service_hours?: number | null
          service_type?: string | null
          session_value_rating?: number | null
          shorts_reels_minutes?: number | null
          skill_learning_minutes?: number | null
          sleep_duration_minutes?: number | null
          sleep_end_time?: string | null
          sleep_quality?: number | null
          sleep_start_time?: string | null
          social_media_minutes?: number | null
          tahajjud_performed?: boolean | null
          task_status?: string | null
          updated_at?: string
          urges_resisted?: number | null
          urges_succumbed?: number | null
          user_id: string
          weighted_daily_score?: number | null
        }
        Update: {
          akhirah_score?: number | null
          asr_completed?: boolean | null
          asr_on_time?: boolean | null
          barakah_index?: number | null
          biggest_time_leak?: string | null
          created_at?: string
          current_mood?: string | null
          date?: string
          day_reset_time?: string | null
          day_reset_used?: boolean | null
          device_time_minutes?: number | null
          dhuhr_completed?: boolean | null
          dhuhr_on_time?: boolean | null
          discipline_level?: number | null
          dunya_score?: number | null
          energy_level?: number | null
          exercise_done?: boolean | null
          exercise_duration_minutes?: number | null
          exercise_intensity?: string | null
          exercise_type?: string | null
          fajr_completed?: boolean | null
          fajr_on_time?: boolean | null
          focus_level?: number | null
          focused_study_minutes?: number | null
          free_reflection?: string | null
          id?: string
          is_locked?: boolean | null
          isha_completed?: boolean | null
          isha_on_time?: boolean | null
          khushu_level?: number | null
          locked_at?: string | null
          maghrib_completed?: boolean | null
          maghrib_on_time?: boolean | null
          mawt_preparedness?: number | null
          mental_state?: string | null
          mindless_scrolling_minutes?: number | null
          most_important_task?: string | null
          niyyah_type?: string | null
          overall_day_rating?: number | null
          quran_ayah_from?: number | null
          quran_ayah_to?: number | null
          quran_minutes?: number | null
          quran_mood_shift?: boolean | null
          quran_read?: boolean | null
          quran_surah?: string | null
          quran_type?: string | null
          regret_of_day?: string | null
          revision_minutes?: number | null
          service_hours?: number | null
          service_type?: string | null
          session_value_rating?: number | null
          shorts_reels_minutes?: number | null
          skill_learning_minutes?: number | null
          sleep_duration_minutes?: number | null
          sleep_end_time?: string | null
          sleep_quality?: number | null
          sleep_start_time?: string | null
          social_media_minutes?: number | null
          tahajjud_performed?: boolean | null
          task_status?: string | null
          updated_at?: string
          urges_resisted?: number | null
          urges_succumbed?: number | null
          user_id?: string
          weighted_daily_score?: number | null
        }
        Relationships: []
      }
      daily_intentions: {
        Row: {
          created_at: string
          date: string
          evening_reflection: string | null
          id: string
          morning_intention: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          evening_reflection?: string | null
          id?: string
          morning_intention?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          evening_reflection?: string | null
          id?: string
          morning_intention?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          created_at: string
          date: string
          hours: number | null
          id: string
          mood: string | null
          notes: string | null
          tag_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          hours?: number | null
          id?: string
          mood?: string | null
          notes?: string | null
          tag_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          hours?: number | null
          id?: string
          mood?: string | null
          notes?: string | null
          tag_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "activity_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_profiles: {
        Row: {
          allowed_apps: Json | null
          auto_triggers: Json | null
          block_adult_content: boolean | null
          block_infinite_content: boolean | null
          blocked_apps: Json | null
          blocked_keywords: Json | null
          blocked_websites: Json | null
          created_at: string
          default_duration_minutes: number | null
          description: string | null
          duration_type: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_preset: boolean | null
          name: string
          schedule: Json | null
          strictness_level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed_apps?: Json | null
          auto_triggers?: Json | null
          block_adult_content?: boolean | null
          block_infinite_content?: boolean | null
          blocked_apps?: Json | null
          blocked_keywords?: Json | null
          blocked_websites?: Json | null
          created_at?: string
          default_duration_minutes?: number | null
          description?: string | null
          duration_type?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_preset?: boolean | null
          name: string
          schedule?: Json | null
          strictness_level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed_apps?: Json | null
          auto_triggers?: Json | null
          block_adult_content?: boolean | null
          block_infinite_content?: boolean | null
          blocked_apps?: Json | null
          blocked_keywords?: Json | null
          blocked_websites?: Json | null
          created_at?: string
          default_duration_minutes?: number | null
          description?: string | null
          duration_type?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_preset?: boolean | null
          name?: string
          schedule?: Json | null
          strictness_level?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      discipline_scores: {
        Row: {
          bypass_penalty: number | null
          can_use_absolute_mode: boolean | null
          consistency_bonus: number | null
          created_at: string
          current_score: number | null
          current_streak_days: number | null
          focus_completion_score: number | null
          id: string
          longest_streak_days: number | null
          time_saved_bonus: number | null
          total_focus_minutes: number | null
          total_time_saved_minutes: number | null
          unlock_penalty: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bypass_penalty?: number | null
          can_use_absolute_mode?: boolean | null
          consistency_bonus?: number | null
          created_at?: string
          current_score?: number | null
          current_streak_days?: number | null
          focus_completion_score?: number | null
          id?: string
          longest_streak_days?: number | null
          time_saved_bonus?: number | null
          total_focus_minutes?: number | null
          total_time_saved_minutes?: number | null
          unlock_penalty?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bypass_penalty?: number | null
          can_use_absolute_mode?: boolean | null
          consistency_bonus?: number | null
          created_at?: string
          current_score?: number | null
          current_streak_days?: number | null
          focus_completion_score?: number | null
          id?: string
          longest_streak_days?: number | null
          time_saved_bonus?: number | null
          total_focus_minutes?: number | null
          total_time_saved_minutes?: number | null
          unlock_penalty?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback_templates: {
        Row: {
          created_at: string
          created_by: string | null
          feedback_type: string
          id: string
          message: string
          mode: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          feedback_type: string
          id?: string
          message: string
          mode?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          feedback_type?: string
          id?: string
          message?: string
          mode?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      future_letters: {
        Row: {
          content: string
          created_at: string
          id: string
          unlock_date: string
          user_id: string
          year: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          unlock_date: string
          user_id: string
          year?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          unlock_date?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          target_completion: number | null
          title: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          target_completion?: number | null
          title: string
          updated_at?: string
          user_id: string
          year?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          target_completion?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      group_wake_status: {
        Row: {
          alarm_log_id: string | null
          confirmed_at: string | null
          created_at: string
          group_id: string
          id: string
          needs_help: boolean | null
          scheduled_time: string | null
          status: string | null
          updated_at: string
          user_id: string
          wake_date: string
          woke_at: string | null
        }
        Insert: {
          alarm_log_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          group_id: string
          id?: string
          needs_help?: boolean | null
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          wake_date?: string
          woke_at?: string | null
        }
        Update: {
          alarm_log_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          group_id?: string
          id?: string
          needs_help?: boolean | null
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          wake_date?: string
          woke_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_wake_status_alarm_log_id_fkey"
            columns: ["alarm_log_id"]
            isOneToOne: false
            referencedRelation: "rise_alarm_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_wake_status_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "accountability_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_entries: {
        Row: {
          completed: boolean | null
          created_at: string
          date: string
          habit_id: string
          id: string
          notes: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          date?: string
          habit_id: string
          id?: string
          notes?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          date?: string
          habit_id?: string
          id?: string
          notes?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_entries_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          frequency: string
          goal_id: string | null
          id: string
          is_active: boolean | null
          name: string
          target_per_period: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          frequency?: string
          goal_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          target_per_period?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          frequency?: string
          goal_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          target_per_period?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_items: {
        Row: {
          author: string | null
          completed_date: string | null
          cover_url: string | null
          created_at: string
          id: string
          notes: string | null
          rating: number | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author?: string | null
          completed_date?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rating?: number | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author?: string | null
          completed_date?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rating?: number | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_highlights: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          month: number
          note: string | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          month: number
          note?: string | null
          updated_at?: string
          user_id: string
          year?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          month?: number
          note?: string | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      motivational_quotes: {
        Row: {
          author: string | null
          created_at: string
          id: string
          quote: string
          quote_bn: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          id?: string
          quote: string
          quote_bn: string
        }
        Update: {
          author?: string | null
          created_at?: string
          id?: string
          quote?: string
          quote_bn?: string
        }
        Relationships: []
      }
      nafs_logs: {
        Row: {
          ayah_shown: string | null
          created_at: string
          date: string
          id: string
          resisted: boolean
          triggered_at: string
          urge_type: string | null
          user_id: string
        }
        Insert: {
          ayah_shown?: string | null
          created_at?: string
          date?: string
          id?: string
          resisted: boolean
          triggered_at?: string
          urge_type?: string | null
          user_id: string
        }
        Update: {
          ayah_shown?: string | null
          created_at?: string
          date?: string
          id?: string
          resisted?: boolean
          triggered_at?: string
          urge_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      night_muhasaba: {
        Row: {
          created_at: string
          daily_entry_id: string | null
          date: string
          fix_tomorrow: string | null
          harmful_habit: string | null
          helpful_habit: string | null
          id: string
          submitted_at: string | null
          user_id: string
          what_went_right: string | null
          what_went_wrong: string | null
        }
        Insert: {
          created_at?: string
          daily_entry_id?: string | null
          date?: string
          fix_tomorrow?: string | null
          harmful_habit?: string | null
          helpful_habit?: string | null
          id?: string
          submitted_at?: string | null
          user_id: string
          what_went_right?: string | null
          what_went_wrong?: string | null
        }
        Update: {
          created_at?: string
          daily_entry_id?: string | null
          date?: string
          fix_tomorrow?: string | null
          harmful_habit?: string | null
          helpful_habit?: string | null
          id?: string
          submitted_at?: string | null
          user_id?: string
          what_went_right?: string | null
          what_went_wrong?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "night_muhasaba_daily_entry_id_fkey"
            columns: ["daily_entry_id"]
            isOneToOne: false
            referencedRelation: "daily_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          achievement_alerts: boolean | null
          challenge_updates: boolean | null
          created_at: string
          daily_input_reminder: boolean | null
          habit_reminders: boolean | null
          id: string
          mentor_messages: boolean | null
          prayer_reminders: boolean | null
          reminder_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_alerts?: boolean | null
          challenge_updates?: boolean | null
          created_at?: string
          daily_input_reminder?: boolean | null
          habit_reminders?: boolean | null
          id?: string
          mentor_messages?: boolean | null
          prayer_reminders?: boolean | null
          reminder_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_alerts?: boolean | null
          challenge_updates?: boolean | null
          created_at?: string
          daily_input_reminder?: boolean | null
          habit_reminders?: boolean | null
          id?: string
          mentor_messages?: boolean | null
          prayer_reminders?: boolean | null
          reminder_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          app_mode: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          language: string | null
          location: string | null
          notifications_enabled: boolean | null
          phone: string | null
          push_subscription: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_mode?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string | null
          location?: string | null
          notifications_enabled?: boolean | null
          phone?: string | null
          push_subscription?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_mode?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string | null
          location?: string | null
          notifications_enabled?: boolean | null
          phone?: string | null
          push_subscription?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          is_active: boolean | null
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean | null
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean | null
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quarterly_goals: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          quarter: number
          title: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          quarter: number
          title: string
          updated_at?: string
          user_id: string
          year?: number
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          quarter?: number
          title?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      quranic_anchors: {
        Row: {
          arabic_text: string | null
          ayah_end: number
          ayah_start: number
          benefit: string | null
          bengali_translation: string | null
          created_at: string
          english_translation: string | null
          id: string
          mood: string
          mood_bn: string
          surah_name: string
          surah_number: number
        }
        Insert: {
          arabic_text?: string | null
          ayah_end: number
          ayah_start: number
          benefit?: string | null
          bengali_translation?: string | null
          created_at?: string
          english_translation?: string | null
          id?: string
          mood: string
          mood_bn: string
          surah_name: string
          surah_number: number
        }
        Update: {
          arabic_text?: string | null
          ayah_end?: number
          ayah_start?: number
          benefit?: string | null
          bengali_translation?: string | null
          created_at?: string
          english_translation?: string | null
          id?: string
          mood?: string
          mood_bn?: string
          surah_name?: string
          surah_number?: number
        }
        Relationships: []
      }
      reflection_prompts: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          mode: string | null
          mood_trigger: string[] | null
          prompt_text: string
          prompt_text_bn: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          mode?: string | null
          mood_trigger?: string[] | null
          prompt_text: string
          prompt_text_bn?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          mode?: string | null
          mood_trigger?: string[] | null
          prompt_text?: string
          prompt_text_bn?: string | null
        }
        Relationships: []
      }
      reflections: {
        Row: {
          challenges: string | null
          content: string | null
          created_at: string
          id: string
          intentions: string | null
          mood: number | null
          updated_at: string
          user_id: string
          week_start: string
          wins: string | null
        }
        Insert: {
          challenges?: string | null
          content?: string | null
          created_at?: string
          id?: string
          intentions?: string | null
          mood?: number | null
          updated_at?: string
          user_id: string
          week_start: string
          wins?: string | null
        }
        Update: {
          challenges?: string | null
          content?: string | null
          created_at?: string
          id?: string
          intentions?: string | null
          mood?: number | null
          updated_at?: string
          user_id?: string
          week_start?: string
          wins?: string | null
        }
        Relationships: []
      }
      rise_alarm_logs: {
        Row: {
          actual_wake_time: string | null
          alarm_id: string | null
          created_at: string
          feeling: string | null
          friend_wake_signal_sent: boolean | null
          group_help_requested: boolean | null
          id: string
          minutes_late: number | null
          scheduled_time: string
          snooze_count: number | null
          status: string | null
          user_id: string
          verification_completed: boolean | null
        }
        Insert: {
          actual_wake_time?: string | null
          alarm_id?: string | null
          created_at?: string
          feeling?: string | null
          friend_wake_signal_sent?: boolean | null
          group_help_requested?: boolean | null
          id?: string
          minutes_late?: number | null
          scheduled_time: string
          snooze_count?: number | null
          status?: string | null
          user_id: string
          verification_completed?: boolean | null
        }
        Update: {
          actual_wake_time?: string | null
          alarm_id?: string | null
          created_at?: string
          feeling?: string | null
          friend_wake_signal_sent?: boolean | null
          group_help_requested?: boolean | null
          id?: string
          minutes_late?: number | null
          scheduled_time?: string
          snooze_count?: number | null
          status?: string | null
          user_id?: string
          verification_completed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "rise_alarm_logs_alarm_id_fkey"
            columns: ["alarm_id"]
            isOneToOne: false
            referencedRelation: "rise_alarms"
            referencedColumns: ["id"]
          },
        ]
      }
      rise_alarms: {
        Row: {
          alarm_time: string
          alarm_type: string | null
          allow_friend_enforce: boolean | null
          created_at: string
          days_of_week: number[] | null
          group_id: string | null
          id: string
          intention: string | null
          is_enabled: boolean | null
          is_intention_shared: boolean | null
          label: string | null
          snooze_interval_minutes: number | null
          snooze_limit: number | null
          sound_type: string | null
          updated_at: string
          user_id: string
          verification_type: string | null
          vibration_enabled: boolean | null
          who_depends: string | null
        }
        Insert: {
          alarm_time: string
          alarm_type?: string | null
          allow_friend_enforce?: boolean | null
          created_at?: string
          days_of_week?: number[] | null
          group_id?: string | null
          id?: string
          intention?: string | null
          is_enabled?: boolean | null
          is_intention_shared?: boolean | null
          label?: string | null
          snooze_interval_minutes?: number | null
          snooze_limit?: number | null
          sound_type?: string | null
          updated_at?: string
          user_id: string
          verification_type?: string | null
          vibration_enabled?: boolean | null
          who_depends?: string | null
        }
        Update: {
          alarm_time?: string
          alarm_type?: string | null
          allow_friend_enforce?: boolean | null
          created_at?: string
          days_of_week?: number[] | null
          group_id?: string | null
          id?: string
          intention?: string | null
          is_enabled?: boolean | null
          is_intention_shared?: boolean | null
          label?: string | null
          snooze_interval_minutes?: number | null
          snooze_limit?: number | null
          sound_type?: string | null
          updated_at?: string
          user_id?: string
          verification_type?: string | null
          vibration_enabled?: boolean | null
          who_depends?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rise_alarms_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "accountability_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      rise_streaks: {
        Row: {
          created_at: string
          current_streak: number | null
          id: string
          is_recovery_mode: boolean | null
          last_wake_date: string | null
          longest_streak: number | null
          recovery_started_at: string | null
          total_alarms: number | null
          total_on_time_wakes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          id?: string
          is_recovery_mode?: boolean | null
          last_wake_date?: string | null
          longest_streak?: number | null
          recovery_started_at?: string | null
          total_alarms?: number | null
          total_on_time_wakes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          id?: string
          is_recovery_mode?: boolean | null
          last_wake_date?: string | null
          longest_streak?: number | null
          recovery_started_at?: string | null
          total_alarms?: number | null
          total_on_time_wakes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_logs: {
        Row: {
          beneficiary: string | null
          created_at: string
          date: string
          hours: number
          id: string
          mood_after: number | null
          mood_before: number | null
          notes: string | null
          service_type: string
          user_id: string
        }
        Insert: {
          beneficiary?: string | null
          created_at?: string
          date?: string
          hours?: number
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          notes?: string | null
          service_type: string
          user_id: string
        }
        Update: {
          beneficiary?: string | null
          created_at?: string
          date?: string
          hours?: number
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          notes?: string | null
          service_type?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_achievements: {
        Row: {
          achievement_data: Json
          achievement_type: string
          id: string
          platform: string | null
          shared_at: string
          user_id: string
        }
        Insert: {
          achievement_data: Json
          achievement_type: string
          id?: string
          platform?: string | null
          shared_at?: string
          user_id: string
        }
        Update: {
          achievement_data?: Json
          achievement_type?: string
          id?: string
          platform?: string | null
          shared_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shield_bypass_logs: {
        Row: {
          attempt_type: string
          created_at: string
          details: Json | null
          id: string
          session_id: string | null
          user_id: string
          was_blocked: boolean | null
        }
        Insert: {
          attempt_type: string
          created_at?: string
          details?: Json | null
          id?: string
          session_id?: string | null
          user_id: string
          was_blocked?: boolean | null
        }
        Update: {
          attempt_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          session_id?: string | null
          user_id?: string
          was_blocked?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "shield_bypass_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "shield_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      shield_sessions: {
        Row: {
          actual_end_at: string | null
          apps_blocked_count: number | null
          bypass_attempts: number | null
          completed_successfully: boolean | null
          created_at: string
          early_exit_reason: string | null
          id: string
          profile_id: string | null
          profile_name: string
          scheduled_end_at: string | null
          sites_blocked_count: number | null
          started_at: string
          status: string | null
          strictness_level: string
          time_saved_minutes: number | null
          user_id: string
        }
        Insert: {
          actual_end_at?: string | null
          apps_blocked_count?: number | null
          bypass_attempts?: number | null
          completed_successfully?: boolean | null
          created_at?: string
          early_exit_reason?: string | null
          id?: string
          profile_id?: string | null
          profile_name: string
          scheduled_end_at?: string | null
          sites_blocked_count?: number | null
          started_at?: string
          status?: string | null
          strictness_level?: string
          time_saved_minutes?: number | null
          user_id: string
        }
        Update: {
          actual_end_at?: string | null
          apps_blocked_count?: number | null
          bypass_attempts?: number | null
          completed_successfully?: boolean | null
          created_at?: string
          early_exit_reason?: string | null
          id?: string
          profile_id?: string | null
          profile_name?: string
          scheduled_end_at?: string | null
          sites_blocked_count?: number | null
          started_at?: string
          status?: string | null
          strictness_level?: string
          time_saved_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shield_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "discipline_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      small_wins: {
        Row: {
          content: string
          created_at: string
          date: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          date?: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          barakah_score: number | null
          created_at: string
          date: string
          duration_minutes: number
          ended_at: string | null
          id: string
          niyyah: string
          niyyah_multiplier: number
          session_type: string | null
          session_value: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          barakah_score?: number | null
          created_at?: string
          date?: string
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          niyyah: string
          niyyah_multiplier?: number
          session_type?: string | null
          session_value?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          barakah_score?: number | null
          created_at?: string
          date?: string
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          niyyah?: string
          niyyah_multiplier?: number
          session_type?: string | null
          session_value?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          activity: string | null
          created_at: string
          date: string
          hours: number
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity?: string | null
          created_at?: string
          date?: string
          hours?: number
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity?: string | null
          created_at?: string
          date?: string
          hours?: number
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      unlock_request_responses: {
        Row: {
          created_at: string
          extend_minutes: number | null
          id: string
          message: string | null
          request_id: string
          responder_id: string
          response: string
        }
        Insert: {
          created_at?: string
          extend_minutes?: number | null
          id?: string
          message?: string | null
          request_id: string
          responder_id: string
          response: string
        }
        Update: {
          created_at?: string
          extend_minutes?: number | null
          id?: string
          message?: string | null
          request_id?: string
          responder_id?: string
          response?: string
        }
        Relationships: [
          {
            foreignKeyName: "unlock_request_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "unlock_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      unlock_requests: {
        Row: {
          approvals_received: number | null
          approvals_required: number | null
          created_at: string
          expires_at: string | null
          group_id: string | null
          id: string
          reason: string
          resolved_at: string | null
          session_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          approvals_received?: number | null
          approvals_required?: number | null
          created_at?: string
          expires_at?: string | null
          group_id?: string | null
          id?: string
          reason: string
          resolved_at?: string | null
          session_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          approvals_received?: number | null
          approvals_required?: number | null
          created_at?: string
          expires_at?: string | null
          group_id?: string | null
          id?: string
          reason?: string
          resolved_at?: string | null
          session_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unlock_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "accountability_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unlock_requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "shield_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_description: string | null
          badge_icon: string | null
          badge_name: string
          earned_at: string
          id: string
          source_challenge_id: string | null
          user_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_name: string
          earned_at?: string
          id?: string
          source_challenge_id?: string | null
          user_id: string
        }
        Update: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_name?: string
          earned_at?: string
          id?: string
          source_challenge_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_source_challenge_id_fkey"
            columns: ["source_challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          id: string
          is_completed: boolean | null
          joined_at: string
          progress: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          joined_at?: string
          progress?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          joined_at?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reflections: {
        Row: {
          created_at: string
          custom_prompt: string | null
          id: string
          mood_after: number | null
          mood_before: number | null
          prompt_id: string | null
          reflection_date: string
          response: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_prompt?: string | null
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          prompt_id?: string | null
          reflection_date?: string
          response: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_prompt?: string | null
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          prompt_id?: string | null
          reflection_date?: string
          response?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reflections_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "reflection_prompts"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_scores: {
        Row: {
          consistency_index: number | null
          created_at: string
          date: string
          deen_score: number | null
          discipline_score: number | null
          focus_score: number | null
          id: string
          level: number | null
          productivity_score: number | null
          quran_streak: number | null
          salah_streak: number | null
          study_streak: number | null
          total_points: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          consistency_index?: number | null
          created_at?: string
          date?: string
          deen_score?: number | null
          discipline_score?: number | null
          focus_score?: number | null
          id?: string
          level?: number | null
          productivity_score?: number | null
          quran_streak?: number | null
          salah_streak?: number | null
          study_streak?: number | null
          total_points?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          consistency_index?: number | null
          created_at?: string
          date?: string
          deen_score?: number | null
          discipline_score?: number | null
          focus_score?: number | null
          id?: string
          level?: number | null
          productivity_score?: number | null
          quran_streak?: number | null
          salah_streak?: number | null
          study_streak?: number | null
          total_points?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_segments: {
        Row: {
          created_at: string
          created_by: string | null
          criteria: Json
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          criteria?: Json
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          criteria?: Json
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
