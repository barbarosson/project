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

interface EditProductionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  order: any
  onSuccess: () => void
  isTR: boolean
}

export function EditProductionDialog({ open, onOpenChange, tenantId, order, onSuccess, isTR }: EditProductionDialogProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    product_name: '',
    quantity_target: '',
    quantity_produced: '',
    status: 'planned',
    priority: 'medium',
    planned_start_date: '',
    planned_end_date: '',
    actual_start_date: '',
    actual_end_date: '',
    estimated_unit_cost: '',
    waste_percent: '',
    notes: '',
  })

  useEffect(() => {
    if (open && order) {
      setFormData({
        product_name: order.product_name || '',
        quantity_target: String(order.quantity_target || ''),
        quantity_produced: String(order.quantity_produced || 0),
        status: order.status || 'planned',
        priority: order.priority || 'medium',
        planned_start_date: order.planned_start_date || '',
        planned_end_date: order.planned_end_date || '',
        actual_start_date: order.actual_start_date || '',
        actual_end_date: order.actual_end_date || '',
        estimated_unit_cost: String(order.estimated_unit_cost || ''),
        waste_percent: String(order.waste_percent || ''),
        notes: order.notes || '',
      })
    }
  }, [open, order])

  async function handleSubmit() {
    if (!formData.product_name.trim()) {
      toast.error(isTR ? 'Urun adi zorunludur' : 'Product name is required')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('production_orders')
        .update({
          product_name: formData.product_name,
          quantity_target: Number(formData.quantity_target),
          quantity_produced: Number(formData.quantity_produced),
          status: formData.status,
          priority: formData.priority,
          planned_start_date: formData.planned_start_date || null,
          planned_end_date: formData.planned_end_date || null,
          actual_start_date: formData.actual_start_date || null,
          actual_end_date: formData.actual_end_date || null,
          estimated_unit_cost: formData.estimated_unit_cost ? Number(formData.estimated_unit_cost) : 0,
          waste_percent: formData.waste_percent ? Number(formData.waste_percent) : 0,
          notes: formData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)
        .eq('tenant_id', tenantId)

      if (error) throw error
      toast.success(isTR ? 'Uretim emri guncellendi' : 'Production order updated')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isTR ? 'Uretim Emrini Duzenle' : 'Edit Production Order'}
            {order?.order_number && <span className="ml-2 text-sm font-normal text-muted-foreground">({order.order_number})</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>{isTR ? 'Urun Adi' : 'Product Name'} *</Label>
            <Input
              value={formData.product_name}
              onChange={e => setFormData({ ...formData, product_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>{isTR ? 'Hedef Miktar' : 'Target Qty'}</Label>
              <Input
                type="number"
                value={formData.quantity_target}
                onChange={e => setFormData({ ...formData, quantity_target: e.target.value })}
                min={1}
              />
            </div>
            <div>
              <Label>{isTR ? 'Uretilen Miktar' : 'Produced Qty'}</Label>
              <Input
                type="number"
                value={formData.quantity_produced}
                onChange={e => setFormData({ ...formData, quantity_produced: e.target.value })}
                min={0}
              />
            </div>
            <div>
              <Label>{isTR ? 'Fire %' : 'Waste %'}</Label>
              <Input
                type="number"
                value={formData.waste_percent}
                onChange={e => setFormData({ ...formData, waste_percent: e.target.value })}
                min={0}
                max={100}
                step={0.1}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{isTR ? 'Durum' : 'Status'}</Label>
              <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">{isTR ? 'Planli' : 'Planned'}</SelectItem>
                  <SelectItem value="in_progress">{isTR ? 'Uretimde' : 'In Progress'}</SelectItem>
                  <SelectItem value="qc_phase">{isTR ? 'Kalite Kontrol' : 'QC Phase'}</SelectItem>
                  <SelectItem value="completed">{isTR ? 'Tamamlandi' : 'Completed'}</SelectItem>
                  <SelectItem value="cancelled">{isTR ? 'Iptal' : 'Cancelled'}</SelectItem>
                </SelectContent>
              </Select>
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

          <div>
            <Label>{isTR ? 'Tahmini Birim Maliyet' : 'Estimated Unit Cost'}</Label>
            <Input
              type="number"
              value={formData.estimated_unit_cost}
              onChange={e => setFormData({ ...formData, estimated_unit_cost: e.target.value })}
              min={0}
              step={0.01}
            />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{isTR ? 'Gercek Baslangic' : 'Actual Start'}</Label>
              <Input
                type="date"
                value={formData.actual_start_date}
                onChange={e => setFormData({ ...formData, actual_start_date: e.target.value })}
              />
            </div>
            <div>
              <Label>{isTR ? 'Gercek Bitis' : 'Actual End'}</Label>
              <Input
                type="date"
                value={formData.actual_end_date}
                onChange={e => setFormData({ ...formData, actual_end_date: e.target.value })}
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
            <Button onClick={handleSubmit} disabled={saving} className="bg-[#0D1B2A] hover:bg-[#1B3A5C]">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isTR ? 'Kaydet' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
