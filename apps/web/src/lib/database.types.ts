export type UserRole = 'patient' | 'clinician' | 'coach' | 'admin'

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

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
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['user_health_profiles']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Database['public']['Tables']['user_health_profiles']['Insert']>
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
      }
      progress_check_ins: {
        Row: {
          id: string
          user_id: string
          checked_at: string
          weight_lbs: number | null
          waist_inches: number | null
          body_fat_percent: number | null
          target_weight_lbs: number | null
          target_body_fat: number | null
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['progress_check_ins']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['progress_check_ins']['Insert']>
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
      }
    }
  }
}
