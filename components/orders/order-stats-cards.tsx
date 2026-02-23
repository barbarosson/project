'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShoppingCart, Clock, Package, Truck, CheckCircle2, Link2 } from 'lucide-react'

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
  dateFrom: string
  dateTo: string
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void
}

const BAR_COLORS = [
  'bg-[#0A2540]',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-teal-500',
  'bg-emerald-500',
  'bg-blue-500',
]

export function OrderStatsCards({ stats, isTR, dateFrom, dateTo, onDateFromChange, onDateToChange }: OrderStatsProps) {
  const items = [
    { key: 'total', label: isTR ? 'Toplam' : 'Total', value: stats.total, icon: ShoppingCart },
    { key: 'pending', label: isTR ? 'Beklemede' : 'Pending', value: stats.pending, icon: Clock },
    { key: 'processing', label: isTR ? 'Hazırlanıyor' : 'Processing', value: stats.processing, icon: Package },
    { key: 'shipped', label: isTR ? 'Kargoda' : 'Shipped', value: stats.shipped, icon: Truck },
    { key: 'completed', label: isTR ? 'Tamamlanan' : 'Completed', value: stats.completed, icon: CheckCircle2 },
    { key: 'fromMarketplace', label: isTR ? 'Pazaryeri' : 'Marketplace', value: stats.fromMarketplace, icon: Link2 },
  ]
  const maxVal = Math.max(1, ...items.map((i) => i.value))

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-[#0A2540]" />
          <span className="text-sm font-medium text-[#0A2540]">
            {isTR ? 'Sipariş özeti' : 'Order summary'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs whitespace-nowrap">{isTR ? 'Başlangıç' : 'From'}</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="h-8 w-[130px] text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Label className="text-xs whitespace-nowrap">{isTR ? 'Bitiş' : 'To'}</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="h-8 w-[130px] text-xs"
            />
          </div>
        </div>
      </div>
      <div className="space-y-2.5">
        {items.map((item, idx) => {
          const Icon = item.icon
          const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0
          return (
            <div key={item.key} className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 min-w-[100px] sm:min-w-[110px]">
                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{item.label}</span>
              </div>
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <div className="flex-1 h-5 rounded bg-muted/50 overflow-hidden min-w-[60px]">
                  <div
                    className={`h-full rounded ${BAR_COLORS[idx]} transition-all duration-300`}
                    style={{ width: `${Math.max(0, pct)}%` }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums w-6 text-right shrink-0">{item.value}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
