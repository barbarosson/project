'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface CreateProductionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  onSuccess: () => void
  isTR: boolean
}

export function CreateProductionDialog({ open, onOpenChange, tenantId, onSuccess, isTR }: CreateProductionDialogProps) {
  const [products, setProducts] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    quantity_target: '',
    priority: 'medium',
    planned_start_date: '',
    planned_end_date: '',
    estimated_unit_cost: '',
    project_id: '',
    notes: '',
  })

  useEffect(() => {
    if (open && tenantId) {
      supabase
        .from('products')
        .select('id, name, sku, sale_price, purchase_price')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('name')
        .then(({ data }) => setProducts(data || []))

      supabase
        .from('projects')
        .select('id, name, code')
        .eq('tenant_id', tenantId)
        .in('status', ['planning', 'active'])
        .order('name')
        .then(({ data }) => setProjects(data || []))
    }
  }, [open, tenantId])

  async function generateOrderNumber() {
    const { count } = await supabase
      .from('production_orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    return `PO-${String((count || 0) + 1).padStart(4, '0')}`
  }

  function handleProductSelect(productId: string) {
    const product = products.find(p => p.id === productId)
    if (product) {
      setFormData({
        ...formData,
        product_id: productId,
        product_name: product.name,
        estimated_unit_cost: product.purchase_price ? String(product.purchase_price) : '',
      })
    }
  }

  async function handleSubmit() {
    if (!formData.product_name.trim()) {
      toast.error(isTR ? 'Urun adi zorunludur' : 'Product name is required')
      return
    }
    if (!formData.quantity_target || Number(formData.quantity_target) <= 0) {
      toast.error(isTR ? 'Hedef miktar zorunludur' : 'Target quantity is required')
      return
    }

    setSaving(true)
    try {
      const orderNumber = await generateOrderNumber()

      const { error } = await supabase.from('production_orders').insert({
        tenant_id: tenantId,
        order_number: orderNumber,
        product_id: formData.product_id || null,
        product_name: formData.product_name,
        quantity_target: Number(formData.quantity_target),
        priority: formData.priority,
        planned_start_date: formData.planned_start_date || null,
        planned_end_date: formData.planned_end_date || null,
        estimated_unit_cost: formData.estimated_unit_cost ? Number(formData.estimated_unit_cost) : 0,
        project_id: formData.project_id || null,
        notes: formData.notes,
      })

      if (error) throw error
      toast.success(isTR ? 'Uretim emri olusturuldu' : 'Production order created')
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      toast.error(error.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setFormData({
      product_id: '', product_name: '', quantity_target: '', priority: 'medium',
      planned_start_date: '', planned_end_date: '', estimated_unit_cost: '',
      project_id: '', notes: '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isTR ? 'Yeni Uretim Emri' : 'New Production Order'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>{isTR ? 'Urun' : 'Product'} *</Label>
              <Select
                value={formData.product_id || 'custom'}
                onValueChange={v => {
                  if (v === 'custom') {
                    setFormData({ ...formData, product_id: '', product_name: '' })
                  } else {
                    handleProductSelect(v)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isTR ? 'Urun secin veya manuel girin' : 'Select product or enter manually'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">{isTR ? 'Manuel giris' : 'Manual entry'}</SelectItem>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.sku ? `[${p.sku}] ` : ''}{p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!formData.product_id && (
            <div>
              <Label>{isTR ? 'Urun Adi' : 'Product Name'} *</Label>
              <Input
                value={formData.product_name}
                onChange={e => setFormData({ ...formData, product_name: e.target.value })}
                placeholder={isTR ? 'Uretilecek urun adini girin' : 'Enter product name to produce'}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{isTR ? 'Hedef Miktar' : 'Target Quantity'} *</Label>
              <Input
                type="number"
                value={formData.quantity_target}
                onChange={e => setFormData({ ...formData, quantity_target: e.target.value })}
                placeholder="0"
                min={1}
              />
            </div>
            <div>
              <Label>{isTR ? 'Oncelik' : 'Priority'}</Label>
              <Select value={formData.priority} onValueChange={v => setFormData({ ...formData, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{isTR ? 'Dusuk' : 'Low'}</SelectItem>
                  <SelectItem value="medium">{isTR ? 'Orta' : 'Medium'}</SelectItem>
                  <SelectItem value="high">{isTR ? 'Yuksek' : 'High'}</SelectItem>
                  <SelectItem value="critical">{isTR ? 'Kritik' : 'Critical'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{isTR ? 'Tahmini Birim Maliyet' : 'Estimated Unit Cost'}</Label>
              <Input
                type="number"
                value={formData.estimated_unit_cost}
                onChange={e => setFormData({ ...formData, estimated_unit_cost: e.target.value })}
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <Label>{isTR ? 'Proje' : 'Project'}</Label>
              <Select
                value={formData.project_id || 'none'}
                onValueChange={v => setFormData({ ...formData, project_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger><SelectValue placeholder={isTR ? 'Proje secin' : 'Select project'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{isTR ? 'Proje yok' : 'No project'}</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code ? `[${p.code}] ` : ''}{p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{isTR ? 'Planlanan Baslangic' : 'Planned Start'}</Label>
              <Input
                type="date"
                value={formData.planned_start_date}
                onChange={e => setFormData({ ...formData, planned_start_date: e.target.value })}
              />
            </div>
            <div>
              <Label>{isTR ? 'Planlanan Bitis' : 'Planned End'}</Label>
              <Input
                type="date"
                value={formData.planned_end_date}
                onChange={e => setFormData({ ...formData, planned_end_date: e.target.value })}
              />
            </div>
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {isTR ? 'Iptal' : 'Cancel'}
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-[#00D4AA] hover:bg-[#00B894]">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isTR ? 'Uretim Emri Olustur' : 'Create Production Order'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
