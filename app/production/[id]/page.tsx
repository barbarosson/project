'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from '@/components/ui/sonner'
import { ArrowLeft, Factory, Edit, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { ProductionCostDashboard } from '@/components/production/production-cost-dashboard'
import { BomManager } from '@/components/production/bom-manager'
import { LaborTracker } from '@/components/production/labor-tracker'
import { QualityCheckPanel } from '@/components/production/quality-check-panel'
import { EditProductionDialog } from '@/components/production/edit-production-dialog'

export default function ProductionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { tenantId, loading: tenantLoading } = useTenant()
  const { language } = useLanguage()
  const isTR = language === 'tr'
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)

  useEffect(() => {
    if (!tenantId || !orderId) return

    async function fetchOrder() {
      try {
        const { data, error } = await supabase
          .from('production_orders')
          .select('*, projects(name, code)')
          .eq('id', orderId)
          .eq('tenant_id', tenantId)
          .maybeSingle()

        if (error) throw error
        setOrder(data)
      } catch (error) {
        console.error('Error fetching production order:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, tenantId])

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

  function getPriorityBadge(priority: string) {
    const map: Record<string, string> = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      critical: 'bg-red-100 text-red-600',
    }
    return map[priority] || ''
  }

  if (loading || tenantLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">{isTR ? 'Uretim emri bulunamadi' : 'Production order not found'}</p>
          <Button variant="outline" onClick={() => router.push('/production')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isTR ? 'Geri Don' : 'Go Back'}
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const completionPercent = order.quantity_target > 0
    ? Math.round((order.quantity_produced / order.quantity_target) * 100)
    : 0

  const isCompleted = order.status === 'completed'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/production')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              {isTR ? 'Geri' : 'Back'}
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0A192F] to-[#1B3A5C]">
                <Factory className="h-6 w-6 text-[#7DD3FC]" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">{order.product_name}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-muted-foreground font-mono">{order.order_number}</span>
                  <Badge className={getStatusBadge(order.status)}>{getStatusLabel(order.status)}</Badge>
                  <Badge className={`text-[10px] ${getPriorityBadge(order.priority)}`}>
                    {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                  </Badge>
                  {order.projects && (
                    <Badge variant="outline" className="text-xs">
                      {order.projects.code || order.projects.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowEditDialog(true)} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            {isTR ? 'Duzenle' : 'Edit'}
          </Button>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {isTR ? 'Uretim Ilerlemesi' : 'Production Progress'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {order.quantity_produced} / {order.quantity_target} {isTR ? 'adet' : 'units'}
              </span>
              <span className="text-lg font-bold text-[#7DD3FC]">{completionPercent}%</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#1E40AF] to-[#7DD3FC] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(completionPercent, 100)}%` }}
            />
          </div>
          {order.waste_percent > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {isTR ? 'Fire orani:' : 'Waste rate:'} {order.waste_percent}%
            </p>
          )}
        </div>

        <Tabs defaultValue="costs" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="costs">{isTR ? 'Maliyet Analizi' : 'Cost Analysis'}</TabsTrigger>
            <TabsTrigger value="bom">{isTR ? 'Malzeme Listesi' : 'BOM / Recipe'}</TabsTrigger>
            <TabsTrigger value="labor">{isTR ? 'Iscilik' : 'Labor'}</TabsTrigger>
            <TabsTrigger value="qc">{isTR ? 'Kalite Kontrol' : 'Quality'}</TabsTrigger>
          </TabsList>

          <TabsContent value="costs" className="mt-4">
            <ProductionCostDashboard
              productionOrderId={orderId}
              tenantId={tenantId || ''}
              isTR={isTR}
            />
          </TabsContent>

          <TabsContent value="bom" className="mt-4">
            <BomManager
              productionOrderId={orderId}
              tenantId={tenantId || ''}
              isTR={isTR}
              readOnly={isCompleted}
            />
          </TabsContent>

          <TabsContent value="labor" className="mt-4">
            <LaborTracker
              productionOrderId={orderId}
              isTR={isTR}
              readOnly={isCompleted}
            />
          </TabsContent>

          <TabsContent value="qc" className="mt-4">
            <QualityCheckPanel
              productionOrderId={orderId}
              isTR={isTR}
              readOnly={isCompleted}
            />
          </TabsContent>
        </Tabs>
      </div>

      {showEditDialog && (
        <EditProductionDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          tenantId={tenantId || ''}
          order={order}
          onSuccess={() => {
            supabase
              .from('production_orders')
              .select('*, projects(name, code)')
              .eq('id', orderId)
              .maybeSingle()
              .then(({ data }) => { if (data) setOrder(data) })
          }}
          isTR={isTR}
        />
      )}

      <Toaster />
    </DashboardLayout>
  )
}
