'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, Loader2, Lock, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface StockReservationPanelProps {
  projectId: string
  tenantId: string
  isTR: boolean
}

interface Reservation {
  id: string
  product_id: string
  reserved_quantity: number
  used_quantity: number
  status: string
  notes: string
  products?: { name: string; current_stock: number; sku: string }
}

export function StockReservationPanel({ projectId, tenantId, isTR }: StockReservationPanelProps) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [projectId])

  async function loadData() {
    const [resRes, prodRes] = await Promise.all([
      supabase
        .from('project_reservations')
        .select('*, products(name, current_stock, sku)')
        .eq('project_id', projectId)
        .eq('tenant_id', tenantId)
        .order('created_at'),
      supabase
        .from('products')
        .select('id, name, sku, current_stock')
        .eq('tenant_id', tenantId)
        .order('name'),
    ])
    setReservations(resRes.data || [])
    setProducts(prodRes.data || [])
    setLoading(false)
  }

  async function addReservation() {
    if (!selectedProduct || !quantity || Number(quantity) <= 0) {
      toast.error(isTR ? 'Urun ve miktar secin' : 'Select product and quantity')
      return
    }

    const product = products.find(p => p.id === selectedProduct)
    if (product && Number(quantity) > product.current_stock) {
      toast.error(isTR ? 'Yeterli stok yok' : 'Insufficient stock')
      return
    }

    setSaving(true)
    const { error } = await supabase.from('project_reservations').insert({
      tenant_id: tenantId,
      project_id: projectId,
      product_id: selectedProduct,
      reserved_quantity: Number(quantity),
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(isTR ? 'Stok rezerve edildi' : 'Stock reserved')
      setSelectedProduct('')
      setQuantity('')
      loadData()
    }
    setSaving(false)
  }

  async function releaseReservation(id: string) {
    const { error } = await supabase
      .from('project_reservations')
      .update({ status: 'released', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (!error) {
      toast.success(isTR ? 'Rezervasyon serbest birakildi' : 'Reservation released')
      loadData()
    }
  }

  async function deleteReservation(id: string) {
    const { error } = await supabase
      .from('project_reservations')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (!error) {
      toast.success(isTR ? 'Silindi' : 'Deleted')
      loadData()
    }
  }

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      reserved: 'bg-blue-100 text-blue-800',
      partially_used: 'bg-amber-100 text-amber-800',
      fully_used: 'bg-green-100 text-green-800',
      released: 'bg-gray-100 text-gray-800',
    }
    return map[status] || 'bg-gray-100 text-gray-800'
  }

  function getStatusLabel(status: string) {
    if (isTR) {
      const map: Record<string, string> = {
        reserved: 'Rezerve', partially_used: 'Kismen Kullanildi',
        fully_used: 'Tamamen Kullanildi', released: 'Serbest',
      }
      return map[status] || status
    }
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
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
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-4 w-4" />
          {isTR ? 'Stok Rezervasyonu' : 'Stock Reservations'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reservations.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">{isTR ? 'Urun' : 'Product'}</TableHead>
                  <TableHead className="text-xs text-right">{isTR ? 'Rezerve' : 'Reserved'}</TableHead>
                  <TableHead className="text-xs text-right">{isTR ? 'Kullanilan' : 'Used'}</TableHead>
                  <TableHead className="text-xs">{isTR ? 'Durum' : 'Status'}</TableHead>
                  <TableHead className="text-xs w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{r.products?.name}</p>
                        {r.products?.sku && (
                          <p className="text-xs text-muted-foreground font-mono">{r.products.sku}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-right font-medium">{r.reserved_quantity}</TableCell>
                    <TableCell className="text-sm text-right">{r.used_quantity}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${getStatusBadge(r.status)}`}>
                        {getStatusLabel(r.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {r.status === 'reserved' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => releaseReservation(r.id)}
                            title={isTR ? 'Serbest birak' : 'Release'}
                          >
                            <Package className="h-3 w-3 text-blue-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => deleteReservation(r.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="border-t pt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">
            {isTR ? 'Yeni Rezervasyon' : 'New Reservation'}
          </p>
          <div className="flex gap-2">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={isTR ? 'Urun secin' : 'Select product'} />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.current_stock} {isTR ? 'adet' : 'pcs'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder={isTR ? 'Miktar' : 'Qty'}
              min={1}
              className="w-24"
            />
            <Button size="sm" onClick={addReservation} disabled={saving} className="bg-[#0D1B2A]">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
