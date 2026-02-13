'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'

interface RouteGuardProps {
  children: React.ReactNode
}

export function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, canAccessRoute } = useAuth()
  const { language } = useLanguage()

  useEffect(() => {
    if (loading) return

    if (!user) {
      if (pathname !== '/landing' && pathname !== '/login') {
        router.push('/landing')
      }
      return
    }

    if (!canAccessRoute(pathname)) {
      toast.error(
        language === 'tr'
          ? 'Bu sayfaya erişim yetkiniz yok.'
          : 'You do not have permission to access this page.',
        { duration: 5000 }
      )
      router.push('/dashboard')
    }
  }, [user, loading, pathname, canAccessRoute, router, language])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D4AA]"></div>
      </div>
    )
  }

  if (!user && pathname !== '/landing' && pathname !== '/login') {
    return null
  }

  if (user && !canAccessRoute(pathname)) {
    return null
  }

  return <>{children}</>
}
