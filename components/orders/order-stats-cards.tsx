'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, Clock, Truck, CheckCircle2, Package, Link2 } from 'lucide-react'

interface OrderStatsProps {
  stats: {
    total: number
    pending: number
    processing: number
    shipped: number
    completed: number
    fromMarketplace: number
  }
  isTR: boolean
}

export function OrderStatsCards({ stats, isTR }: OrderStatsProps) {
  const cards = [
    {
      title: isTR ? 'Toplam Siparis' : 'Total Orders',
      value: stats.total,
      icon: ShoppingCart,
      color: 'text-[#0D1B2A]',
      bg: 'bg-slate-50',
    },
    {
      title: isTR ? 'Beklemede' : 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: isTR ? 'Hazirlaniyor' : 'Processing',
      value: stats.processing,
      icon: Package,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
    },
    {
      title: isTR ? 'Kargoda' : 'Shipped',
      value: stats.shipped,
      icon: Truck,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      title: isTR ? 'Tamamlanan' : 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: isTR ? 'Pazaryerinden' : 'From Marketplace',
      value: stats.fromMarketplace,
      icon: Link2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
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
