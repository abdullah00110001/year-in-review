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
