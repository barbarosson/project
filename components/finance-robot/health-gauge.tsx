'use client'

import { cn } from '@/lib/utils'
import type { ModuleHealth } from '@/lib/finance-robot'

interface HealthGaugeProps {
  score: number
  status: ModuleHealth['status']
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const statusColors = {
  excellent: { ring: 'text-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  good: { ring: 'text-sky-500', bg: 'bg-sky-50', text: 'text-sky-700' },
  warning: { ring: 'text-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  critical: { ring: 'text-red-500', bg: 'bg-red-50', text: 'text-red-700' },
}

const sizeMap = {
  sm: { wrapper: 'w-16 h-16', text: 'text-lg', label: 'text-[10px]' },
  md: { wrapper: 'w-24 h-24', text: 'text-2xl', label: 'text-xs' },
  lg: { wrapper: 'w-32 h-32', text: 'text-4xl', label: 'text-sm' },
}

export function HealthGauge({ score, status, size = 'md', label }: HealthGaugeProps) {
  const colors = statusColors[status]
  const sizing = sizeMap[size]
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn('relative', sizing.wrapper)}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100" />
          <circle
            cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn(colors.ring, 'transition-all duration-1000 ease-out')}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', sizing.text, colors.text)}>{score}</span>
        </div>
      </div>
      {label && <span className={cn('font-medium text-gray-500', sizing.label)}>{label}</span>}
    </div>
  )
}
