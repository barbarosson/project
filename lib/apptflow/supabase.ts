import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from './env'

// We intentionally type these as SupabaseClient<any, any, any> because the
// v2.58+ Supabase typings enforce a generic schema of "public" by default,
// and we run everything against the "apptflow" schema. The `any` generics
// let us keep strict type safety in callers while sidestepping the
// parameterized-schema type mismatch at the client level.
let serviceClient: SupabaseClient<any, any, any> | null = null

// Service-role client. Bypasses RLS — use only on the server in
// trusted code paths (cron jobs, webhooks, edge-triggered handlers).
export function getServiceSupabase(): SupabaseClient<any, any, any> {
  if (serviceClient) return serviceClient
  serviceClient = createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'apptflow' },
  }) as unknown as SupabaseClient<any, any, any>
  return serviceClient
}

// Anon client bound to the caller's access token, when you want RLS
// to decide what the request can see/write.
export function getUserSupabase(accessToken: string | null): SupabaseClient<any, any, any> {
  return createClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'apptflow' },
  }) as unknown as SupabaseClient<any, any, any>
}
