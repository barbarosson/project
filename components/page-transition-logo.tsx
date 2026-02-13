'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ModulusLogoSvgOnly } from '@/components/modulus-logo'

export function PageTransitionLogo() {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)
    const timer = setTimeout(() => {
      setIsTransitioning(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [pathname])

  if (!isTransitioning) return null

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
      <div className="animate-bounce drop-shadow-2xl">
        <ModulusLogoSvgOnly size={100} />
      </div>
    </div>
  )
}
