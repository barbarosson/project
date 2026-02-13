'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface CreateWarehouseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  onSuccess: () => void
  isTR: boolean
}

export function CreateWarehouseDialog({ open, onOpenChange, tenantId, onSuccess, isTR }: CreateWarehouseDialogProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    is_main: false,
    manager_name: '',
    capacity_description: '',
    notes: '',
  })

  async function handleSubmit() {
    if (!formData.name.trim()) {
      toast.error(isTR ? 'Depo adi zorunludur' : 'Warehouse name is required')
      return
    }

    setSaving(true)
    try {
      if (formData.is_main) {
        await supabase
          .from('warehouses')
          .update({ is_main: false })
          .eq('tenant_id', tenantId)
          .eq('is_main', true)
      }

      const { error } = await supabase.from('warehouses').insert({
        tenant_id: tenantId,
        name: formData.name,
        code: formData.code || formData.name.substring(0, 3).toUpperCase(),
        location: formData.location,
        is_main: formData.is_main,
        manager_name: formData.manager_name,
        capacity_description: formData.capacity_description,
        notes: formData.notes,
      })

      if (error) throw error
      toast.success(isTR ? 'Depo olusturuldu' : 'Warehouse created')
      onSuccess()
      onOpenChange(false)
      setFormData({ name: '', code: '', location: '', is_main: false, manager_name: '', capacity_description: '', notes: '' })
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
          <DialogTitle>{isTR ? 'Yeni Depo Ekle' : 'Add New Warehouse'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{isTR ? 'Depo Adi' : 'Warehouse Name'} *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder={isTR ? 'Ana Depo Istanbul' : 'Main Warehouse Istanbul'}
              />
            </div>
            <div>
              <Label>{isTR ? 'Kod' : 'Code'}</Label>
              <Input
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder="IST"
                maxLength={10}
              />
            </div>
          </div>

          <div>
            <Label>{isTR ? 'Konum / Adres' : 'Location / Address'}</Label>
            <Input
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder={isTR ? 'Istanbul, Turkiye' : 'Istanbul, Turkey'}
            />
          </div>

          <div>
            <Label>{isTR ? 'Depo Sorumlusu' : 'Manager'}</Label>
            <Input
              value={formData.manager_name}
              onChange={e => setFormData({ ...formData, manager_name: e.target.value })}
            />
          </div>

          <div>
            <Label>{isTR ? 'Kapasite Aciklamasi' : 'Capacity Description'}</Label>
            <Input
              value={formData.capacity_description}
              onChange={e => setFormData({ ...formData, capacity_description: e.target.value })}
              placeholder={isTR ? '500 palet, 2000 m2' : '500 pallets, 2000 sqm'}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="font-medium">{isTR ? 'Ana Depo' : 'Main Warehouse'}</Label>
              <p className="text-xs text-muted-foreground">
                {isTR ? 'Bu depoyu varsayilan ana depo olarak isaretle' : 'Mark this as the default primary warehouse'}
              </p>
            </div>
            <Switch
              checked={formData.is_main}
              onCheckedChange={v => setFormData({ ...formData, is_main: v })}
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {isTR ? 'Iptal' : 'Cancel'}
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-[#00D4AA] hover:bg-[#00B894]">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isTR ? 'Depo Olustur' : 'Create Warehouse'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
