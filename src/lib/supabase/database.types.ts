export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          first_name: string;
          last_name: string;
          email: string | null;
          payment_due_day: number;
          payment_block_after_days: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
          first_name?: string;
          last_name?: string;
          email?: string | null;
          payment_due_day?: number;
          payment_block_after_days?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          first_name?: string;
          last_name?: string;
          email?: string | null;
          payment_due_day?: number;
          payment_block_after_days?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      athletes: {
        Row: {
          id: string;
          coach_id: string;
          profile_id: string | null;
          email: string;
          first_name: string;
          last_name: string;
          goal: string;
          birth_date: string | null;
          current_week: number;
          total_weeks: number;
          notes: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          profile_id?: string | null;
          email: string;
          first_name: string;
          last_name?: string;
          goal?: string;
          birth_date?: string | null;
          current_week?: number;
          total_weeks?: number;
          notes?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          profile_id?: string | null;
          email?: string;
          first_name?: string;
          last_name?: string;
          goal?: string;
          birth_date?: string | null;
          current_week?: number;
          total_weeks?: number;
          notes?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "athletes_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "athletes_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      exercises: {
        Row: {
          id: string;
          coach_id: string | null;
          name: string;
          muscle_group: Database["public"]["Enums"]["muscle_group"];
          video_url: string | null;
          cues: string[];
          vigilance_points: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coach_id?: string | null;
          name: string;
          muscle_group: Database["public"]["Enums"]["muscle_group"];
          video_url?: string | null;
          cues?: string[];
          vigilance_points?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string | null;
          name?: string;
          muscle_group?: Database["public"]["Enums"]["muscle_group"];
          video_url?: string | null;
          cues?: string[];
          vigilance_points?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercises_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      program_weeks: {
        Row: {
          id: string;
          athlete_id: string;
          week_number: number;
          status: Database["public"]["Enums"]["week_status"];
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          week_number: number;
          status?: Database["public"]["Enums"]["week_status"];
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          week_number?: number;
          status?: Database["public"]["Enums"]["week_status"];
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "program_weeks_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          id: string;
          program_week_id: string;
          weekday: number;
          scheduled_date: string | null;
          title: string;
          session_type: Database["public"]["Enums"]["session_type"];
          rest_details: string;
          suggested_time: string | null;
          estimated_minutes: number | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          program_week_id: string;
          weekday: number;
          scheduled_date?: string | null;
          title: string;
          session_type?: Database["public"]["Enums"]["session_type"];
          rest_details?: string;
          suggested_time?: string | null;
          estimated_minutes?: number | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          program_week_id?: string;
          weekday?: number;
          scheduled_date?: string | null;
          title?: string;
          session_type?: Database["public"]["Enums"]["session_type"];
          rest_details?: string;
          suggested_time?: string | null;
          estimated_minutes?: number | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_program_week_id_fkey";
            columns: ["program_week_id"];
            isOneToOne: false;
            referencedRelation: "program_weeks";
            referencedColumns: ["id"];
          },
        ];
      };
      session_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          sort_order: number;
          sets_count: number;
          target_reps: number;
          target_weight_kg: number | null;
          target_percent: number | null;
          target_rpe: number | null;
          rest_seconds: number | null;
          coach_note: string;
          superset_group_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_id: string;
          sort_order?: number;
          sets_count: number;
          target_reps: number;
          target_weight_kg?: number | null;
          target_percent?: number | null;
          target_rpe?: number | null;
          rest_seconds?: number | null;
          coach_note?: string;
          superset_group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          exercise_id?: string;
          sort_order?: number;
          sets_count?: number;
          target_reps?: number;
          target_weight_kg?: number | null;
          target_percent?: number | null;
          target_rpe?: number | null;
          rest_seconds?: number | null;
          coach_note?: string;
          superset_group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "session_exercises_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      session_logs: {
        Row: {
          id: string;
          session_id: string;
          athlete_id: string;
          status: Database["public"]["Enums"]["session_log_status"];
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          athlete_id: string;
          status?: Database["public"]["Enums"]["session_log_status"];
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          athlete_id?: string;
          status?: Database["public"]["Enums"]["session_log_status"];
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "session_logs_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: true;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_logs_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
        ];
      };
      session_exercise_logs: {
        Row: {
          id: string;
          session_exercise_id: string;
          athlete_id: string;
          rpe: number | null;
          comment: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_exercise_id: string;
          athlete_id: string;
          rpe?: number | null;
          comment?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_exercise_id?: string;
          athlete_id?: string;
          rpe?: number | null;
          comment?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "session_exercise_logs_session_exercise_id_fkey";
            columns: ["session_exercise_id"];
            isOneToOne: true;
            referencedRelation: "session_exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_exercise_logs_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
        ];
      };
      set_logs: {
        Row: {
          id: string;
          session_exercise_id: string;
          athlete_id: string;
          set_number: number;
          weight_kg: number | null;
          reps: number | null;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_exercise_id: string;
          athlete_id: string;
          set_number: number;
          weight_kg?: number | null;
          reps?: number | null;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_exercise_id?: string;
          athlete_id?: string;
          set_number?: number;
          weight_kg?: number | null;
          reps?: number | null;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "set_logs_session_exercise_id_fkey";
            columns: ["session_exercise_id"];
            isOneToOne: false;
            referencedRelation: "session_exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "set_logs_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
        ];
      };
      check_ins: {
        Row: {
          id: string;
          athlete_id: string;
          program_week_id: string | null;
          week_start_date: string;
          energy: number;
          sleep: number;
          pain: number;
          comment: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          program_week_id?: string | null;
          week_start_date: string;
          energy: number;
          sleep: number;
          pain: number;
          comment?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          program_week_id?: string | null;
          week_start_date?: string;
          energy?: number;
          sleep?: number;
          pain?: number;
          comment?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "check_ins_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "check_ins_program_week_id_fkey";
            columns: ["program_week_id"];
            isOneToOne: false;
            referencedRelation: "program_weeks";
            referencedColumns: ["id"];
          },
        ];
      };
      session_check_ins: {
        Row: {
          id: string;
          athlete_id: string;
          session_id: string;
          energy: number;
          sleep: number;
          pain: number;
          motivation: number;
          comment: string;
          needs_attention: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          session_id: string;
          energy: number;
          sleep: number;
          pain: number;
          motivation: number;
          comment?: string;
          needs_attention?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          session_id?: string;
          energy?: number;
          sleep?: number;
          pain?: number;
          motivation?: number;
          comment?: string;
          needs_attention?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "session_check_ins_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_check_ins_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      athlete_activity_recurrences: {
        Row: {
          id: string;
          athlete_id: string;
          name: string;
          duration_minutes: number;
          rpe_default: number | null;
          weekdays: number[];
          times_per_week: number | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          name: string;
          duration_minutes: number;
          rpe_default?: number | null;
          weekdays?: number[];
          times_per_week?: number | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          name?: string;
          duration_minutes?: number;
          rpe_default?: number | null;
          weekdays?: number[];
          times_per_week?: number | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "athlete_activity_recurrences_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
        ];
      };
      athlete_activities: {
        Row: {
          id: string;
          athlete_id: string;
          recurrence_id: string | null;
          name: string;
          duration_minutes: number;
          rpe: number | null;
          performed_on: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          recurrence_id?: string | null;
          name: string;
          duration_minutes: number;
          rpe?: number | null;
          performed_on: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          recurrence_id?: string | null;
          name?: string;
          duration_minutes?: number;
          rpe?: number | null;
          performed_on?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "athlete_activities_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "athlete_activities_recurrence_id_fkey";
            columns: ["recurrence_id"];
            isOneToOne: false;
            referencedRelation: "athlete_activity_recurrences";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_templates: {
        Row: {
          id: string;
          coach_id: string;
          name: string;
          kind: Database["public"]["Enums"]["workout_template_kind"];
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          name: string;
          kind?: Database["public"]["Enums"]["workout_template_kind"];
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          name?: string;
          kind?: Database["public"]["Enums"]["workout_template_kind"];
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_templates_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_template_exercises: {
        Row: {
          id: string;
          template_id: string;
          exercise_id: string;
          sort_order: number;
          sets_count: number;
          target_reps: number;
          target_weight_kg: number | null;
          target_percent: number | null;
          target_rpe: number | null;
          rest_seconds: number | null;
          coach_note: string;
          superset_group_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          exercise_id: string;
          sort_order?: number;
          sets_count?: number;
          target_reps?: number;
          target_weight_kg?: number | null;
          target_percent?: number | null;
          target_rpe?: number | null;
          rest_seconds?: number | null;
          coach_note?: string;
          superset_group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          template_id?: string;
          exercise_id?: string;
          sort_order?: number;
          sets_count?: number;
          target_reps?: number;
          target_weight_kg?: number | null;
          target_percent?: number | null;
          target_rpe?: number | null;
          rest_seconds?: number | null;
          coach_note?: string;
          superset_group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_template_exercises_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "workout_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_template_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          athlete_id: string;
          period_start: string;
          status: Database["public"]["Enums"]["payment_status"];
          amount_cents: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          period_start: string;
          status?: Database["public"]["Enums"]["payment_status"];
          amount_cents?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          period_start?: string;
          status?: Database["public"]["Enums"]["payment_status"];
          amount_cents?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
        ];
      };
      reminder_logs: {
        Row: {
          id: string;
          athlete_id: string;
          kind: Database["public"]["Enums"]["reminder_kind"];
          channel: Database["public"]["Enums"]["reminder_channel"];
          session_id: string | null;
          program_week_id: string | null;
          sent_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          kind: Database["public"]["Enums"]["reminder_kind"];
          channel?: Database["public"]["Enums"]["reminder_channel"];
          session_id?: string | null;
          program_week_id?: string | null;
          sent_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          kind?: Database["public"]["Enums"]["reminder_kind"];
          channel?: Database["public"]["Enums"]["reminder_channel"];
          session_id?: string | null;
          program_week_id?: string | null;
          sent_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminder_logs_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      coach_create_athlete: {
        Args: {
          p_email: string;
          p_first_name: string;
          p_goal?: string;
          p_last_name: string;
          p_total_weeks?: number;
        };
        Returns: string;
      };
      is_coach: { Args: Record<string, never>; Returns: boolean };
      my_athlete_id: { Args: Record<string, never>; Returns: string };
      is_my_athlete: { Args: { _athlete_id: string }; Returns: boolean };
    };
    Enums: {
      user_role: "coach" | "athlete";
      muscle_group:
        | "jambe"
        | "push"
        | "pull"
        | "core"
        | "cardio"
        | "mobilite"
        | "balistique"
        | "pliometrie";
      week_status: "draft" | "published";
      session_type: "workout" | "rest" | "optional";
      session_log_status: "not_started" | "in_progress" | "completed" | "skipped";
      payment_status: "pending" | "paid";
      reminder_kind: "session_fill" | "week_prepare" | "payment" | "check_in";
      reminder_channel: "email";
      workout_template_kind: "day" | "block";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
