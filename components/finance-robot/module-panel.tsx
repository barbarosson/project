'use client'

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { HealthGauge } from './health-gauge'
import { InsightCard } from './insight-card'
import type { ModuleHealth, ModuleInsight } from '@/lib/finance-robot'

interface ModulePanelProps {
  title: string
  icon: LucideIcon
  health: ModuleHealth
  insights: ModuleInsight[]
  metrics: { label: string; value: string | number; subtext?: string }[]
  expanded?: boolean
  onToggle?: () => void
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
}

const trendColors = {
  up: 'text-emerald-600',
  down: 'text-red-600',
  stable: 'text-gray-500',
}

export function ModulePanel({ title, icon: Icon, health, insights, metrics, expanded, onToggle }: ModulePanelProps) {
  const TrendIcon = trendIcons[health.trend]

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardHeader
        className="cursor-pointer select-none pb-3"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0D1B2A] text-white">
              <Icon size={20} />
            </div>
            <div>
              <CardTitle className="text-base text-gray-900">{title}</CardTitle>
              <div className="flex items-center gap-1.5 mt-0.5">
                <TrendIcon size={14} className={trendColors[health.trend]} />
                <span className={cn('text-xs font-medium', trendColors[health.trend])}>
                  {health.trend === 'up' ? 'Improving' : health.trend === 'down' ? 'Declining' : 'Stable'}
                </span>
              </div>
            </div>
          </div>
          <HealthGauge score={health.score} status={health.status} size="sm" />
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {metrics.map((m, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{m.label}</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{m.value}</p>
                {m.subtext && <p className="text-[11px] text-gray-500">{m.subtext}</p>}
              </div>
            ))}
          </div>

          {insights.length > 0 && (
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
