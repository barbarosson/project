'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  ShoppingCart, Search, RefreshCw, Filter, Eye, Truck, Package,
  CheckCircle2, Clock, XCircle, RotateCcw, MapPin, Phone, Mail,
  Link2, ArrowRight, Loader2
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useTenant } from '@/contexts/tenant-context'
import { supabase } from '@/lib/supabase'
import { createOrderFromMarketplace } from '@/lib/module-integration'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'

interface OrderItem {
  id: string
  marketplace_product_id: string
  product_name: string
  sku: string
  quantity: number
  unit_price: number
  discount_amount: number
  tax_amount: number
  total_amount: number
}

interface MarketplaceOrder {
  id: string
  account_id: string
  tenant_id: string
  marketplace_order_id: string
  order_date: string
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: {
    name?: string
    street?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    phone?: string
  } | null
  order_status: string
  total_amount: number
  commission_amount: number
  net_amount: number
  currency: string
  tracking_number: string
  cargo_company: string
  is_synced_to_erp: boolean
  local_order_id?: string | null
  notes: string
  created_at: string
  marketplace_accounts?: {
    store_name: string
    marketplaces?: { name: string; code: string }
  }
  marketplace_order_items?: OrderItem[]
}

interface Marketplace {
  id: number
  name: string
  code: string
}

interface MarketplaceOrdersProps {
  orders: MarketplaceOrder[]
  marketplaces: Marketplace[]
  onRefresh: () => void
}

const ORDER_STATUS_CONFIG: Record<string, { color: string; icon: typeof Clock; label: { tr: string; en: string } }> = {
  pending: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: { tr: 'Bekliyor', en: 'Pending' } },
  confirmed: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle2, label: { tr: 'Onaylandı', en: 'Confirmed' } },
  shipped: { color: 'bg-sky-100 text-sky-700', icon: Truck, label: { tr: 'Kargoda', en: 'Shipped' } },
  delivered: { color: 'bg-emerald-100 text-emerald-700', icon: Package, label: { tr: 'Teslim Edildi', en: 'Delivered' } },
  cancelled: { color: 'bg-red-100 text-red-700', icon: XCircle, label: { tr: 'İptal', en: 'Cancelled' } },
  returned: { color: 'bg-gray-100 text-gray-700', icon: RotateCcw, label: { tr: 'İade', en: 'Returned' } },
}

const MARKETPLACE_COLORS: Record<string, string> = {
  trendyol: 'bg-orange-500',
  hepsiburada: 'bg-orange-600',
  amazon: 'bg-yellow-500',
  n11: 'bg-green-600',
  pazarama: 'bg-blue-500',
  ciceksepeti: 'bg-pink-500',
  akakce: 'bg-red-500',
  cimri: 'bg-cyan-600',
  idefix: 'bg-purple-500',
  teknosa: 'bg-red-600',
}

export function MarketplaceOrders({ orders, marketplaces, onRefresh }: MarketplaceOrdersProps) {
  const { language } = useLanguage()
  const { tenantId } = useTenant()
  const isTR = language === 'tr'
  const locale = isTR ? tr : enUS

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [marketplaceFilter, setMarketplaceFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [creatingOrderFor, setCreatingOrderFor] = useState<string | null>(null)

  async function handleCreateLocalOrder(mpOrder: MarketplaceOrder) {
    if (!tenantId) return
    setCreatingOrderFor(mpOrder.id)
    const result = await createOrderFromMarketplace(mpOrder.id, tenantId)
    if (result.success) {
      toast.success(isTR ? 'Siparis olusturuldu' : 'Order created from marketplace')
      onRefresh()
    } else {
      toast.error(result.error || 'Error')
    }
    setCreatingOrderFor(null)
  }

  const openOrderDetail = async (order: MarketplaceOrder) => {
    setSelectedOrder(order)
    setDetailOpen(true)

    const { data } = await supabase
      .from('marketplace_order_items')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at')

    setOrderItems(data || [])
  }

  const filtered = orders.filter(o => {
    if (search) {
      const q = search.toLowerCase()
      if (
        !o.marketplace_order_id?.toLowerCase().includes(q) &&
        !o.customer_name?.toLowerCase().includes(q) &&
        !o.tracking_number?.toLowerCase().includes(q)
      ) return false
    }
    if (statusFilter !== 'all' && o.order_status !== statusFilter) return false
    if (marketplaceFilter !== 'all') {
      const mpCode = o.marketplace_accounts?.marketplaces?.code
      if (mpCode !== marketplaceFilter) return false
    }
    return true
  })

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    const symbol = currency === 'TRY' ? 'TL' : currency
    return `${amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${symbol}`
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-[#0A192F]">
                {isTR ? 'Pazaryeri Siparişleri' : 'Marketplace Orders'}
              </CardTitle>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-muted-foreground">
                  {orders.length} {isTR ? 'sipariş' : 'orders'}
                </span>
                {orders.filter(o => o.order_status === 'pending').length > 0 && (
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-[10px]">
                    <Clock className="h-3 w-3 mr-1" />
                    {orders.filter(o => o.order_status === 'pending').length} {isTR ? 'bekliyor' : 'pending'}
                  </Badge>
                )}
              </div>
            </div>
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              {isTR ? 'Yenile' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isTR ? 'Sipariş no, müşteri veya takip no...' : 'Order no, customer or tracking...'}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-3.5 w-3.5 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isTR ? 'Tüm Durumlar' : 'All Status'}</SelectItem>
                <SelectItem value="pending">{isTR ? 'Bekliyor' : 'Pending'}</SelectItem>
                <SelectItem value="confirmed">{isTR ? 'Onaylandı' : 'Confirmed'}</SelectItem>
                <SelectItem value="shipped">{isTR ? 'Kargoda' : 'Shipped'}</SelectItem>
                <SelectItem value="delivered">{isTR ? 'Teslim Edildi' : 'Delivered'}</SelectItem>
                <SelectItem value="cancelled">{isTR ? 'İptal' : 'Cancelled'}</SelectItem>
                <SelectItem value="returned">{isTR ? 'İade' : 'Returned'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={marketplaceFilter} onValueChange={setMarketplaceFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isTR ? 'Tüm Pazaryerleri' : 'All Marketplaces'}</SelectItem>
                {marketplaces.map(m => (
                  <SelectItem key={m.id} value={m.code}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-muted/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h3 className="font-medium text-[#0A192F] mb-1">
                {isTR ? 'Sipariş bulunamadı' : 'No orders found'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isTR
                  ? 'Pazaryeri hesaplarınız bağlandığında siparişler burada listelenecek'
                  : 'Orders will be listed here once your marketplace accounts are connected'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>{isTR ? 'Sipariş No' : 'Order No'}</TableHead>
                      <TableHead>{isTR ? 'Pazaryeri' : 'Marketplace'}</TableHead>
                      <TableHead>{isTR ? 'Müşteri' : 'Customer'}</TableHead>
                      <TableHead>{isTR ? 'Tarih' : 'Date'}</TableHead>
                      <TableHead>{isTR ? 'Tutar' : 'Amount'}</TableHead>
                      <TableHead>{isTR ? 'Durum' : 'Status'}</TableHead>
                      <TableHead>{isTR ? 'Kargo' : 'Shipping'}</TableHead>
                      <TableHead className="text-center">{isTR ? 'Siparis' : 'Order'}</TableHead>
                      <TableHead className="text-center">{isTR ? 'Detay' : 'Detail'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((order) => {
                      const mpCode = order.marketplace_accounts?.marketplaces?.code || ''
                      const mpName = order.marketplace_accounts?.marketplaces?.name || ''
                      const color = MARKETPLACE_COLORS[mpCode] || 'bg-gray-500'
                      const statusConf = ORDER_STATUS_CONFIG[order.order_status] || ORDER_STATUS_CONFIG.pending
                      const StatusIcon = statusConf.icon

                      return (
                        <TableRow key={order.id}>
                          <TableCell>
                            <span className="font-mono text-xs font-medium text-[#0A192F]">
                              {order.marketplace_order_id}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`${color} w-5 h-5 rounded flex items-center justify-center text-white font-bold text-[8px]`}>
                                {mpName.charAt(0)}
                              </div>
                              <span className="text-xs">{mpName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{order.customer_name || '-'}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {order.order_date
                                ? format(new Date(order.order_date), 'dd MMM yyyy', { locale })
                                : '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold">
                                {formatCurrency(order.total_amount, order.currency)}
                              </span>
                              {order.net_amount > 0 && order.net_amount !== order.total_amount && (
                                <span className="text-[10px] text-emerald-600">
                                  {isTR ? 'Net' : 'Net'}: {formatCurrency(order.net_amount, order.currency)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <StatusIcon className="h-3.5 w-3.5" />
                              <Badge className={`${statusConf.color} text-[10px] border-0`}>
                                {isTR ? statusConf.label.tr : statusConf.label.en}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {order.tracking_number ? (
                              <div className="flex flex-col">
                                <span className="text-xs font-mono">{order.tracking_number}</span>
                                {order.cargo_company && (
                                  <span className="text-[10px] text-muted-foreground">{order.cargo_company}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {order.local_order_id ? (
                              <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 cursor-pointer"
                                onClick={() => window.location.href = '/orders'}
                              >
                                <Link2 className="h-2.5 w-2.5 mr-0.5" />
                                {isTR ? 'Bagli' : 'Linked'}
                              </Badge>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] text-teal-700 hover:text-teal-800 hover:bg-teal-50"
                                onClick={() => handleCreateLocalOrder(order)}
                                disabled={!!creatingOrderFor}
                              >
                                {creatingOrderFor === order.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <ArrowRight className="h-3 w-3 mr-0.5" />
                                    {isTR ? 'Siparis Olustur' : 'Create Order'}
                                  </>
                                )}
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openOrderDetail(order)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader>
                <SheetTitle className="text-[#0A192F]">
                  {isTR ? 'Sipariş Detayı' : 'Order Detail'}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{isTR ? 'Sipariş No' : 'Order No'}</p>
                    <p className="font-mono font-semibold text-[#0A192F]">{selectedOrder.marketplace_order_id}</p>
                  </div>
                  <Badge className={`${(ORDER_STATUS_CONFIG[selectedOrder.order_status] || ORDER_STATUS_CONFIG.pending).color} border-0`}>
                    {isTR
                      ? (ORDER_STATUS_CONFIG[selectedOrder.order_status] || ORDER_STATUS_CONFIG.pending).label.tr
                      : (ORDER_STATUS_CONFIG[selectedOrder.order_status] || ORDER_STATUS_CONFIG.pending).label.en}
                  </Badge>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-[#0A192F] mb-3">
                    {isTR ? 'Müşteri Bilgileri' : 'Customer Information'}
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.customer_name && (
                      <p className="text-sm">{selectedOrder.customer_name}</p>
                    )}
                    {selectedOrder.customer_email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {selectedOrder.customer_email}
                      </div>
                    )}
                    {selectedOrder.customer_phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {selectedOrder.customer_phone}
                      </div>
                    )}
                  </div>
                </div>

                {selectedOrder.shipping_address && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-[#0A192F] mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {isTR ? 'Teslimat Adresi' : 'Shipping Address'}
                      </h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {selectedOrder.shipping_address.name && <p>{selectedOrder.shipping_address.name}</p>}
                        {selectedOrder.shipping_address.street && <p>{selectedOrder.shipping_address.street}</p>}
                        <p>
                          {[
                            selectedOrder.shipping_address.city,
                            selectedOrder.shipping_address.state,
                            selectedOrder.shipping_address.postal_code,
                          ].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-[#0A192F] mb-3">
                    {isTR ? 'Sipariş Kalemleri' : 'Order Items'}
                  </h4>
                  {orderItems.length > 0 ? (
                    <div className="space-y-3">
                      {orderItems.map((item) => (
                        <div key={item.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/30">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.product_name || item.marketplace_product_id}</p>
                            {item.sku && (
                              <p className="text-[10px] text-muted-foreground">SKU: {item.sku}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.quantity} x {formatCurrency(item.unit_price, selectedOrder.currency)}
                            </p>
                          </div>
                          <span className="text-sm font-semibold ml-3">
                            {formatCurrency(item.total_amount, selectedOrder.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {isTR ? 'Kalem bilgisi mevcut değil' : 'No item details available'}
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isTR ? 'Toplam Tutar' : 'Total Amount'}</span>
                    <span className="font-semibold">{formatCurrency(selectedOrder.total_amount, selectedOrder.currency)}</span>
                  </div>
                  {selectedOrder.commission_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{isTR ? 'Komisyon' : 'Commission'}</span>
                      <span className="text-red-600">-{formatCurrency(selectedOrder.commission_amount, selectedOrder.currency)}</span>
                    </div>
                  )}
                  {selectedOrder.net_amount > 0 && (
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                      <span>{isTR ? 'Net Tutar' : 'Net Amount'}</span>
                      <span className="text-emerald-600">{formatCurrency(selectedOrder.net_amount, selectedOrder.currency)}</span>
                    </div>
                  )}
                </div>

                {(selectedOrder.tracking_number || selectedOrder.cargo_company) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-[#0A192F] mb-3 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        {isTR ? 'Kargo Bilgileri' : 'Shipping Info'}
                      </h4>
                      <div className="text-sm space-y-1">
                        {selectedOrder.cargo_company && (
                          <p className="text-muted-foreground">{selectedOrder.cargo_company}</p>
                        )}
                        {selectedOrder.tracking_number && (
                          <p className="font-mono">{selectedOrder.tracking_number}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-[#0A192F] flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    {isTR ? 'Modul Entegrasyonu' : 'Module Integration'}
                  </h4>
                  {selectedOrder.local_order_id ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm text-green-800">
                        {isTR ? 'Siparis sistemi ile baglandi' : 'Linked to order system'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-green-300 text-green-700"
                        onClick={() => window.location.href = '/orders'}
                      >
                        {isTR ? 'Siparise Git' : 'Go to Order'}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-[#00D4AA] hover:bg-[#00B894] text-sm"
                      onClick={() => handleCreateLocalOrder(selectedOrder)}
                      disabled={!!creatingOrderFor}
                    >
                      {creatingOrderFor === selectedOrder.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      {isTR ? 'Siparis Olustur ve Fatura/Stok Bagla' : 'Create Order & Link to Invoice/Stock'}
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Badge variant={selectedOrder.is_synced_to_erp ? 'default' : 'outline'} className="text-xs">
                    {selectedOrder.is_synced_to_erp
                      ? (isTR ? 'ERP Senkron' : 'ERP Synced')
                      : (isTR ? 'ERP Bekliyor' : 'ERP Pending')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {selectedOrder.created_at && format(new Date(selectedOrder.created_at), 'dd MMM yyyy HH:mm', { locale })}
                  </span>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
