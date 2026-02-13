'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  TrendingUp, Search, Bookmark, Globe, Zap, BarChart3
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface TrendStats {
  totalSearches: number
  savedReports: number
  topScore: number
  regionsAnalyzed: number
  categoriesUsed: number
  acceleratingProducts: number
}

interface TrendStatsCardsProps {
  stats: TrendStats
}

export function TrendStatsCards({ stats }: TrendStatsCardsProps) {
  const { language } = useLanguage()
  const isTR = language === 'tr'

  const cards = [
    {
      label: isTR ? 'Toplam Arama' : 'Total Searches',
      value: stats.totalSearches,
      icon: Search,
      color: 'bg-teal-50 text-teal-600',
    },
    {
      label: isTR ? 'Kayitli Rapor' : 'Saved Reports',
      value: stats.savedReports,
      icon: Bookmark,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: isTR ? 'En Yuksek Skor' : 'Top Score',
      value: stats.topScore,
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: isTR ? 'Bolge Analizi' : 'Regions Analyzed',
      value: stats.regionsAnalyzed,
      icon: Globe,
      color: 'bg-sky-50 text-sky-600',
    },
    {
      label: isTR ? 'Kategori' : 'Categories',
      value: stats.categoriesUsed,
      icon: BarChart3,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: isTR ? 'Hizlanan Urunler' : 'Accelerating',
      value: stats.acceleratingProducts,
      icon: Zap,
      color: 'bg-rose-50 text-rose-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#0A192F]">{card.value}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
