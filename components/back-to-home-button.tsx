'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

interface BackToHomeButtonProps {
  className?: string
}

export function BackToHomeButton({ className }: BackToHomeButtonProps) {
  return (
    <Link href="/landing">
      <Button variant="ghost" size="sm" className={className}>
        <Home className="h-4 w-4 mr-2" />
        Ana Sayfa
      </Button>
    </Link>
  )
}
