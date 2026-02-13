'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  ShoppingCart, Plus, Search, MoreVertical, Eye, FileText,
  Trash2, Loader2, Store, Link2, ArrowRight, CheckCircle2,
  Truck, XCircle, Package,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'
import { createInvoiceFromOrder, updateOrderStatus } from '@/lib/module-integration'
import { OrderStatsCards } from '@/components/orders/order-stats-cards'
import { CreateOrderDialog } from '@/components/orders/create-order-dialog'
import { OrderDetailSheet } from '@/components/orders/order-detail-sheet'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'

interface Order {
  id: string
  order_number: string
  source: string
  source_id: string | null
  customer_id: string | null
  status: string
  subtotal: number
  tax_total: number
  total: number
  currency: string
  invoice_id: string | null
  marketplace_account_id: string | null
  notes: string | null
  created_at: string
  customers?: {
    name: string
    company_title: string
  } | null
}

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled']

export default function OrdersPage() {
  const { tenantId, loading: tenantLoading } = useTenant()
  const { language } = useLanguage()
  const isTR = language === 'tr'

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [showDetailSheet, setShowDetailSheet] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!tenantId) return
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (name, company_title)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    if (!tenantLoading && tenantId) fetchOrders()
  }, [tenantId, tenantLoading, fetchOrders])

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'confirmed' || o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed' || o.status === 'delivered').length,
    fromMarketplace: orders.filter(o => o.source === 'marketplace').length,
  }

  const filteredOrders = orders
    .filter(o => statusFilter === 'all' || o.status === statusFilter)
    .filter(o => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.customers?.name?.toLowerCase().includes(q) ||
        o.customers?.company_title?.toLowerCase().includes(q) ||
        o.source_id?.toLowerCase().includes(q)
      )
    })

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-cyan-100 text-cyan-800',
      shipped: 'bg-teal-100 text-teal-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return map[status] || 'bg-gray-100 text-gray-800'
  }

  function getStatusLabel(status: string) {
    if (isTR) {
      const map: Record<string, string> = {
        pending: 'Beklemede', confirmed: 'Onaylandi', processing: 'Hazirlaniyor',
        shipped: 'Kargoda', delivered: 'Teslim Edildi', completed: 'Tamamlandi', cancelled: 'Iptal',
      }
      return map[status] || status
    }
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  function getSourceBadge(source: string) {
    if (source === 'marketplace') {
      return (
        <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-700 border-teal-200">
          <Store className="h-2.5 w-2.5 mr-0.5" />
          {isTR ? 'Pazaryeri' : 'Marketplace'}
        </Badge>
      )
    }
    return null
  }

  async function handleQuickAction(orderId: string, action: string) {
    setActionLoading(`${orderId}-${action}`)

    if (action === 'create_invoice') {
      const result = await createInvoiceFromOrder(orderId, tenantId!)
      if (result.success) {
        toast.success(isTR ? 'Fatura olusturuldu' : 'Invoice created')
        fetchOrders()
      } else {
        toast.error(result.error || 'Error')
      }
    } else {
      const result = await updateOrderStatus(orderId, tenantId!, action)
      if (result.success) {
        toast.success(isTR ? 'Durum guncellendi' : 'Status updated')
        fetchOrders()
      } else {
        toast.error(result.error || 'Error')
      }
    }

    setActionLoading(null)
  }

  async function confirmDelete() {
    if (!deletingOrder || !tenantId) return
    try {
      await supabase.from('order_items').delete().eq('order_id', deletingOrder.id).eq('tenant_id', tenantId)
      const { error } = await supabase.from('orders').delete().eq('id', deletingOrder.id).eq('tenant_id', tenantId)
      if (error) throw error
      toast.success(isTR ? 'Siparis silindi' : 'Order deleted')
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
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0D1B2A] to-[#1B3A5C]">
              <ShoppingCart className="h-6 w-6 text-[#B8E6FF]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isTR ? 'Siparis Yonetimi' : 'Order Management'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isTR
                  ? 'Stok, fatura, e-belge ve pazaryeri ile entegre siparis sistemi'
                  : 'Orders integrated with inventory, invoices, e-documents & marketplace'}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-[#2ECC71] hover:bg-[#27AE60]">
            <Plus className="h-4 w-4 mr-2" />
            {isTR ? 'Yeni Siparis' : 'New Order'}
          </Button>
        </div>

        <OrderStatsCards stats={stats} isTR={isTR} />

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
                    {s === 'all' ? (isTR ? 'Tumu' : 'All') : getStatusLabel(s)}
                  </Button>
                ))}
              </div>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isTR ? 'Siparis ara...' : 'Search orders...'}
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
                    <TableHead className="font-semibold">{isTR ? 'Siparis No' : 'Order No'}</TableHead>
                    <TableHead className="font-semibold">{isTR ? 'Musteri' : 'Customer'}</TableHead>
                    <TableHead className="font-semibold">{isTR ? 'Kaynak' : 'Source'}</TableHead>
                    <TableHead className="font-semibold text-right">{isTR ? 'Tutar' : 'Amount'}</TableHead>
                    <TableHead className="font-semibold">{isTR ? 'Durum' : 'Status'}</TableHead>
                    <TableHead className="font-semibold">{isTR ? 'Fatura' : 'Invoice'}</TableHead>
                    <TableHead className="font-semibold">{isTR ? 'Tarih' : 'Date'}</TableHead>
                    <TableHead className="font-semibold">{isTR ? 'Islemler' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                        {isTR ? 'Siparis bulunamadi' : 'No orders found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map(order => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>
                          <button
                            className="font-medium text-[#0D1B2A] hover:underline text-left"
                            onClick={() => { setSelectedOrderId(order.id); setShowDetailSheet(true) }}
                          >
                            {order.order_number}
                          </button>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {order.customers?.company_title || order.customers?.name || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getSourceBadge(order.source)}
                          {order.source === 'manual' && (
                            <span className="text-xs text-muted-foreground">{isTR ? 'Manuel' : 'Manual'}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold">
                            {Number(order.total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">{order.currency}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.invoice_id ? (
                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700">
                              <FileText className="h-2.5 w-2.5 mr-0.5" />
                              {isTR ? 'Mevcut' : 'Linked'}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString(isTR ? 'tr-TR' : 'en-US')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedOrderId(order.id); setShowDetailSheet(true) }}>
                                <Eye className="h-4 w-4 mr-2" />
                                {isTR ? 'Detay' : 'View Details'}
                              </DropdownMenuItem>

                              {order.status === 'pending' && (
                                <DropdownMenuItem
                                  onClick={() => handleQuickAction(order.id, 'confirmed')}
                                  disabled={!!actionLoading}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                  {isTR ? 'Onayla' : 'Confirm'}
                                </DropdownMenuItem>
                              )}

                              {(order.status === 'confirmed' || order.status === 'processing') && (
                                <DropdownMenuItem
                                  onClick={() => handleQuickAction(order.id, 'shipped')}
                                  disabled={!!actionLoading}
                                >
                                  <Truck className="h-4 w-4 mr-2 text-teal-600" />
                                  {isTR ? 'Kargoya Ver' : 'Ship'}
                                </DropdownMenuItem>
                              )}

                              {!order.invoice_id && order.status !== 'cancelled' && (
                                <DropdownMenuItem
                                  onClick={() => handleQuickAction(order.id, 'create_invoice')}
                                  disabled={!!actionLoading}
                                >
                                  <FileText className="h-4 w-4 mr-2 text-blue-600" />
                                  {isTR ? 'Fatura Olustur' : 'Create Invoice'}
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              {order.status !== 'cancelled' && order.status !== 'completed' && (
                                <DropdownMenuItem
                                  onClick={() => handleQuickAction(order.id, 'cancelled')}
                                  disabled={!!actionLoading}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  {isTR ? 'Iptal Et' : 'Cancel'}
                                </DropdownMenuItem>
                              )}

                              {order.status === 'pending' && (
                                <DropdownMenuItem
                                  onClick={() => { setDeletingOrder(order); setShowDeleteDialog(true) }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {isTR ? 'Sil' : 'Delete'}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateOrderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        tenantId={tenantId || ''}
        onSuccess={fetchOrders}
        isTR={isTR}
      />

      <OrderDetailSheet
        orderId={selectedOrderId}
        tenantId={tenantId || ''}
        open={showDetailSheet}
        onOpenChange={setShowDetailSheet}
        onRefresh={fetchOrders}
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
          title={isTR ? 'Siparisi Sil' : 'Delete Order'}
          description={
            isTR
              ? `${deletingOrder.order_number} numarali siparisi silmek istediginizden emin misiniz?`
              : `Are you sure you want to delete order ${deletingOrder.order_number}?`
          }
        />
      )}

      <Toaster />
    </DashboardLayout>
  )
}
