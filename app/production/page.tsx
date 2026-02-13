'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Toaster } from '@/components/ui/sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Factory, Plus, Search, MoreVertical, Eye, Edit,
  Trash2, Loader2, Calendar
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'
import { ProductionStatsCards } from '@/components/production/production-stats-cards'
import { CreateProductionDialog } from '@/components/production/create-production-dialog'
import { EditProductionDialog } from '@/components/production/edit-production-dialog'
import { ProductionDetailSheet } from '@/components/production/production-detail-sheet'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'

interface ProductionOrder {
  id: string
  order_number: string
  product_name: string
  product_id: string | null
  quantity_target: number
  quantity_produced: number
  status: string
  priority: string
  planned_start_date: string | null
  planned_end_date: string | null
  estimated_unit_cost: number
  waste_percent: number
  project_id: string | null
  created_at: string
  projects?: { name: string; code: string } | null
}

const STATUS_FILTERS = ['all', 'planned', 'in_progress', 'qc_phase', 'completed', 'cancelled']

export default function ProductionPage() {
  const router = useRouter()
  const { tenantId, loading: tenantLoading } = useTenant()
  const { language } = useLanguage()
  const isTR = language === 'tr'

  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [analytics, setAnalytics] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [showDetailSheet, setShowDetailSheet] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingOrder, setDeletingOrder] = useState<ProductionOrder | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!tenantId) return
    try {
      const { data, error } = await supabase
        .from('production_orders')
        .select('*, projects(name, code)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])

      const { data: costData } = await supabase
        .from('production_cost_analytics')
        .select('*')
        .eq('tenant_id', tenantId)

      const analyticsMap: Record<string, any> = {}
      ;(costData || []).forEach(a => { analyticsMap[a.production_order_id] = a })
      setAnalytics(analyticsMap)
    } catch (error) {
      console.error('Error fetching production orders:', error)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    if (!tenantLoading && tenantId) fetchOrders()
  }, [tenantId, tenantLoading, fetchOrders])

  const stats = {
    total: orders.length,
    planned: orders.filter(o => o.status === 'planned').length,
    inProgress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
    qcPhase: orders.filter(o => o.status === 'qc_phase').length,
    totalTarget: orders.reduce((sum, o) => sum + Number(o.quantity_target || 0), 0),
    totalProduced: orders.reduce((sum, o) => sum + Number(o.quantity_produced || 0), 0),
  }

  const filteredOrders = orders
    .filter(o => statusFilter === 'all' || o.status === statusFilter)
    .filter(o => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        o.product_name.toLowerCase().includes(q) ||
        o.order_number?.toLowerCase().includes(q) ||
        o.projects?.name?.toLowerCase().includes(q)
      )
    })

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
        all: 'Tumu', planned: 'Planli', in_progress: 'Uretimde', qc_phase: 'Kalite Kontrol',
        completed: 'Tamamlandi', cancelled: 'Iptal',
      }
      return map[status] || status
    }
    if (status === 'all') return 'All'
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

  function getPriorityLabel(p: string) {
    if (isTR) {
      const map: Record<string, string> = { low: 'Dusuk', medium: 'Orta', high: 'Yuksek', critical: 'Kritik' }
      return map[p] || p
    }
    return p.charAt(0).toUpperCase() + p.slice(1)
  }

  async function confirmDelete() {
    if (!deletingOrder || !tenantId) return
    try {
      const { error } = await supabase
        .from('production_orders')
        .delete()
        .eq('id', deletingOrder.id)
        .eq('tenant_id', tenantId)
      if (error) throw error
      toast.success(isTR ? 'Uretim emri silindi' : 'Production order deleted')
      fetchOrders()
    } catch (error: any) {
      toast.error(error.message || 'Error')
    } finally {
      setShowDeleteDialog(false)
      setDeletingOrder(null)
    }
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0A192F] to-[#1B3A5C]">
              <Factory className="h-6 w-6 text-[#7DD3FC]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isTR ? 'Uretim Takip' : 'Production Tracking'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isTR
                  ? 'Hammadde ve isciligi mamul urune donusturun, birim maliyeti canli takip edin'
                  : 'Transform raw materials & labor into finished goods with real-time unit costing'}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-[#2ECC71] hover:bg-[#27AE60]">
            <Plus className="h-4 w-4 mr-2" />
            {isTR ? 'Yeni Uretim Emri' : 'New Production Order'}
          </Button>
        </div>

        <ProductionStatsCards stats={stats} isTR={isTR} />

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                {STATUS_FILTERS.map(s => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(s)}
                    className={statusFilter === s ? 'bg-[#0D1B2A]' : ''}
                  >
                    {getStatusLabel(s)}
                  </Button>
                ))}
              </div>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isTR ? 'Uretim emri ara...' : 'Search production orders...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">{isTR ? 'Urun' : 'Product'}</TableHead>
                    <TableHead className="font-semibold">{isTR ? 'Durum' : 'Status'}</TableHead>
                    <TableHead className="font-semibold">{isTR ? 'Ilerleme' : 'Progress'}</TableHead>
                    <TableHead className="font-semibold text-right">{isTR ? 'Birim Maliyet' : 'Unit Cost'}</TableHead>
                    <TableHead className="font-semibold text-right">{isTR ? 'Toplam Maliyet' : 'Total Cost'}</TableHead>
                    <TableHead className="font-semibold">{isTR ? 'Oncelik' : 'Priority'}</TableHead>
                    <TableHead className="font-semibold">{isTR ? 'Tarih' : 'Date'}</TableHead>
                    <TableHead className="font-semibold">{isTR ? 'Islemler' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                        {isTR ? 'Uretim emri bulunamadi' : 'No production orders found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map(order => {
                      const cost = analytics[order.id]
                      const completionPercent = cost?.completion_percent || 0
                      const actualUnitCost = cost?.actual_unit_cost || 0
                      const totalCost = cost?.total_production_cost || 0
                      const isOverEstimate = order.estimated_unit_cost > 0 && actualUnitCost > order.estimated_unit_cost

                      return (
                        <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50 transition-colors">
                          <TableCell>
                            <button
                              className="text-left"
                              onClick={() => router.push(`/production/${order.id}`)}
                            >
                              <p className="font-medium text-[#0D1B2A] hover:underline">{order.product_name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{order.order_number}</p>
                              {order.projects && (
                                <p className="text-[10px] text-blue-600">{order.projects.code || order.projects.name}</p>
                              )}
                            </button>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Progress value={completionPercent} className="h-2 flex-1" />
                              <span className="text-xs font-medium w-10 text-right">
                                {order.quantity_produced}/{order.quantity_target}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <span className={`font-semibold text-sm ${isOverEstimate ? 'text-red-600' : ''}`}>
                                {Number(actualUnitCost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            {order.estimated_unit_cost > 0 && (
                              <p className="text-[10px] text-muted-foreground">
                                {isTR ? 'Tah:' : 'Est:'} {Number(order.estimated_unit_cost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold">
                            {Number(totalCost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${getPriorityBadge(order.priority)}`}>
                              {getPriorityLabel(order.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {order.planned_start_date
                                ? new Date(order.planned_start_date).toLocaleDateString(isTR ? 'tr-TR' : 'en-US')
                                : '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/production/${order.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {isTR ? 'Detay' : 'View Details'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedOrderId(order.id); setShowDetailSheet(true) }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {isTR ? 'Hizli Bakis' : 'Quick View'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setEditingOrder(order); setShowEditDialog(true) }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  {isTR ? 'Duzenle' : 'Edit'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => { setDeletingOrder(order); setShowDeleteDialog(true) }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {isTR ? 'Sil' : 'Delete'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateProductionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        tenantId={tenantId || ''}
        onSuccess={fetchOrders}
        isTR={isTR}
      />

      {editingOrder && (
        <EditProductionDialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open)
            if (!open) setEditingOrder(null)
          }}
          tenantId={tenantId || ''}
          order={editingOrder}
          onSuccess={fetchOrders}
          isTR={isTR}
        />
      )}

      <ProductionDetailSheet
        orderId={selectedOrderId}
        tenantId={tenantId || ''}
        open={showDetailSheet}
        onOpenChange={setShowDetailSheet}
        isTR={isTR}
      />

      {deletingOrder && (
        <ConfirmDeleteDialog
          open={showDeleteDialog}
          onOpenChange={(open) => {
            setShowDeleteDialog(open)
            if (!open) setDeletingOrder(null)
          }}
          onConfirm={confirmDelete}
          title={isTR ? 'Uretim Emrini Sil' : 'Delete Production Order'}
          description={
            isTR
              ? `${deletingOrder.product_name} (${deletingOrder.order_number}) uretim emrini silmek istediginizden emin misiniz? Bagli BOM, iscilik ve kalite kontrol kayitlari da silinecektir.`
              : `Are you sure you want to delete production order "${deletingOrder.product_name}" (${deletingOrder.order_number})? Related BOM items, labor entries, and QC checks will also be deleted.`
          }
        />
      )}

      <Toaster />
    </DashboardLayout>
  )
}
