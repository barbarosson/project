'use client'

import { useEffect, useState } from 'react'
import { getCurrentTenantId } from '@/lib/tenant'
import { supabase } from '@/lib/supabase'

export function useTenant() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTenantId()

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadTenantId()
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  async function loadTenantId() {
    try {
      const id = await getCurrentTenantId()
      setTenantId(id)
    } catch (error) {
      console.error('Error loading tenant ID:', error)
      setTenantId(null)
    } finally {
      setLoading(false)
    }
  }

  return { tenantId, loading }
}
