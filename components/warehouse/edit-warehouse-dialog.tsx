'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface EditWarehouseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  warehouse: any
  onSuccess: () => void
  isTR: boolean
}

export function EditWarehouseDialog({ open, onOpenChange, tenantId, warehouse, onSuccess, isTR }: EditWarehouseDialogProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    is_main: false,
    is_active: true,
    manager_name: '',
    capacity_description: '',
    notes: '',
  })

  useEffect(() => {
    if (open && warehouse) {
      setFormData({
        name: warehouse.name || '',
        code: warehouse.code || '',
        location: warehouse.location || '',
        is_main: warehouse.is_main || false,
        is_active: warehouse.is_active !== false,
        manager_name: warehouse.manager_name || '',
        capacity_description: warehouse.capacity_description || '',
        notes: warehouse.notes || '',
      })
    }
  }, [open, warehouse])

  async function handleSubmit() {
    if (!formData.name.trim()) {
      toast.error(isTR ? 'Depo adi zorunludur' : 'Warehouse name is required')
      return
    }

    setSaving(true)
    try {
      if (formData.is_main && !warehouse.is_main) {
        await supabase
          .from('warehouses')
          .update({ is_main: false })
          .eq('tenant_id', tenantId)
          .eq('is_main', true)
      }

      const { error } = await supabase
        .from('warehouses')
        .update({
          name: formData.name,
          code: formData.code,
          location: formData.location,
          is_main: formData.is_main,
          is_active: formData.is_active,
          manager_name: formData.manager_name,
          capacity_description: formData.capacity_description,
          notes: formData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', warehouse.id)
        .eq('tenant_id', tenantId)

      if (error) throw error
      toast.success(isTR ? 'Depo guncellendi' : 'Warehouse updated')
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isTR ? 'Depo Duzenle' : 'Edit Warehouse'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{isTR ? 'Depo Adi' : 'Warehouse Name'} *</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <Label>{isTR ? 'Kod' : 'Code'}</Label>
              <Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} maxLength={10} />
            </div>
          </div>

          <div>
            <Label>{isTR ? 'Konum / Adres' : 'Location / Address'}</Label>
            <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
          </div>

          <div>
            <Label>{isTR ? 'Depo Sorumlusu' : 'Manager'}</Label>
            <Input value={formData.manager_name} onChange={e => setFormData({ ...formData, manager_name: e.target.value })} />
          </div>

          <div>
            <Label>{isTR ? 'Kapasite Aciklamasi' : 'Capacity Description'}</Label>
            <Input value={formData.capacity_description} onChange={e => setFormData({ ...formData, capacity_description: e.target.value })} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="font-medium">{isTR ? 'Ana Depo' : 'Main Warehouse'}</Label>
              <p className="text-xs text-muted-foreground">{isTR ? 'Varsayilan ana depo' : 'Default primary warehouse'}</p>
            </div>
            <Switch checked={formData.is_main} onCheckedChange={v => setFormData({ ...formData, is_main: v })} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="font-medium">{isTR ? 'Aktif' : 'Active'}</Label>
              <p className="text-xs text-muted-foreground">{isTR ? 'Depo aktif mi?' : 'Is warehouse active?'}</p>
            </div>
            <Switch checked={formData.is_active} onCheckedChange={v => setFormData({ ...formData, is_active: v })} />
          </div>

          <div>
            <Label>{isTR ? 'Notlar' : 'Notes'}</Label>
            <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{isTR ? 'Iptal' : 'Cancel'}</Button>
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
