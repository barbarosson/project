'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
