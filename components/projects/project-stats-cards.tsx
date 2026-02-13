'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderKanban, Clock, Play, CheckCircle2, AlertTriangle, DollarSign } from 'lucide-react'

interface ProjectStatsProps {
  stats: {
    total: number
    planning: number
    active: number
    completed: number
    overBudget: number
    totalBudget: number
  }
  isTR: boolean
  currency?: string
}

export function ProjectStatsCards({ stats, isTR, currency = 'TRY' }: ProjectStatsProps) {
  const cards = [
    {
      title: isTR ? 'Toplam Proje' : 'Total Projects',
      value: String(stats.total),
      icon: FolderKanban,
      color: 'text-[#0A2540]',
      bg: 'bg-slate-50',
    },
    {
      title: isTR ? 'Planlama' : 'Planning',
      value: String(stats.planning),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: isTR ? 'Aktif' : 'Active',
      value: String(stats.active),
      icon: Play,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: isTR ? 'Tamamlanan' : 'Completed',
      value: String(stats.completed),
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: isTR ? 'Butce Asimi' : 'Over Budget',
      value: String(stats.overBudget),
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: isTR ? 'Toplam Butce' : 'Total Budget',
      value: Number(stats.totalBudget).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      suffix: ` ${currency}`,
      icon: DollarSign,
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
            <div className="text-2xl font-bold">
              {card.value}
              {'suffix' in card && <span className="text-xs font-normal text-muted-foreground">{card.suffix}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
