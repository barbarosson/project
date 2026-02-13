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

interface CreateBranchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  onSuccess: () => void
  isTR: boolean
}

export function CreateBranchDialog({ open, onOpenChange, tenantId, onSuccess, isTR }: CreateBranchDialogProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    manager_name: '',
    is_headquarters: false,
    notes: '',
  })

  async function handleSubmit() {
    if (!formData.name.trim()) {
      toast.error(isTR ? 'Sube adi zorunludur' : 'Branch name is required')
      return
    }

    setSaving(true)
    try {
      if (formData.is_headquarters) {
        await supabase
          .from('branches')
          .update({ is_headquarters: false })
          .eq('tenant_id', tenantId)
          .eq('is_headquarters', true)
      }

      const { error } = await supabase.from('branches').insert({
        tenant_id: tenantId,
        name: formData.name,
        code: formData.code || formData.name.substring(0, 3).toUpperCase(),
        city: formData.city,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        manager_name: formData.manager_name,
        is_headquarters: formData.is_headquarters,
        notes: formData.notes,
      })

      if (error) throw error
      toast.success(isTR ? 'Sube olusturuldu' : 'Branch created')
      onSuccess()
      onOpenChange(false)
      setFormData({ name: '', code: '', city: '', address: '', phone: '', email: '', manager_name: '', is_headquarters: false, notes: '' })
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
          <DialogTitle>{isTR ? 'Yeni Sube Ekle' : 'Add New Branch'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{isTR ? 'Sube Adi' : 'Branch Name'} *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder={isTR ? 'Istanbul Merkez' : 'Istanbul HQ'}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{isTR ? 'Sehir' : 'City'}</Label>
              <Input
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                placeholder="Istanbul"
              />
            </div>
            <div>
              <Label>{isTR ? 'Sube Muduru' : 'Branch Manager'}</Label>
              <Input
                value={formData.manager_name}
                onChange={e => setFormData({ ...formData, manager_name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>{isTR ? 'Adres' : 'Address'}</Label>
            <Input
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{isTR ? 'Telefon' : 'Phone'}</Label>
              <Input
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+90 212 ..."
              />
            </div>
            <div>
              <Label>{isTR ? 'E-posta' : 'Email'}</Label>
              <Input
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                type="email"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="font-medium">{isTR ? 'Genel Merkez' : 'Headquarters'}</Label>
              <p className="text-xs text-muted-foreground">
                {isTR ? 'Bu subeyi genel merkez olarak isaretle' : 'Mark this as the headquarters location'}
              </p>
            </div>
            <Switch
              checked={formData.is_headquarters}
              onCheckedChange={v => setFormData({ ...formData, is_headquarters: v })}
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
              {isTR ? 'Sube Olustur' : 'Create Branch'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
