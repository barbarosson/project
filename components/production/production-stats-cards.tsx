'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Factory, Clock, Play, CheckCircle2, AlertTriangle, Boxes } from 'lucide-react'

interface ProductionStatsProps {
  stats: {
    total: number
    planned: number
    inProgress: number
    completed: number
    qcPhase: number
    totalTarget: number
    totalProduced: number
  }
  isTR: boolean
}

export function ProductionStatsCards({ stats, isTR }: ProductionStatsProps) {
  const efficiency = stats.totalTarget > 0
    ? Math.round((stats.totalProduced / stats.totalTarget) * 100)
    : 0

  const cards = [
    {
      title: isTR ? 'Toplam Uretim Emri' : 'Total Orders',
      value: String(stats.total),
      icon: Factory,
      color: 'text-[#0D1B2A]',
      bg: 'bg-slate-50',
    },
    {
      title: isTR ? 'Planli' : 'Planned',
      value: String(stats.planned),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: isTR ? 'Uretimde' : 'In Progress',
      value: String(stats.inProgress),
      icon: Play,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: isTR ? 'Kalite Kontrol' : 'QC Phase',
      value: String(stats.qcPhase),
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: isTR ? 'Tamamlanan' : 'Completed',
      value: String(stats.completed),
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: isTR ? 'Genel Verimlilik' : 'Overall Efficiency',
      value: `${efficiency}%`,
      icon: Boxes,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{card.title}</CardTitle>
            <div className={`p-1.5 rounded-lg ${card.bg}`}>
              <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
