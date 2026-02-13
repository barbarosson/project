'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'

export function useRouteGuard(requiredRole?: 'admin' | 'regular') {
  const router = useRouter()
  const { user, loading, isAdmin, isDemo } = useAuth()
  const { language } = useLanguage()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/landing')
      return
    }

    if (requiredRole === 'admin' && !isAdmin) {
      toast.error(
        language === 'tr'
          ? 'Bu sayfaya erişim yetkiniz yok.'
          : 'You do not have permission to access this page.',
        { duration: 5000 }
      )
      router.push('/dashboard')
    }
  }, [user, loading, isAdmin, requiredRole, router, language])

  return { loading, isAdmin, isDemo }
}
