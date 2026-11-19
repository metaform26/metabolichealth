export type UserRole = 'patient' | 'clinician' | 'coach' | 'admin'

type UserHealthProfileOptionalColumn =
  | 'target_weight_lbs' | 'target_body_fat_percent' | 'target_days' | 'condition_focus'
  | 'baseline_weight_lbs' | 'baseline_body_fat_percent' | 'baseline_waist_inches'
  | 'baseline_bmi' | 'baseline_lean_mass_lbs' | 'baseline_date'

export type Json =string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          role: UserRole
          full_name: string | null
          date_of_birth: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      user_health_profiles: {
        Row: {
          id: string
          user_id: string
          age: number
          sex: 'male' | 'female'
          height_inches: number
          weight_lbs: number
          body_fat_percent: number | null
          waist_inches: number | null
          activity_level: string
          goal: string
          on_glp1: boolean
          symptoms: string[]
          conditions: string[]
          // Columns added in the live database outside the migrations
          // (written by Onboarding/Profile).
          target_weight_lbs: number | null
          target_body_fat_percent: number | null
          target_days: number | null
          condition_focus: string[] | null
          baseline_weight_lbs: number | null
          baseline_body_fat_percent: number | null
          baseline_waist_inches: number | null
          baseline_bmi: number | null
          baseline_lean_mass_lbs: number | null
          baseline_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['user_health_profiles']['Row'],
          'id' | 'created_at' | 'updated_at' | UserHealthProfileOptionalColumn
        > & Partial<Pick<Database['public']['Tables']['user_health_profiles']['Row'], UserHealthProfileOptionalColumn>>
        Update: Partial<Database['public']['Tables']['user_health_profiles']['Insert']>
        Relationships: []
      }
      meal_logs: {
        Row: {
          id: string
          user_id: string
          logged_at: string
          meal_type: string
          name: string
          calories: number
          protein_g: number
          carbs_g: number | null
          fat_g: number | null
          fiber_g: number | null
          serving_description: string | null
          source: 'manual' | 'photo' | 'api'
        }
        Insert: Omit<Database['public']['Tables']['meal_logs']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['meal_logs']['Insert']>
        Relationships: []
      }
      daily_tracking: {
        Row: {
          id: string
          user_id: string
          date: string
          steps: number | null
          water_ml: number | null
          sleep_hours: number | null
          heart_rate_resting: number | null
          glucose_fasting: number | null
          glucose_post_meal: number | null
          exercise_minutes: number | null
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['daily_tracking']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['daily_tracking']['Insert']>
        Relationships: []
      }
      progress_check_ins: {
        Row: {
          id: string
          user_id: string
          date: string
          weight_lbs: number | null
          waist_inches: number | null
          body_fat_percent: number | null
          target_weight: number | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['progress_check_ins']['Row'], 'id' | 'created_at' | 'target_weight' | 'notes'> & {
          target_weight?: number | null
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['progress_check_ins']['Insert']>
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          subject: string | null
          body: string
          read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: 'basic' | 'coach' | 'clinical'
          billing_cadence: 'monthly' | 'yearly'
          stripe_subscription_id: string | null
          status: 'active' | 'canceled' | 'past_due'
          current_period_end: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
