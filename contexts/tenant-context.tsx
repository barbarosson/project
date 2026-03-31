'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { isSuperAdmin } from '@/lib/access-control'

interface TenantContextType {
  tenantId: string | null
  loading: boolean
  isSuperAdmin: boolean
  refreshTenant: () => Promise<void>
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [superAdmin, setSuperAdmin] = useState(false)

  useEffect(() => {
    loadTenant()

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadTenant()
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  async function loadTenant() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        setTenantId(null)
        setSuperAdmin(false)
        setLoading(false)
        return
      }

      if (!session?.user) {
        setTenantId(null)
        setSuperAdmin(false)
        setLoading(false)
        return
      }

      const userId = session.user.id
      const isSuperAdminUser = isSuperAdmin(session.user)
      setSuperAdmin(isSuperAdminUser)

      // Siparişler ve diğer veriler genelde profiles.tenant_id ile kaydedilir; önce onu kullan
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', userId)
        .maybeSingle()

      // Eğer profile.tenant_id yoksa, tenant'ı owner_id üzerinden bulmayı dene.
      // (Bazı akışlarda tenant kaydı oluşturulup profile.tenant_id yazılmayabiliyor.)
      let effectiveTenantId: string = profile?.tenant_id != null ? String(profile.tenant_id) : ''
      if (!effectiveTenantId) {
        const { data: tenantRow } = await supabase
          .from('tenants')
          .select('id')
          .eq('owner_id', userId)
          .maybeSingle()
        if (tenantRow?.id) effectiveTenantId = String(tenantRow.id)
      }
      // Son fallback: legacy single-tenant kullanımında bazı tablolar tenant_id = auth.uid()::text ile tutuluyor.
      // Super admin için ise userId'ye düşmek yanlış tenant filtrelemesine neden olabileceğinden null bırakıyoruz.
      if (!effectiveTenantId) {
        effectiveTenantId = isSuperAdminUser ? '' : userId
      }

      setTenantId(effectiveTenantId || null)
    } catch (error) {
      setTenantId(null)
      setSuperAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const refreshTenant = async () => {
    await loadTenant()
  }

  return (
    <TenantContext.Provider value={{ tenantId, loading, isSuperAdmin: superAdmin, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}
