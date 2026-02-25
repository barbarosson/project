'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
  Trash2, Loader2, Store, Upload, Link2, ArrowRight, CheckCircle2,
  Truck, XCircle, Package, Filter,
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'
import { createInvoiceFromOrder, updateOrderStatus } from '@/lib/module-integration'
import { convertAmount, type TcmbRatesByCurrency } from '@/lib/tcmb'
import { OrderStatsCards } from '@/components/orders/order-stats-cards'
import { CreateOrderDialog } from '@/components/orders/create-order-dialog'
import { OrderDetailSheet } from '@/components/orders/order-detail-sheet'
import { OrderExcelImportDialog } from '@/components/order-excel-import-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { useCurrency } from '@/contexts/currency-context'

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
  order_date?: string | null
  exchange_rate: number | null
  exchange_rate_date: string | null
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
  const { defaultRateType } = useCurrency()
  const isTR = language === 'tr'

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [detailDateFrom, setDetailDateFrom] = useState('')
  const [detailDateTo, setDetailDateTo] = useState('')
  const [detailAmountMin, setDetailAmountMin] = useState('')
  const [detailAmountMax, setDetailAmountMax] = useState('')
  const [detailSource, setDetailSource] = useState<'all' | 'manual' | 'marketplace'>('all')
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showExcelImport, setShowExcelImport] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [showDetailSheet, setShowDetailSheet] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [tcmbRates, setTcmbRates] = useState<TcmbRatesByCurrency | null>(null)
  const [statsDateFrom, setStatsDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })
  const [statsDateTo, setStatsDateTo] = useState(() => new Date().toISOString().slice(0, 10))
  const pendingCreatedOrderRef = useRef<Order | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!tenantId) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (name, company_title)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      const list = data || []
      const pending = pendingCreatedOrderRef.current
      if (pending && !list.some((o: Order) => o.id === pending.id)) {
        setOrders([pending, ...list])
      } else {
        setOrders(list)
      }
      pendingCreatedOrderRef.current = null
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    if (!tenantLoading && tenantId) fetchOrders()
  }, [tenantId, tenantLoading, fetchOrders])

  const hasNonTryOrders = orders.some(o => o.currency && o.currency !== 'TRY')
  useEffect(() => {
    if (!hasNonTryOrders) return
    const dateStr = new Date().toISOString().slice(0, 10)
    fetch(`/api/tcmb?date=${dateStr}`)
      .then(res => res.ok ? res.json() : {})
      .then(setTcmbRates)
      .catch(() => setTcmbRates(null))
  }, [hasNonTryOrders])

  const orderDate = (o: Order) => o.order_date || o.created_at
  const statsOrders = orders.filter((o) => {
    const d = orderDate(o)
    if (!d) return true
    const t = new Date(d).getTime()
    if (statsDateFrom) {
      const from = new Date(statsDateFrom).setHours(0, 0, 0, 0)
      if (t < from) return false
    }
    if (statsDateTo) {
      const to = new Date(statsDateTo).setHours(23, 59, 59, 999)
      if (t > to) return false
    }
    return true
  })
  const stats = {
    total: statsOrders.length,
    pending: statsOrders.filter(o => o.status === 'pending').length,
    processing: statsOrders.filter(o => o.status === 'confirmed' || o.status === 'processing').length,
    shipped: statsOrders.filter(o => o.status === 'shipped').length,
    completed: statsOrders.filter(o => o.status === 'completed' || o.status === 'delivered').length,
    fromMarketplace: statsOrders.filter(o => o.source === 'marketplace').length,
  }

  const filteredOrders = orders
    .filter(o => statusFilter === 'all' || o.status === statusFilter)
    .filter(o => {
      if (invoiceFilter === 'yes') return !!o.invoice_id
      if (invoiceFilter === 'no') return !o.invoice_id
      return true
    })
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
    .filter(o => {
      if (detailDateFrom) {
        const from = new Date(detailDateFrom)
        if (new Date(o.created_at) < from) return false
      }
      if (detailDateTo) {
        const to = new Date(detailDateTo)
        to.setHours(23, 59, 59, 999)
        if (new Date(o.created_at) > to) return false
      }
      if (detailAmountMin !== '') {
        const min = parseFloat(detailAmountMin)
        if (!isNaN(min) && Number(o.total) < min) return false
      }
      if (detailAmountMax !== '') {
        const max = parseFloat(detailAmountMax)
        if (!isNaN(max) && Number(o.total) > max) return false
      }
      if (detailSource === 'manual' && o.source !== 'manual') return false
      if (detailSource === 'marketplace' && o.source !== 'marketplace') return false
      return true
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
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#1e3a5f]">
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
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowExcelImport(true)}>
              <Upload className="h-4 w-4 mr-2" />
              {isTR ? 'Excel ile aktar' : 'Import Excel'}
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-[#00D4AA] hover:bg-[#00B894]">
              <Plus className="h-4 w-4 mr-2" />
              {isTR ? 'Yeni Siparis' : 'New Order'}
            </Button>
          </div>
        </div>

        <OrderStatsCards
          stats={stats}
          isTR={isTR}
          dateFrom={statsDateFrom}
          dateTo={statsDateTo}
          onDateFromChange={setStatsDateFrom}
          onDateToChange={setStatsDateTo}
        />

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] h-9 bg-white">
                    <SelectValue placeholder={isTR ? 'Durum' : 'Status'} />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTERS.map(s => (
                      <SelectItem key={s} value={s}>
                        {s === 'all' ? (isTR ? 'Tümü' : 'All') : getStatusLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={invoiceFilter} onValueChange={(v: 'all' | 'yes' | 'no') => setInvoiceFilter(v)}>
                  <SelectTrigger className="w-[160px] h-9 bg-white">
                    <SelectValue placeholder={isTR ? 'Fatura' : 'Invoice'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isTR ? 'Tümü' : 'All'}</SelectItem>
                    <SelectItem value="yes">{isTR ? 'Faturalandı' : 'Invoiced'}</SelectItem>
                    <SelectItem value="no">{isTR ? 'Faturalanmamış' : 'Not invoiced'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={isTR ? 'Sipariş ara (no, müşteri, kaynak)...' : 'Search (no, customer, source)...'}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 shrink-0">
                      <Filter className="h-4 w-4 mr-1.5" />
                      {isTR ? 'Detaylı filtre' : 'Advanced filter'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">{isTR ? 'Detaylı filtre' : 'Advanced filter'}</h4>
                      <div className="space-y-2">
                        <Label className="text-xs">{isTR ? 'Tarih aralığı' : 'Date range'}</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="date"
                            placeholder={isTR ? 'Başlangıç' : 'From'}
                            value={detailDateFrom}
                            onChange={e => setDetailDateFrom(e.target.value)}
                            className="h-9"
                          />
                          <Input
                            type="date"
                            placeholder={isTR ? 'Bitiş' : 'To'}
                            value={detailDateTo}
                            onChange={e => setDetailDateTo(e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">{isTR ? 'Tutar aralığı' : 'Amount range'}</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={isTR ? 'Min' : 'Min'}
                            value={detailAmountMin}
                            onChange={e => setDetailAmountMin(e.target.value)}
                            className="h-9"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={isTR ? 'Max' : 'Max'}
                            value={detailAmountMax}
                            onChange={e => setDetailAmountMax(e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">{isTR ? 'Kaynak' : 'Source'}</Label>
                        <Select value={detailSource} onValueChange={(v: 'all' | 'manual' | 'marketplace') => setDetailSource(v)}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{isTR ? 'Tümü' : 'All'}</SelectItem>
                            <SelectItem value="manual">{isTR ? 'Manuel' : 'Manual'}</SelectItem>
                            <SelectItem value="marketplace">{isTR ? 'Pazaryeri' : 'Marketplace'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setDetailDateFrom('')
                          setDetailDateTo('')
                          setDetailAmountMin('')
                          setDetailAmountMax('')
                          setDetailSource('all')
                        }}
                      >
                        {isTR ? 'Filtreleri temizle' : 'Clear filters'}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
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
                            className="font-medium text-[#0A2540] hover:underline text-left"
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
                          <div className="flex flex-col items-end">
                            <span className="font-semibold">
                              {Number(order.total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              <span className="text-xs font-normal text-muted-foreground ml-1">{order.currency}</span>
                            </span>
                            {order.currency && order.currency !== 'TRY' && (() => {
                              const totalNum = Number(order.total)
                              let tlAmount: number | null = null
                              let rateSource = ''
                              if (order.exchange_rate != null && Number(order.exchange_rate) > 0) {
                                tlAmount = totalNum * Number(order.exchange_rate)
                                rateSource = order.exchange_rate_date ? ` (${order.exchange_rate_date})` : ''
                              } else if (tcmbRates) {
                                tlAmount = convertAmount(totalNum, order.currency, 'TRY', tcmbRates, defaultRateType)
                                rateSource = ' (TCMB)'
                              }
                              if (tlAmount == null) return null
                              return (
                                <span className="text-xs text-muted-foreground mt-0.5" title={order.exchange_rate != null ? (isTR ? `Kur: ${Number(order.exchange_rate).toLocaleString('tr-TR')}${rateSource}` : `Rate: ${Number(order.exchange_rate).toLocaleString('en-US')}${rateSource}`) : undefined}>
                                  ≈ {tlAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL{rateSource}
                                </span>
                              )
                            })()}
                          </div>
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
        onSuccess={(newOrder) => {
          if (newOrder) {
            const orderRow = { ...newOrder, customers: null } as Order
            pendingCreatedOrderRef.current = orderRow
            setOrders((prev) => [orderRow, ...prev])
          }
          fetchOrders()
        }}
        isTR={isTR}
      />

      <OrderExcelImportDialog
        isOpen={showExcelImport}
        onClose={() => setShowExcelImport(false)}
        onSuccess={() => { setShowExcelImport(false); fetchOrders() }}
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
