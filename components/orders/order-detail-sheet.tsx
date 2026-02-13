'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  FileText, Package, FileCheck2, Truck, CheckCircle2, XCircle,
  ArrowRight, Loader2, Link2
} from 'lucide-react'
import { getOrderLinkedData, createInvoiceFromOrder, updateOrderStatus } from '@/lib/module-integration'
import { toast } from 'sonner'

interface OrderDetailSheetProps {
  orderId: string | null
  tenantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => void
  isTR: boolean
}

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed']

export function OrderDetailSheet({ orderId, tenantId, open, onOpenChange, onRefresh, isTR }: OrderDetailSheetProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (open && orderId) loadData()
  }, [open, orderId])

  async function loadData() {
    if (!orderId) return
    setLoading(true)
    const result = await getOrderLinkedData(orderId, tenantId)
    setData(result)
    setLoading(false)
  }

  async function handleCreateInvoice() {
    if (!orderId) return
    setActionLoading('invoice')
    const result = await createInvoiceFromOrder(orderId, tenantId)
    if (result.success) {
      toast.success(isTR ? 'Fatura olusturuldu' : 'Invoice created')
      loadData()
      onRefresh()
    } else {
      toast.error(result.error || 'Error')
    }
    setActionLoading(null)
  }

  async function handleStatusChange(newStatus: string) {
    if (!orderId) return
    setActionLoading(newStatus)
    const result = await updateOrderStatus(orderId, tenantId, newStatus)
    if (result.success) {
      toast.success(isTR ? 'Durum guncellendi' : 'Status updated')
      loadData()
      onRefresh()
    } else {
      toast.error(result.error || 'Error')
    }
    setActionLoading(null)
  }

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      shipped: 'bg-teal-100 text-teal-800 border-teal-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
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

  function getNextStatuses(current: string): string[] {
    if (current === 'cancelled' || current === 'completed') return []
    const idx = STATUS_FLOW.indexOf(current)
    if (idx === -1) return ['confirmed']
    const next = STATUS_FLOW.slice(idx + 1, idx + 3)
    if (current !== 'completed' && current !== 'cancelled') {
      next.push('cancelled')
    }
    return next
  }

  const order = data?.order
  const invoices = data?.invoices || []
  const edocuments = data?.edocuments || []
  const stockMovements = data?.stockMovements || []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : order ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-3">
                <span className="text-xl">{order.order_number}</span>
                <Badge className={getStatusBadge(order.status)}>
                  {getStatusLabel(order.status)}
                </Badge>
              </SheetTitle>
              <SheetDescription>
                {order.source === 'marketplace' && (
                  <span className="inline-flex items-center gap-1 text-teal-600">
                    <Link2 className="h-3 w-3" />
                    {isTR ? 'Pazaryeri siparisi' : 'Marketplace order'}
                    {order.source_id && ` - ${order.source_id}`}
                  </span>
                )}
                {order.source === 'manual' && (isTR ? 'Manuel siparis' : 'Manual order')}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {order.status !== 'completed' && order.status !== 'cancelled' && (
                <div className="flex flex-wrap gap-2">
                  {getNextStatuses(order.status).map(status => (
                    <Button
                      key={status}
                      size="sm"
                      variant={status === 'cancelled' ? 'destructive' : 'outline'}
                      onClick={() => handleStatusChange(status)}
                      disabled={!!actionLoading}
                      className={status !== 'cancelled' ? 'border-[#00D4AA] text-[#00D4AA] hover:bg-[#00D4AA] hover:text-white' : ''}
                    >
                      {actionLoading === status && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      {status === 'confirmed' && <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                      {status === 'shipped' && <Truck className="h-3.5 w-3.5 mr-1" />}
                      {status === 'cancelled' && <XCircle className="h-3.5 w-3.5 mr-1" />}
                      {getStatusLabel(status)}
                    </Button>
                  ))}
                </div>
              )}

              {order.customers && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">{isTR ? 'Musteri' : 'Customer'}</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium">{order.customers.company_title || order.customers.name}</p>
                    {order.customers.email && (
                      <p className="text-sm text-muted-foreground">{order.customers.email}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-2">{isTR ? 'Kalemler' : 'Items'}</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>{isTR ? 'Urun' : 'Product'}</TableHead>
                        <TableHead className="text-right">{isTR ? 'Miktar' : 'Qty'}</TableHead>
                        <TableHead className="text-right">{isTR ? 'Fiyat' : 'Price'}</TableHead>
                        <TableHead className="text-right">{isTR ? 'Toplam' : 'Total'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(order.order_items || []).map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium text-sm">{item.product_name}</div>
                            {item.sku && <div className="text-xs text-muted-foreground">{item.sku}</div>}
                          </TableCell>
                          <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                          <TableCell className="text-right text-sm">{Number(item.unit_price).toFixed(2)}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{Number(item.total).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end mt-2 space-x-6 text-sm">
                  <div className="text-muted-foreground">
                    {isTR ? 'Ara Toplam:' : 'Subtotal:'} {Number(order.subtotal).toFixed(2)}
                  </div>
                  <div className="text-muted-foreground">
                    {isTR ? 'KDV:' : 'Tax:'} {Number(order.tax_total).toFixed(2)}
                  </div>
                  <div className="font-bold text-base">
                    {isTR ? 'Toplam:' : 'Total:'} {Number(order.total).toFixed(2)} {order.currency}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-3">{isTR ? 'Bagli Moduller' : 'Linked Modules'}</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">{isTR ? 'Fatura' : 'Invoice'}</span>
                      </div>
                      {invoices.length > 0 ? (
                        <div className="flex items-center gap-2">
                          {invoices.map((inv: any) => (
                            <Badge key={inv.id} variant="outline" className="text-xs">
                              {inv.invoice_number} - {inv.status}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCreateInvoice}
                          disabled={!!actionLoading || order.status === 'cancelled'}
                          className="text-xs"
                        >
                          {actionLoading === 'invoice' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          <ArrowRight className="h-3 w-3 mr-1" />
                          {isTR ? 'Fatura Olustur' : 'Create Invoice'}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium">{isTR ? 'Stok Hareketleri' : 'Stock Movements'}</span>
                      </div>
                      {stockMovements.length > 0 ? (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          {stockMovements.length} {isTR ? 'hareket' : 'movements'}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {isTR ? 'Onay/kargo sonrasi otomatik' : 'Auto on confirm/ship'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="h-4 w-4 text-teal-600" />
                        <span className="text-sm font-medium">{isTR ? 'E-Belge' : 'E-Document'}</span>
                      </div>
                      {edocuments.length > 0 ? (
                        <div className="flex items-center gap-2">
                          {edocuments.map((doc: any) => (
                            <Badge key={doc.id} variant="outline" className="text-xs">
                              {doc.document_type} - {doc.status}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {isTR ? 'Fatura olusturulduktan sonra' : 'After invoice created'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {order.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-1">{isTR ? 'Notlar' : 'Notes'}</h4>
                    <p className="text-sm text-muted-foreground">{order.notes}</p>
                  </div>
                </>
              )}

              <div className="text-xs text-muted-foreground space-y-1 pt-2">
                <p>{isTR ? 'Olusturulma:' : 'Created:'} {new Date(order.created_at).toLocaleString(isTR ? 'tr-TR' : 'en-US')}</p>
                {order.confirmed_at && <p>{isTR ? 'Onay:' : 'Confirmed:'} {new Date(order.confirmed_at).toLocaleString(isTR ? 'tr-TR' : 'en-US')}</p>}
                {order.shipped_at && <p>{isTR ? 'Kargo:' : 'Shipped:'} {new Date(order.shipped_at).toLocaleString(isTR ? 'tr-TR' : 'en-US')}</p>}
                {order.delivered_at && <p>{isTR ? 'Teslim:' : 'Delivered:'} {new Date(order.delivered_at).toLocaleString(isTR ? 'tr-TR' : 'en-US')}</p>}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">{isTR ? 'Siparis bulunamadi' : 'Order not found'}</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
