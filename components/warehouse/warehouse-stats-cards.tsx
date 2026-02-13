'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Warehouse, Package, AlertTriangle, ArrowDownLeft, ArrowUpRight, DollarSign } from 'lucide-react'

interface WarehouseStatsProps {
  stats: {
    totalWarehouses: number
    totalProducts: number
    lowStockItems: number
    totalValue: number
    monthlyInflow: number
    monthlyOutflow: number
  }
  isTR: boolean
}

export function WarehouseStatsCards({ stats, isTR }: WarehouseStatsProps) {
  const cards = [
    {
      title: isTR ? 'Toplam Depo' : 'Total Warehouses',
      value: String(stats.totalWarehouses),
      icon: Warehouse,
      color: 'text-[#0A2540]',
      bg: 'bg-slate-50',
    },
    {
      title: isTR ? 'Urun Cesidi' : 'Product Types',
      value: String(stats.totalProducts),
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: isTR ? 'Dusuk Stok' : 'Low Stock',
      value: String(stats.lowStockItems),
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: isTR ? 'Toplam Deger' : 'Total Value',
      value: Number(stats.totalValue).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
      prefix: true,
    },
    {
      title: isTR ? 'Aylik Giris' : 'Monthly Inflow',
      value: `+${stats.monthlyInflow}`,
      icon: ArrowDownLeft,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      title: isTR ? 'Aylik Cikis' : 'Monthly Outflow',
      value: `-${stats.monthlyOutflow}`,
      icon: ArrowUpRight,
      color: 'text-red-500',
      bg: 'bg-red-50',
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
