import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

function validateEnvironment() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please ensure it is defined in your .env file or environment configuration.'
    )
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Please ensure it is defined in your .env file or environment configuration.'
    )
  }

  try {
    new URL(supabaseUrl)
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: "${supabaseUrl}". ` +
      'The URL must be a valid HTTP/HTTPS URL.'
    )
  }

  return { supabaseUrl, supabaseAnonKey }
}

let supabaseInstance: any = null

function createSupabaseClient(): any {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const { supabaseUrl, supabaseAnonKey } = validateEnvironment()

  if (typeof window !== 'undefined') {
    console.log('[Supabase] 🔧 Initializing with localStorage...')
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  })

  if (typeof window !== 'undefined') {
    console.log('[Supabase] ✅ Client ready with localStorage storage')
  }

  return supabaseInstance
}

export const supabase = createSupabaseClient()

export function getSupabaseClient(): any {
  return supabase
}
