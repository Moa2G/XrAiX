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

export async function createPatient(patient: { name: string; age: number; gender: string; doctor_id?: string | null }) {
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

export async function getPatientsList() {
  const session = await getSessionUser()
  if (!session) throw new Error('Unauthorized')

  const supabaseAdmin = await createAdminClient()
  const role = (session.profile as any)?.role

  if (role === 'admin') {
    const { data, error } = await supabaseAdmin.from('patients').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data
  } else {
    // Doctors see only their own patients + patients with NULL doctor_id are admin-only
    const { data, error } = await supabaseAdmin.from('patients').select('*').eq('doctor_id', session.id).order('created_at', { ascending: false })
    if (error) throw error
    return data
  }
}

export async function getRecentAnalyses() {
  const session = await getSessionUser()
  if (!session) throw new Error('Unauthorized')

  const supabaseAdmin = await createAdminClient()
  const role = (session.profile as any)?.role

  if (role === 'admin') {
    const { data, error } = await supabaseAdmin.from('history').select('*, patients(name)').order('created_at', { ascending: false }).limit(10)
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabaseAdmin.from('history').select('*, patients(name)').eq('doctor_id', session.id).order('created_at', { ascending: false }).limit(10)
    if (error) throw error
    return data
  }
}

export async function getAnalysisStats() {
  const session = await getSessionUser()
  if (!session) throw new Error('Unauthorized')

  const supabaseAdmin = await createAdminClient()
  const role = (session.profile as any)?.role

  let query = supabaseAdmin.from('history').select('top_finding')
  if (role !== 'admin') {
    query = query.eq('doctor_id', session.id)
  }

  const { data } = await query
  const historyData = data as any[] | null
  
  const total = historyData?.length || 0
  const abnormal = historyData?.filter(row => row.top_finding !== 'Normal').length || 0
  
  const topDiseases: Record<string, number> = {}
  if (historyData) {
    historyData.forEach(row => {
      if (row.top_finding !== 'Normal') {
        topDiseases[row.top_finding] = (topDiseases[row.top_finding] || 0) + 1
      }
    })
  }

  return { total, abnormal, topDiseases }
}

export async function getAllUsers() {
  const session = await getSessionUser()
  if (!session || (session.profile as any)?.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  const supabaseAdmin = await createAdminClient()
  const { data, error } = await supabaseAdmin.from('users').select('*')
  if (error) throw error
  return data
}

export async function updateDoctorAccount(id: string, updates: { name: string, role: 'admin' | 'doctor' }) {
  const session = await getSessionUser()
  if (!session || (session.profile as any)?.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  const supabaseAdmin = await createAdminClient()
  // @ts-ignore - Supabase generic inference resolves Update to never; runtime is correct
  const { error } = await supabaseAdmin.from('users').update(updates).eq('id', id)
  if (error) throw error
  return { success: true }
}

export async function deleteDoctorAccount(id: string) {
  const session = await getSessionUser()
  if (!session || (session.profile as any)?.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  const supabaseAdmin = await createAdminClient()
  
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (authError) throw authError
  
  await supabaseAdmin.from('users').delete().eq('id', id)

  return { success: true }
}
