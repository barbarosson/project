'use client'

import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ShoppingCart, Clock, Package, Truck, CheckCircle2, Link2, CalendarIcon } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function formatDateToDDMMYYYY(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const day = d.getDate()
  const month = d.getMonth() + 1
  const year = d.getFullYear()
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`
}

interface OrderWithDate {
  order_date?: string | null
  created_at: string
}

interface OrderStatsProps {
  stats: {
    total: number
    pending: number
    processing: number
    shipped: number
    completed: number
    fromMarketplace: number
  }
  ordersInRange: OrderWithDate[]
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

export function OrderStatsCards({ stats, isTR, dateFrom, dateTo, ordersInRange, onDateFromChange, onDateToChange }: OrderStatsProps) {
  const chartData = useMemo(() => {
    if (!dateFrom || !dateTo) return []
    const from = new Date(dateFrom)
    const to = new Date(dateTo)
    const orderDate = (o: OrderWithDate) => o.order_date || o.created_at
    const getWeekStart = (d: Date) => {
      const x = new Date(d)
      const day = x.getDay()
      const diff = day === 0 ? -6 : 1 - day
      x.setDate(x.getDate() + diff)
      x.setHours(0, 0, 0, 0)
      return x
    }
    const weekKey = (d: Date) => getWeekStart(d).toISOString().slice(0, 10)
    const weeks = new Map<string, number>()
    ordersInRange.forEach((o) => {
      const raw = orderDate(o)
      if (!raw) return
      const key = weekKey(new Date(raw))
      weeks.set(key, (weeks.get(key) ?? 0) + 1)
    })
    const result: { date: string; count: number; label: string; weekStart: string }[] = []
    let cursor = new Date(getWeekStart(from))
    const endWeek = getWeekStart(to)
    while (cursor <= endWeek) {
      const key = cursor.toISOString().slice(0, 10)
      const count = weeks.get(key) ?? 0
      const next = new Date(cursor)
      next.setDate(next.getDate() + 6)
      const label = isTR
        ? `${cursor.getDate()} ${cursor.toLocaleDateString('tr-TR', { month: 'short' })}`
        : `${cursor.toLocaleDateString('en-US', { month: 'short' })} ${cursor.getDate()}`
      result.push({ date: key, count, label, weekStart: key })
      cursor.setDate(cursor.getDate() + 7)
    }
    return result
  }, [dateFrom, dateTo, ordersInRange, isTR])

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
    <div className="rounded-lg border bg-card p-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-3.5 w-3.5 text-[#0A2540]" />
          <span className="text-xs font-medium text-[#0A2540]">
            {isTR ? 'Sipariş özeti' : 'Order summary'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Label className="text-[10px] whitespace-nowrap">{isTR ? 'Başlangıç' : 'From'}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-7 w-[115px] items-center justify-between gap-1 rounded-md border border-input bg-background px-2 text-[11px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <span className="truncate">{formatDateToDDMMYYYY(dateFrom) || (isTR ? 'Tarih seç' : 'Pick date')}</span>
                  <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => onDateFromChange(e.target.value)}
                  className="h-8 w-full rounded border border-input bg-background px-2 text-xs"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-[10px] whitespace-nowrap">{isTR ? 'Bitiş' : 'To'}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-7 w-[115px] items-center justify-between gap-1 rounded-md border border-input bg-background px-2 text-[11px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <span className="truncate">{formatDateToDDMMYYYY(dateTo) || (isTR ? 'Tarih seç' : 'Pick date')}</span>
                  <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => onDateToChange(e.target.value)}
                  className="h-8 w-full rounded border border-input bg-background px-2 text-xs"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
        {/* Sol: özet çubukları (tarih aralığına göre filtrelenmiş) */}
        <div className="space-y-1.5 min-w-0 lg:min-w-[200px] lg:max-w-[240px]">
          {items.map((item, idx) => {
            const Icon = item.icon
            const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0
            return (
              <div key={item.key} className="flex items-center gap-2">
                <div className="flex items-center gap-1 min-w-[72px] shrink-0">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground truncate">{item.label}</span>
                </div>
                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                  <div className="flex-1 h-3.5 rounded bg-muted/50 overflow-hidden min-w-[40px]">
                    <div
                      className={`h-full rounded ${BAR_COLORS[idx]} transition-all duration-300`}
                      style={{ width: `${Math.max(0, pct)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium tabular-nums w-4 text-right shrink-0">{item.value}</span>
                </div>
              </div>
            )
          })}
        </div>
        {/* Sağ: seçilen tarih aralığında günlük sipariş grafiği */}
        {chartData.length > 0 && (
          <div className="flex-1 min-w-0 border-t lg:border-t-0 lg:border-l pt-3 lg:pt-0 lg:pl-3">
            <p className="text-[10px] text-muted-foreground mb-1">
              {isTR ? 'Seçilen zaman diliminde haftalık sipariş adedi' : 'Weekly order count in selected period'}
            </p>
            <div className="h-[100px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 9 }} width={20} />
                  <Tooltip
                    formatter={(value: number) => [value, isTR ? 'Sipariş' : 'Orders']}
                    labelFormatter={(_, payload) => {
                      const p = payload?.[0]?.payload
                      if (!p?.weekStart) return ''
                      const start = new Date(p.weekStart)
                      const end = new Date(start)
                      end.setDate(end.getDate() + 6)
                      return `${start.toLocaleDateString(isTR ? 'tr-TR' : 'en-US')} - ${end.toLocaleDateString(isTR ? 'tr-TR' : 'en-US')}`
                    }}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Bar dataKey="count" fill="#0A2540" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
