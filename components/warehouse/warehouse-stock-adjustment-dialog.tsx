'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Minus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface WarehouseStockAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  warehouses: any[]
  onSuccess: () => void
  isTR: boolean
}

export function WarehouseStockAdjustmentDialog({ open, onOpenChange, tenantId, warehouses, onSuccess, isTR }: WarehouseStockAdjustmentDialogProps) {
  const [products, setProducts] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [currentStock, setCurrentStock] = useState<number | null>(null)
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add')
  const [formData, setFormData] = useState({
    warehouse_id: '',
    product_id: '',
    quantity: '',
    unit_cost: '',
    reason: '',
    notes: '',
  })

  useEffect(() => {
    if (open && tenantId) {
      supabase
        .from('products')
        .select('id, name, sku, purchase_price')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('name')
        .then(({ data }) => setProducts(data || []))
    }
  }, [open, tenantId])

  useEffect(() => {
    if (formData.warehouse_id && formData.product_id) {
      supabase
        .from('warehouse_stock')
        .select('quantity')
        .eq('warehouse_id', formData.warehouse_id)
        .eq('product_id', formData.product_id)
        .maybeSingle()
        .then(({ data }) => {
          setCurrentStock(data ? Number(data.quantity) : 0)
        })
    } else {
      setCurrentStock(null)
    }
  }, [formData.warehouse_id, formData.product_id])

  async function handleSubmit() {
    if (!formData.warehouse_id || !formData.product_id) {
      toast.error(isTR ? 'Depo ve urun secilmelidir' : 'Warehouse and product are required')
      return
    }
    const qty = Number(formData.quantity)
    if (!qty || qty <= 0) {
      toast.error(isTR ? 'Miktar pozitif olmalidir' : 'Quantity must be positive')
      return
    }
    if (!formData.reason.trim()) {
      toast.error(isTR ? 'Sebep zorunludur' : 'Reason is required')
      return
    }
    if (adjustType === 'subtract' && currentStock !== null && qty > currentStock) {
      toast.error(isTR ? 'Stok miktari yetersiz' : 'Insufficient stock')
      return
    }

    setSaving(true)
    try {
      const newQty = adjustType === 'add'
        ? (currentStock || 0) + qty
        : (currentStock || 0) - qty

      const { data: existingRow } = await supabase
        .from('warehouse_stock')
        .select('id')
        .eq('warehouse_id', formData.warehouse_id)
        .eq('product_id', formData.product_id)
        .maybeSingle()

      if (existingRow) {
        await supabase
          .from('warehouse_stock')
          .update({ quantity: Math.max(0, newQty), updated_at: new Date().toISOString() })
          .eq('id', existingRow.id)
      } else {
        await supabase.from('warehouse_stock').insert({
          warehouse_id: formData.warehouse_id,
          product_id: formData.product_id,
          quantity: Math.max(0, newQty),
        })
      }

      await supabase.from('stock_movements').insert({
        product_id: formData.product_id,
        warehouse_id: formData.warehouse_id,
        tenant_id: tenantId,
        movement_type: adjustType === 'add' ? 'in' : 'out',
        quantity: qty,
        unit_cost: formData.unit_cost ? Number(formData.unit_cost) : 0,
        reason: formData.reason,
        reference_type: 'warehouse_adjustment',
        notes: formData.notes,
      })

      const { data: totalStock } = await supabase
        .from('warehouse_stock')
        .select('quantity')
        .eq('product_id', formData.product_id)

      const totalQty = (totalStock || []).reduce((sum, r) => sum + Number(r.quantity), 0)

      const product = products.find(p => p.id === formData.product_id)
      const criticalLevel = product?.critical_level || 10
      const stockStatus = totalQty <= 0 ? 'out_of_stock' : totalQty <= criticalLevel ? 'low_stock' : 'in_stock'

      await supabase
        .from('products')
        .update({ current_stock: totalQty, stock_status: stockStatus })
        .eq('id', formData.product_id)

      toast.success(isTR ? 'Stok ayarlamasi tamamlandi' : 'Stock adjustment completed')
      onSuccess()
      onOpenChange(false)
      setFormData({ warehouse_id: '', product_id: '', quantity: '', unit_cost: '', reason: '', notes: '' })
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
          <DialogTitle>{isTR ? 'Stok Ayarlamasi' : 'Stock Adjustment'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={adjustType === 'add' ? 'default' : 'outline'}
              className={adjustType === 'add' ? 'bg-green-600 hover:bg-green-700 flex-1' : 'flex-1'}
              onClick={() => setAdjustType('add')}
            >
              <Plus className="h-4 w-4 mr-1" /> {isTR ? 'Stok Ekle' : 'Add Stock'}
            </Button>
            <Button
              variant={adjustType === 'subtract' ? 'default' : 'outline'}
              className={adjustType === 'subtract' ? 'bg-red-600 hover:bg-red-700 flex-1' : 'flex-1'}
              onClick={() => setAdjustType('subtract')}
            >
              <Minus className="h-4 w-4 mr-1" /> {isTR ? 'Stok Cikar' : 'Subtract Stock'}
            </Button>
          </div>

          <div>
            <Label>{isTR ? 'Depo' : 'Warehouse'} *</Label>
            <Select value={formData.warehouse_id} onValueChange={v => setFormData({ ...formData, warehouse_id: v })}>
              <SelectTrigger><SelectValue placeholder={isTR ? 'Depo sec' : 'Select warehouse'} /></SelectTrigger>
              <SelectContent>
                {activeWarehouses.map(w => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.code ? `[${w.code}] ` : ''}{w.name}
                    {w.is_main && <span className="ml-1 text-xs text-muted-foreground">(Ana)</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{isTR ? 'Urun' : 'Product'} *</Label>
            <Select
              value={formData.product_id}
              onValueChange={v => {
                const p = products.find(pr => pr.id === v)
                setFormData({
                  ...formData,
                  product_id: v,
                  unit_cost: p?.purchase_price ? String(p.purchase_price) : formData.unit_cost,
                })
              }}
            >
              <SelectTrigger><SelectValue placeholder={isTR ? 'Urun sec' : 'Select product'} /></SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.sku ? `[${p.sku}] ` : ''}{p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentStock !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                {isTR ? 'Bu depodaki mevcut stok:' : 'Current stock in this warehouse:'}{' '}
                <Badge variant="outline" className="text-xs">{currentStock}</Badge>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{isTR ? 'Miktar' : 'Quantity'} *</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                min={1}
                placeholder="0"
              />
            </div>
            {adjustType === 'add' && (
              <div>
                <Label>{isTR ? 'Birim Maliyet' : 'Unit Cost'}</Label>
                <Input
                  type="number"
                  value={formData.unit_cost}
                  onChange={e => setFormData({ ...formData, unit_cost: e.target.value })}
                  min={0}
                  step={0.01}
                />
              </div>
            )}
          </div>

          {currentStock !== null && formData.quantity && (
            <div className={`p-3 rounded-lg text-sm ${adjustType === 'add' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {isTR ? 'Yeni stok:' : 'New stock:'}{' '}
              <strong>
                {adjustType === 'add'
                  ? (currentStock + Number(formData.quantity || 0))
                  : Math.max(0, currentStock - Number(formData.quantity || 0))}
              </strong>
            </div>
          )}

          <div>
            <Label>{isTR ? 'Sebep' : 'Reason'} *</Label>
            <Input
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              placeholder={isTR ? 'Sayim farki, iade, hasar vb.' : 'Count difference, return, damage, etc.'}
            />
          </div>

          <div>
            <Label>{isTR ? 'Notlar' : 'Notes'}</Label>
            <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{isTR ? 'Iptal' : 'Cancel'}</Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-[#2ECC71] hover:bg-[#27AE60]">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isTR ? 'Ayarlamayi Kaydet' : 'Save Adjustment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
