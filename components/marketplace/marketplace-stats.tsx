'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Store, ShoppingCart, Package, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface MarketplaceStatsData {
  connectedMarketplaces: number
  totalOrders: number
  pendingOrders: number
  totalProducts: number
  syncErrors: number
  todayRevenue: number
}

interface MarketplaceStatsProps {
  stats: MarketplaceStatsData
}

export function MarketplaceStats({ stats }: MarketplaceStatsProps) {
  const { language } = useLanguage()
  const isTR = language === 'tr'

  const cards = [
    {
      title: isTR ? 'Bağlı Pazaryeri' : 'Connected',
      value: stats.connectedMarketplaces,
      icon: Store,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
    {
      title: isTR ? 'Toplam Sipariş' : 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: isTR ? 'Bekleyen Sipariş' : 'Pending Orders',
      value: stats.pendingOrders,
      icon: RefreshCw,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
    },
    {
      title: isTR ? 'Listelenen Ürün' : 'Listed Products',
      value: stats.totalProducts,
      icon: Package,
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-700',
    },
    {
      title: isTR ? 'Senkron Hatası' : 'Sync Errors',
      value: stats.syncErrors,
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
    {
      title: isTR ? 'Günlük Ciro' : 'Daily Revenue',
      value: `₺${stats.todayRevenue.toLocaleString('tr-TR')}`,
      icon: TrendingUp,
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-700',
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
