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
  const { mustChangePassword, loading } = useSubscription()

  if (user && mustChangePassword && !loading) {
    return <ForceChangePassword />
  }

  return (
    <div className="min-h-screen bg-[#0A2540]/5 overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64 min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-3 lg:p-5 text-[#0A2540] min-w-0 overflow-x-hidden text-[15px]">
          {children}
        </main>
      </div>
    </div>
  )
}
