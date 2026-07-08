export type UserRole = 'admin' | 'doctor'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  created_at: string
}

export interface Patient {
  patient_id: string
  name: string
  age: number
  gender: string
  created_at: string
}

export interface AnalysisHistory {
  analysis_id: string
  patient_id: string
  doctor_id: string | null
  image_url: string | null
  top_finding: string
  confidence_score: number
  raw_predictions: any
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: { name: string; email: string; role: UserRole }
        Update: { name?: string; email?: string; role?: UserRole }
      }
      patients: {
        Row: Patient
        Insert: { patient_id?: string; name: string; age: number; gender: string }
        Update: { name?: string; age?: number; gender?: string }
      }
      history: {
        Row: AnalysisHistory
        Insert: { analysis_id?: string; patient_id: string; doctor_id: string | null; image_url: string | null; top_finding: string; confidence_score: number; raw_predictions: any }
        Update: { doctor_id?: string | null; image_url?: string | null; top_finding?: string; confidence_score?: number; raw_predictions?: any }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
