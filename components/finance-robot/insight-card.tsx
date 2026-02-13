'use client'

import { AlertTriangle, CheckCircle2, Info, XCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ModuleInsight } from '@/lib/finance-robot'

interface InsightCardProps {
  insight: ModuleInsight
}

const typeConfig = {
  success: {
    icon: CheckCircle2,
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50/50',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-100 text-emerald-700',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-l-amber-500',
    bg: 'bg-amber-50/50',
    iconColor: 'text-amber-600',
    badgeBg: 'bg-amber-100 text-amber-700',
  },
  danger: {
    icon: XCircle,
    border: 'border-l-red-500',
    bg: 'bg-red-50/50',
    iconColor: 'text-red-600',
    badgeBg: 'bg-red-100 text-red-700',
  },
  info: {
    icon: Info,
    border: 'border-l-sky-500',
    bg: 'bg-sky-50/50',
    iconColor: 'text-sky-600',
    badgeBg: 'bg-sky-100 text-sky-700',
  },
}

export function InsightCard({ insight }: InsightCardProps) {
  const config = typeConfig[insight.type]
  const Icon = config.icon

  return (
    <div className={cn('border-l-4 rounded-r-lg p-3.5 transition-colors', config.border, config.bg)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('shrink-0 mt-0.5', config.iconColor)} size={18} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-gray-900 truncate">{insight.title}</h4>
            {insight.metric && (
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full shrink-0', config.badgeBg)}>
                {insight.metric}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{insight.description}</p>
          {insight.action && (
            <div className="flex items-center gap-1 mt-1.5 text-xs font-medium text-gray-500">
              <ArrowRight size={12} />
              <span>{insight.action}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
