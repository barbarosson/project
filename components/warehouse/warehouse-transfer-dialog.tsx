'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface WarehouseTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  warehouses: any[]
  onSuccess: () => void
  isTR: boolean
}

export function WarehouseTransferDialog({ open, onOpenChange, tenantId, warehouses, onSuccess, isTR }: WarehouseTransferDialogProps) {
  const [products, setProducts] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [sourceStock, setSourceStock] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    from_warehouse_id: '',
    to_warehouse_id: '',
    product_id: '',
    quantity: '',
    initiated_by: '',
    notes: '',
  })

  useEffect(() => {
    if (open && tenantId) {
      supabase
        .from('products')
        .select('id, name, sku')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('name')
        .then(({ data }) => setProducts(data || []))
    }
  }, [open, tenantId])

  useEffect(() => {
    if (formData.from_warehouse_id && formData.product_id) {
      supabase
        .from('warehouse_stock')
        .select('quantity')
        .eq('warehouse_id', formData.from_warehouse_id)
        .eq('product_id', formData.product_id)
        .maybeSingle()
        .then(({ data }) => {
          setSourceStock(data ? Number(data.quantity) : 0)
        })
    } else {
      setSourceStock(null)
    }
  }, [formData.from_warehouse_id, formData.product_id])

  async function generateTransferNumber() {
    const { count } = await supabase
      .from('warehouse_transfers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    return `TR-${String((count || 0) + 1).padStart(4, '0')}`
  }

  async function handleSubmit() {
    if (!formData.from_warehouse_id || !formData.to_warehouse_id) {
      toast.error(isTR ? 'Kaynak ve hedef depo secilmelidir' : 'Source and destination warehouses are required')
      return
    }
    if (!formData.product_id) {
      toast.error(isTR ? 'Urun secilmelidir' : 'Product is required')
      return
    }
    const qty = Number(formData.quantity)
    if (!qty || qty <= 0) {
      toast.error(isTR ? 'Miktar pozitif olmalidir' : 'Quantity must be positive')
      return
    }
    if (sourceStock !== null && qty > sourceStock) {
      toast.error(isTR ? 'Kaynak depoda yeterli stok yok' : 'Insufficient stock in source warehouse')
      return
    }

    setSaving(true)
    try {
      const transferNumber = await generateTransferNumber()

      const { error: transferError } = await supabase.from('warehouse_transfers').insert({
        tenant_id: tenantId,
        transfer_number: transferNumber,
        from_warehouse_id: formData.from_warehouse_id,
        to_warehouse_id: formData.to_warehouse_id,
        product_id: formData.product_id,
        quantity: qty,
        status: 'completed',
        initiated_by: formData.initiated_by,
        notes: formData.notes,
        completed_at: new Date().toISOString(),
      })

      if (transferError) throw transferError

      const { data: sourceRow } = await supabase
        .from('warehouse_stock')
        .select('id, quantity')
        .eq('warehouse_id', formData.from_warehouse_id)
        .eq('product_id', formData.product_id)
        .maybeSingle()

      if (sourceRow) {
        await supabase
          .from('warehouse_stock')
          .update({ quantity: Math.max(0, Number(sourceRow.quantity) - qty), updated_at: new Date().toISOString() })
          .eq('id', sourceRow.id)
      }

      const { data: destRow } = await supabase
        .from('warehouse_stock')
        .select('id, quantity')
        .eq('warehouse_id', formData.to_warehouse_id)
        .eq('product_id', formData.product_id)
        .maybeSingle()

      if (destRow) {
        await supabase
          .from('warehouse_stock')
          .update({ quantity: Number(destRow.quantity) + qty, updated_at: new Date().toISOString() })
          .eq('id', destRow.id)
      } else {
        await supabase.from('warehouse_stock').insert({
          warehouse_id: formData.to_warehouse_id,
          product_id: formData.product_id,
          quantity: qty,
        })
      }

      toast.success(isTR ? 'Transfer tamamlandi' : 'Transfer completed')
      onSuccess()
      onOpenChange(false)
      setFormData({ from_warehouse_id: '', to_warehouse_id: '', product_id: '', quantity: '', initiated_by: '', notes: '' })
    } catch (error: any) {
      toast.error(error.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  const activeWarehouses = warehouses.filter(w => w.is_active)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isTR ? 'Depolar Arasi Transfer' : 'Warehouse Transfer'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-3 items-end">
            <div className="col-span-2">
              <Label>{isTR ? 'Kaynak Depo' : 'From Warehouse'} *</Label>
              <Select value={formData.from_warehouse_id} onValueChange={v => setFormData({ ...formData, from_warehouse_id: v })}>
                <SelectTrigger><SelectValue placeholder={isTR ? 'Sec' : 'Select'} /></SelectTrigger>
                <SelectContent>
                  {activeWarehouses.map(w => (
                    <SelectItem key={w.id} value={w.id} disabled={w.id === formData.to_warehouse_id}>
                      {w.code ? `[${w.code}] ` : ''}{w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-center pb-2">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="col-span-2">
              <Label>{isTR ? 'Hedef Depo' : 'To Warehouse'} *</Label>
              <Select value={formData.to_warehouse_id} onValueChange={v => setFormData({ ...formData, to_warehouse_id: v })}>
                <SelectTrigger><SelectValue placeholder={isTR ? 'Sec' : 'Select'} /></SelectTrigger>
                <SelectContent>
                  {activeWarehouses.map(w => (
                    <SelectItem key={w.id} value={w.id} disabled={w.id === formData.from_warehouse_id}>
                      {w.code ? `[${w.code}] ` : ''}{w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>{isTR ? 'Urun' : 'Product'} *</Label>
            <Select value={formData.product_id} onValueChange={v => setFormData({ ...formData, product_id: v })}>
              <SelectTrigger><SelectValue placeholder={isTR ? 'Urun sec' : 'Select product'} /></SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.sku ? `[${p.sku}] ` : ''}{p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sourceStock !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                {isTR ? 'Kaynak depoda mevcut:' : 'Available in source:'}{' '}
                <Badge variant="outline" className="text-xs">{sourceStock}</Badge>
              </p>
            )}
          </div>

          <div>
            <Label>{isTR ? 'Miktar' : 'Quantity'} *</Label>
            <Input
              type="number"
              value={formData.quantity}
              onChange={e => setFormData({ ...formData, quantity: e.target.value })}
              min={1}
              max={sourceStock || undefined}
              placeholder="0"
            />
          </div>

          <div>
            <Label>{isTR ? 'Transfer Eden' : 'Initiated By'}</Label>
            <Input
              value={formData.initiated_by}
              onChange={e => setFormData({ ...formData, initiated_by: e.target.value })}
            />
          </div>

          <div>
            <Label>{isTR ? 'Notlar' : 'Notes'}</Label>
            <Textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{isTR ? 'Iptal' : 'Cancel'}</Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-[#00D4AA] hover:bg-[#00B894]">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isTR ? 'Transferi Tamamla' : 'Complete Transfer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
