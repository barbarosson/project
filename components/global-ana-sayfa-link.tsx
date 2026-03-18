'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

/** Ana sayfa / panele dön — landing, dashboard ve admin hariç her yerde */
export function GlobalAnaSayfaLink() {
  const pathname = usePathname() || ''
  const { language } = useLanguage()

  if (pathname === '/landing' || pathname === '/') return null

  let href = '/landing'
  let label = language === 'tr' ? 'Ana Sayfa' : 'Home'

  if (pathname.startsWith('/dashboard')) {
    if (pathname === '/dashboard') return null
    href = '/dashboard'
    label = language === 'tr' ? 'Ana Sayfa' : 'Home'
  } else if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      href = '/landing'
      label = language === 'tr' ? 'Ana Sayfa' : 'Home'
    } else {
      href = '/admin/users'
      label = language === 'tr' ? 'Admin Ana Sayfa' : 'Admin Home'
    }
  }

  return (
    <Link
      href={href}
      className="fixed left-3 top-20 z-[100] inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold shadow-lg transition-colors hover:bg-white/10 sm:top-24"
      style={{
        backgroundColor: '#0A2540',
        borderColor: 'rgba(255,255,255,0.2)',
        color: '#ffffff',
      }}
    >
      <Home className="h-4 w-4 shrink-0" style={{ color: '#00D4AA' }} />
      {label}
    </Link>
  )
}
