'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Receipt, Package, ShoppingCart, DollarSign, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ProjectTimelineProps {
  projectId: string
  tenantId: string
  isTR: boolean
}

interface TimelineEntry {
  id: string
  type: 'invoice' | 'expense' | 'stock' | 'order' | 'cost'
  title: string
  amount: number
  date: string
  status?: string
}

export function ProjectTimeline({ projectId, tenantId, isTR }: ProjectTimelineProps) {
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTimeline()
  }, [projectId])

  async function loadTimeline() {
    const [invoicesRes, expensesRes, stockRes, ordersRes, costsRes] = await Promise.all([
      supabase.from('invoices').select('id, invoice_number, total, status, issue_date').eq('project_id', projectId),
      supabase.from('expenses').select('id, description, amount, expense_date').eq('project_id', projectId),
      supabase.from('stock_movements').select('id, movement_type, quantity, unit_cost, created_at, products(name)').eq('project_id', projectId),
      supabase.from('orders').select('id, order_number, total, status, created_at').eq('project_id', projectId),
      supabase.from('project_cost_entries').select('id, cost_type, description, amount, recorded_at').eq('project_id', projectId),
    ])

    const timeline: TimelineEntry[] = []

    ;(invoicesRes.data || []).forEach(inv => {
      timeline.push({
        id: inv.id,
        type: 'invoice',
        title: inv.invoice_number,
        amount: Number(inv.total),
        date: inv.issue_date || '',
        status: inv.status,
      })
    })

    ;(expensesRes.data || []).forEach(exp => {
      timeline.push({
        id: exp.id,
        type: 'expense',
        title: exp.description || (isTR ? 'Gider' : 'Expense'),
        amount: Number(exp.amount),
        date: exp.expense_date || '',
      })
    })

    ;(stockRes.data || []).forEach(sm => {
      timeline.push({
        id: sm.id,
        type: 'stock',
        title: `${(sm as any).products?.name || ''} (${sm.movement_type === 'out' ? (isTR ? 'Cikis' : 'Out') : (isTR ? 'Giris' : 'In')})`,
        amount: Number(sm.quantity) * Number(sm.unit_cost || 0),
        date: sm.created_at || '',
      })
    })

    ;(ordersRes.data || []).forEach(o => {
      timeline.push({
        id: o.id,
        type: 'order',
        title: o.order_number,
        amount: Number(o.total),
        date: o.created_at || '',
        status: o.status,
      })
    })

    ;(costsRes.data || []).forEach(c => {
      timeline.push({
        id: c.id,
        type: 'cost',
        title: c.description || c.cost_type,
        amount: Number(c.amount),
        date: c.recorded_at || '',
      })
    })

    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setEntries(timeline)
    setLoading(false)
  }

  function getIcon(type: string) {
    const map: Record<string, any> = {
      invoice: FileText,
      expense: Receipt,
      stock: Package,
      order: ShoppingCart,
      cost: DollarSign,
    }
    return map[type] || DollarSign
  }

  function getColor(type: string) {
    const map: Record<string, string> = {
      invoice: 'text-blue-600 bg-blue-50',
      expense: 'text-orange-600 bg-orange-50',
      stock: 'text-teal-600 bg-teal-50',
      order: 'text-cyan-600 bg-cyan-50',
      cost: 'text-gray-600 bg-gray-50',
    }
    return map[type] || 'text-gray-600 bg-gray-50'
  }

  function getTypeLabel(type: string) {
    if (isTR) {
      const map: Record<string, string> = {
        invoice: 'Fatura', expense: 'Gider', stock: 'Stok',
        order: 'Siparis', cost: 'Maliyet',
      }
      return map[type] || type
    }
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{isTR ? 'Finansal Zaman Cizelgesi' : 'Financial Timeline'}</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            {isTR ? 'Henuz bagli islem yok' : 'No linked transactions yet'}
          </p>
        ) : (
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
            <div className="space-y-4">
              {entries.slice(0, 20).map(entry => {
                const Icon = getIcon(entry.type)
                const colorClasses = getColor(entry.type)
                const [iconColor, iconBg] = colorClasses.split(' ')

                return (
                  <div key={`${entry.type}-${entry.id}`} className="relative flex gap-4 pl-0">
                    <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${iconBg}`}>
                      <Icon className={`h-4 w-4 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{getTypeLabel(entry.type)}</Badge>
                        <span className="text-sm font-medium truncate">{entry.title}</span>
                        {entry.status && (
                          <Badge variant="outline" className="text-[10px]">{entry.status}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-sm font-semibold">
                          {entry.amount > 0 ? Number(entry.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}
                        </span>
                        {entry.date && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString(isTR ? 'tr-TR' : 'en-US')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {entries.length > 20 && (
              <p className="text-xs text-center text-muted-foreground mt-4">
                {isTR ? `+${entries.length - 20} daha fazla kayit` : `+${entries.length - 20} more entries`}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
