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
        Insert: Omit<User, 'created_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      patients: {
        Row: Patient
        Insert: Omit<Patient, 'patient_id' | 'created_at'> & { patient_id?: string }
        Update: Partial<Omit<Patient, 'patient_id' | 'created_at'>>
      }
      history: {
        Row: AnalysisHistory
        Insert: Omit<AnalysisHistory, 'analysis_id' | 'created_at'> & { analysis_id?: string }
        Update: Partial<Omit<AnalysisHistory, 'analysis_id' | 'created_at'>>
      }
    }
  }
}
