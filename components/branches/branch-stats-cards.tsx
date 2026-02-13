'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, TrendingUp, TrendingDown, Building2, FileText, ShoppingCart } from 'lucide-react'

interface BranchStatsProps {
  stats: {
    totalBranches: number
    totalRevenue: number
    totalExpenses: number
    totalProfit: number
    totalInvoices: number
    totalOrders: number
  }
  isTR: boolean
}

export function BranchStatsCards({ stats, isTR }: BranchStatsProps) {
  const profitPositive = stats.totalProfit >= 0

  const cards = [
    {
      title: isTR ? 'Aktif Sube' : 'Active Branches',
      value: String(stats.totalBranches),
      icon: Building2,
      color: 'text-[#0D1B2A]',
      bg: 'bg-slate-50',
    },
    {
      title: isTR ? 'Toplam Gelir' : 'Total Revenue',
      value: Number(stats.totalRevenue).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: isTR ? 'Toplam Gider' : 'Total Expenses',
      value: Number(stats.totalExpenses).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      icon: TrendingDown,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      title: isTR ? 'Net Kar' : 'Net Profit',
      value: `${profitPositive ? '+' : ''}${Number(stats.totalProfit).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: MapPin,
      color: profitPositive ? 'text-emerald-600' : 'text-red-600',
      bg: profitPositive ? 'bg-emerald-50' : 'bg-red-50',
    },
    {
      title: isTR ? 'Toplam Fatura' : 'Total Invoices',
      value: String(stats.totalInvoices),
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: isTR ? 'Toplam Siparis' : 'Total Orders',
      value: String(stats.totalOrders),
      icon: ShoppingCart,
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
