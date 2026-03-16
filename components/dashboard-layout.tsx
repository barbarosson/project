'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSubscription } from '@/contexts/subscription-context'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { ForceChangePassword } from './force-change-password'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const { mustChangePassword, loading, currentPlan, userSubscription } = useSubscription()

  const trialInfo = (() => {
    if (!userSubscription || !currentPlan) return null
    if (!userSubscription.expires_at) return null

    const now = Date.now()
    const expiresAt = new Date(userSubscription.expires_at).getTime()
    const diffMs = expiresAt - now
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    return {
      daysLeft,
      isExpired: diffMs <= 0,
    }
  })()

  if (user && mustChangePassword && !loading) {
    return <ForceChangePassword />
  }

  return (
    <div className="min-h-screen bg-[#0A2540]/5 overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64 min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-3 lg:p-5 text-[#0A2540] min-w-0 overflow-x-hidden text-[15px]">
          {!loading && currentPlan && userSubscription && (
            <div className="mb-4 lg:mb-5">
              <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold text-sky-900 uppercase tracking-wide">
                    Üyelik Özeti
                  </p>
                  <p className="text-sm text-sky-950">
                    Paketiniz: <span className="font-semibold">{currentPlan.name}</span>{' '}
                    ({userSubscription.status === 'active' ? 'Aktif' : userSubscription.status})
                  </p>
                </div>
                {trialInfo && (
                  <div className="text-sm text-sky-900">
                    {trialInfo.isExpired ? (
                      <span>
                        Deneme süreniz sona erdi. Tüm özelliklerden yararlanmaya devam etmek için
                        paket seçimini tamamlayın.
                      </span>
                    ) : (
                      <span>
                        <span className="font-semibold">{trialInfo.daysLeft}</span> gün boyunca
                        ücretsiz deneme süreniz devam ediyor.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
