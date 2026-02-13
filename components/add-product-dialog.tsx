'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'

interface AddProductDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddProductDialog({ isOpen, onClose, onSuccess }: AddProductDialogProps) {
  const { tenantId } = useTenant()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'product',
    unit: 'piece',
    purchase_price: '',
    sale_price: '',
    stock_quantity: '',
    min_stock_level: '',
    description: '',
    status: 'active'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.sku.trim() || !formData.sale_price) {
      toast.error(t.toast.saveError)
      return
    }

    setLoading(true)
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user?.id) {
        throw new Error(t.inventory.authRequired)
      }
      const tenant_id = userData.user.id

      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('tenant_id', tenant_id)
        .eq('sku', formData.sku.trim())
        .maybeSingle()

      if (existingProduct) {
        toast.error(t.toast.productError)
        setLoading(false)
        return
      }

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([{
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          unit: formData.unit,
          purchase_price: parseFloat(formData.purchase_price) || 0,
          sale_price: parseFloat(formData.sale_price),
          description: formData.description,
          status: formData.status,
          tenant_id,
        }])
        .select()
        .single()

      if (productError) throw productError

      await supabase.from('inventory').insert([{
        product_id: product.id,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 0,
        tenant_id,
      }])

      if (parseInt(formData.stock_quantity) > 0) {
        await supabase.from('stock_movements').insert([{
          product_id: product.id,
          movement_type: 'in',
          quantity: parseInt(formData.stock_quantity),
          unit_cost: parseFloat(formData.purchase_price) || 0,
          reason: 'Initial stock entry',
          reference_type: 'initial_stock',
          notes: t.inventory.initialStockEntry,
          tenant_id,
        }])
      }

      toast.success(t.toast.productAdded)
      onSuccess()
      onClose()
      setFormData({ name: '', sku: '', category: 'product', unit: 'piece', purchase_price: '', sale_price: '', stock_quantity: '', min_stock_level: '', description: '', status: 'active' })
    } catch (error: any) {
      console.error('Product creation error:', error)

      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        toast.error(t.toast.productError)
      } else {
        toast.error(error.message || t.toast.productError)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.inventory.addNewProduct}</DialogTitle>
          <DialogDescription>{t.inventory.createProductSetStock}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.inventory.productName} *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t.inventory.sku} *</Label>
              <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.inventory.category}</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">{t.common.product}</SelectItem>
                  <SelectItem value="service">{t.inventory.service}</SelectItem>
                  <SelectItem value="raw_material">{t.inventory.rawMaterial}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.inventory.unit}</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="piece">{t.inventory.piece}</SelectItem>
                  <SelectItem value="kg">{t.inventory.kilogram}</SelectItem>
                  <SelectItem value="meter">{t.inventory.meter}</SelectItem>
                  <SelectItem value="liter">{t.inventory.liter}</SelectItem>
                  <SelectItem value="box">{t.inventory.box}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.inventory.purchasePrice}</Label>
              <Input type="number" step="0.01" value={formData.purchase_price} onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t.inventory.salePrice} *</Label>
              <Input type="number" step="0.01" value={formData.sale_price} onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.inventory.initialStockQuantity}</Label>
              <Input type="number" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t.inventory.minimumStockLevel}</Label>
              <Input type="number" value={formData.min_stock_level} onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t.common.description}</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>{t.common.cancel}</Button>
            <Button type="submit" disabled={loading}>{loading ? t.common.adding : t.inventory.addProduct}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
