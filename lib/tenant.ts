import { supabase } from './supabase'

export async function getCurrentTenantId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return null
    }

    // Use user.id as tenant_id for auth-based multi-tenancy
    return session.user.id
  } catch (error) {
    console.error('Error getting tenant ID:', error)
    return null
  }
}

export async function ensureTenantId(): Promise<string> {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    throw new Error('User must be authenticated with a valid tenant_id')
  }

  return tenantId
}

export function getTenantIdSync(): string | null {
  // This function should not be used in new code
  // Use getCurrentTenantId() or context.tenantId instead
  console.warn('getTenantIdSync is deprecated. Use getCurrentTenantId() or context instead.')
  return null
}

export async function addTenantIdAsync<T extends Record<string, any>>(data: T): Promise<T & { tenant_id: string }> {
  const tenantId = await ensureTenantId()
  return {
    ...data,
    tenant_id: tenantId,
  }
}
