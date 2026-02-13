'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, Factory, Clock, Package, Users, ShieldCheck, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ProductionDetailSheetProps {
  orderId: string | null
  tenantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  isTR: boolean
}

export function ProductionDetailSheet({ orderId, tenantId, open, onOpenChange, isTR }: ProductionDetailSheetProps) {
  const [order, setOrder] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [bomItems, setBomItems] = useState<any[]>([])
  const [laborEntries, setLaborEntries] = useState<any[]>([])
  const [qcChecks, setQcChecks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open || !orderId) return
    setLoading(true)

    Promise.all([
      supabase.from('production_orders').select('*, projects(name, code)').eq('id', orderId).maybeSingle(),
      supabase.from('production_cost_analytics').select('*').eq('production_order_id', orderId).eq('tenant_id', tenantId).maybeSingle(),
      supabase.from('production_bom_items').select('*').eq('production_order_id', orderId).order('created_at'),
      supabase.from('production_labor_entries').select('*').eq('production_order_id', orderId).order('work_date', { ascending: false }),
      supabase.from('production_quality_checks').select('*').eq('production_order_id', orderId).order('checked_at', { ascending: false }),
    ]).then(([orderRes, analyticsRes, bomRes, laborRes, qcRes]) => {
      setOrder(orderRes.data)
      setAnalytics(analyticsRes.data)
      setBomItems(bomRes.data || [])
      setLaborEntries(laborRes.data || [])
      setQcChecks(qcRes.data || [])
      setLoading(false)
    })
  }, [open, orderId, tenantId])

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      planned: 'bg-amber-100 text-amber-800',
      in_progress: 'bg-blue-100 text-blue-800',
      qc_phase: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return map[status] || 'bg-gray-100 text-gray-800'
  }

  function getStatusLabel(status: string) {
    if (isTR) {
      const map: Record<string, string> = {
        planned: 'Planli', in_progress: 'Uretimde', qc_phase: 'Kalite Kontrol',
        completed: 'Tamamlandi', cancelled: 'Iptal',
      }
      return map[status] || status
    }
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-[#7DD3FC]" />
            {isTR ? 'Uretim Detay' : 'Production Details'}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : !order ? (
          <div className="text-center py-12 text-muted-foreground">{isTR ? 'Bulunamadi' : 'Not found'}</div>
        ) : (
          <div className="space-y-5 mt-4">
            <div>
              <h3 className="text-lg font-bold">{order.product_name}</h3>
              <p className="text-sm text-muted-foreground font-mono">{order.order_number}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusBadge(order.status)}>{getStatusLabel(order.status)}</Badge>
                {order.projects && (
                  <Badge variant="outline" className="text-xs">
                    {order.projects.code || order.projects.name}
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">{isTR ? 'Uretim Ilerlemesi' : 'Production Progress'}</p>
              <div className="flex items-center gap-3">
                <Progress
                  value={analytics?.completion_percent || 0}
                  className="h-3 flex-1"
                />
                <span className="text-sm font-bold">{analytics?.completion_percent || 0}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {order.quantity_produced} / {order.quantity_target} {isTR ? 'adet' : 'units'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-[#7DD3FC]" />
                    <span className="text-xs text-muted-foreground">{isTR ? 'Toplam Maliyet' : 'Total Cost'}</span>
                  </div>
                  <p className="text-lg font-bold">
                    {Number(analytics?.total_production_cost || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs text-muted-foreground">{isTR ? 'Birim Maliyet' : 'Unit Cost'}</span>
                  </div>
                  <p className="text-lg font-bold">
                    {Number(analytics?.actual_unit_cost || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3">
                  <Package className="h-3.5 w-3.5 text-blue-500 mb-1" />
                  <p className="text-[10px] text-muted-foreground">{isTR ? 'Malzeme' : 'Material'}</p>
                  <p className="text-sm font-bold">
                    {Number(analytics?.total_material_cost || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <Users className="h-3.5 w-3.5 text-green-500 mb-1" />
                  <p className="text-[10px] text-muted-foreground">{isTR ? 'Iscilik' : 'Labor'}</p>
                  <p className="text-sm font-bold">
                    {Number(analytics?.total_labor_cost || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <Clock className="h-3.5 w-3.5 text-amber-500 mb-1" />
                  <p className="text-[10px] text-muted-foreground">{isTR ? 'Genel Gider' : 'Overhead'}</p>
                  <p className="text-sm font-bold">
                    {Number(analytics?.total_overhead_cost || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                  </p>
                </CardContent>
              </Card>
            </div>

            {bomItems.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#7DD3FC]" />
                  {isTR ? 'Malzeme Listesi (BOM)' : 'Bill of Materials'}
                </h4>
                <div className="space-y-1.5">
                  {bomItems.slice(0, 8).map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{item.product_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.actual_quantity}/{item.planned_quantity} {item.unit}
                        </p>
                      </div>
                      <span className="text-sm font-semibold">
                        {(item.actual_quantity * item.unit_cost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  {bomItems.length > 8 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{bomItems.length - 8} {isTR ? 'daha' : 'more'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {laborEntries.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#7DD3FC]" />
                  {isTR ? 'Iscilik Kayitlari' : 'Labor Entries'}
                </h4>
                <div className="space-y-1.5">
                  {laborEntries.slice(0, 5).map(entry => (
                    <div key={entry.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{entry.worker_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {entry.role || '-'} | {Number(entry.hours_worked).toFixed(1)} {isTR ? 'saat' : 'hrs'}
                        </p>
                      </div>
                      <span className="text-sm font-semibold">
                        {(Number(entry.hours_worked) * Number(entry.hourly_rate)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {qcChecks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#7DD3FC]" />
                  {isTR ? 'Kalite Kontrolleri' : 'Quality Checks'}
                </h4>
                <div className="space-y-1.5">
                  {qcChecks.slice(0, 5).map(check => {
                    const resultColor = check.result === 'passed' ? 'bg-green-100 text-green-800'
                      : check.result === 'failed' ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    return (
                      <div key={check.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{check.check_type}</p>
                          <p className="text-[10px] text-muted-foreground">{check.checked_by || '-'}</p>
                        </div>
                        <Badge className={`text-[10px] ${resultColor}`}>
                          {check.result === 'passed' ? (isTR ? 'Gecti' : 'Passed') :
                            check.result === 'failed' ? (isTR ? 'Kaldi' : 'Failed') :
                              (isTR ? 'Kosullu' : 'Conditional')}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">{isTR ? 'Planlanan Baslangic' : 'Planned Start'}</p>
                <p className="font-medium">
                  {order.planned_start_date
                    ? new Date(order.planned_start_date).toLocaleDateString(isTR ? 'tr-TR' : 'en-US')
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{isTR ? 'Planlanan Bitis' : 'Planned End'}</p>
                <p className="font-medium">
                  {order.planned_end_date
                    ? new Date(order.planned_end_date).toLocaleDateString(isTR ? 'tr-TR' : 'en-US')
                    : '-'}
                </p>
              </div>
            </div>

            {order.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">{isTR ? 'Notlar' : 'Notes'}</p>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">{order.notes}</p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
