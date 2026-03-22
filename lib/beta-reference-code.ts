import { createClient } from '@supabase/supabase-js'

/** Sunucuda bazen yalnızca NEXT_PUBLIC_* tanımlı olur; önce doğrudan URL dene */
function supabaseUrl(): string {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    ''
  )
}

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export function generateReferenceCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = 'REF-'
  for (let i = 0; i < 10; i++) {
    s += chars[Math.floor(Math.random() * chars.length)]
  }
  return s
}

export function getServiceSupabase() {
  const url = supabaseUrl()
  if (!url || !SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return null
  }
  return createClient(url, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Legacy global kod veya onaylanmış satırdaki referans kodu */
export async function isValidBetaAccessCode(code: string): Promise<boolean> {
  const trimmed = code.trim()
  if (!trimmed) return false

  const service = getServiceSupabase()
  if (!service) return false

  const { data, error } = await service
    .from('beta_reference_requests')
    .select('id')
    .eq('reference_code', trimmed)
    .eq('status', 'approved')
    .maybeSingle()

  if (error) {
    console.error('[beta-reference] validate:', error.message)
    return false
  }
  return !!data
}

/** Onay için benzersiz kod üret (çakışma olursa tekrar dene) */
export async function allocateUniqueReferenceCode(service: ReturnType<typeof getServiceSupabase>): Promise<string | null> {
  if (!service) return null
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = generateReferenceCode()
    const { data: clash } = await service
      .from('beta_reference_requests')
      .select('id')
      .eq('reference_code', candidate)
      .maybeSingle()
    if (!clash) return candidate
  }
  return null
}
