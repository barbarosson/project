'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  ClipboardCheck,
  AlertTriangle,
  Calendar,
  Bell,
  TrendingUp,
  Clock
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface StatsData {
  totalObligations: number
  pendingObligations: number
  overdueObligations: number
  completedObligations: number
  upcomingMeetings: number
  activeReminders: number
}

interface ExecStatsCardsProps {
  stats: StatsData
}

export function ExecStatsCards({ stats }: ExecStatsCardsProps) {
  const { language } = useLanguage()
  const isTR = language === 'tr'

  const completionRate = stats.totalObligations > 0
    ? Math.round((stats.completedObligations / stats.totalObligations) * 100)
    : 0

  const cards = [
    {
      title: isTR ? 'Toplam Yükümlülük' : 'Total Obligations',
      value: stats.totalObligations,
      icon: ClipboardCheck,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: isTR ? 'Bekleyen' : 'Pending',
      value: stats.pendingObligations,
      icon: Clock,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
    },
    {
      title: isTR ? 'Vadesi Geçen' : 'Overdue',
      value: stats.overdueObligations,
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
    {
      title: isTR ? 'Tamamlanma' : 'Completion',
      value: `%${completionRate}`,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
    {
      title: isTR ? 'Yaklaşan Toplantı' : 'Upcoming Meetings',
      value: stats.upcomingMeetings,
      icon: Calendar,
      color: 'bg-sky-500',
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-700',
    },
    {
      title: isTR ? 'Aktif Hatırlatma' : 'Active Reminders',
      value: stats.activeReminders,
      icon: Bell,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`${card.bgColor} p-2.5 rounded-xl`}>
                  <Icon className={`h-5 w-5 ${card.textColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{card.title}</p>
                  <p className={`text-xl font-bold ${card.textColor}`}>{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
