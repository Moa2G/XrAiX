'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database, Patient, UserRole } from '@/types/database'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export async function getSessionUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get extended profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return { ...user, profile }
}

export async function createDoctorAccount(name: string, email: string, password: string) {
  const session = await getSessionUser()
  if (!session || (session.profile as any)?.role !== 'admin') {
    throw new Error('Unauthorized. Only Admins can create new doctors.')
  }

  const supabaseAdmin = await createAdminClient()

  // Create user in Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    throw authError
  }

  // Create user profile in public.users
  if (authData.user) {
    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      name,
      email,
      role: 'doctor',
    } as any)

    if (profileError) {
      throw profileError
    }
  }

  return { success: true }
}

export async function findPatientById(patientId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('patient_id', patientId)
    .single()

  if (error) return null
  return data
}

export async function createPatient(patient: { name: string; age: number; gender: string }) {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data, error } = await supabase
    .from('patients')
    .insert(patient as any)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function logAnalysisHistory(history: {
  patient_id: string
  doctor_id: string | null
  image_url?: string
  top_finding: string
  confidence_score: number
  raw_predictions: any
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data, error } = await supabase
    .from('history')
    .insert(history as any)
    .select()
    .single()

  if (error) throw error
  return data
}
