import { NextRequest } from 'next/server'
import { getUserSupabase, getServiceSupabase } from './supabase'

// Small helper used by /api/apptflow/admin/* routes.
// Reads the Authorization: Bearer <supabase-access-token> header, resolves
// the caller's auth user via Supabase, and returns the tenant_id they own.
// A second tenant_id in query / body can be accepted but MUST match the
// user's ownership — service role bypass is NEVER taken here.
export interface AdminContext {
  userId: string
  tenantId: string
}

export async function requireAdmin(req: NextRequest): Promise<
  | { ok: true; ctx: AdminContext }
  | { ok: false; status: number; error: string }
> {
  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization')
  const token = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null
  if (!token) return { ok: false, status: 401, error: 'missing_bearer_token' }

  const userSb = getUserSupabase(token)
  const {
    data: userData,
    error: userErr,
  } = await userSb.auth.getUser()
  if (userErr || !userData?.user) {
    return { ok: false, status: 401, error: 'invalid_token' }
  }
  const userId = userData.user.id

  // Look up tenant owned by this user (one per owner in MVP).
  const svc = getServiceSupabase()
  const { data: tenant, error: tErr } = await svc
    .from('tenants')
    .select('id')
    .eq('owner_user_id', userId)
    .maybeSingle()
  if (tErr) {
    return { ok: false, status: 500, error: 'tenant_lookup_failed' }
  }
  if (!tenant) {
    return { ok: false, status: 404, error: 'tenant_not_found' }
  }

  return { ok: true, ctx: { userId, tenantId: tenant.id } }
}
