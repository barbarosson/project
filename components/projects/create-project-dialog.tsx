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

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  onSuccess: () => void
  isTR: boolean
}

export function CreateProjectDialog({ open, onOpenChange, tenantId, onSuccess, isTR }: CreateProjectDialogProps) {
  const [customers, setCustomers] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'planning',
    client_id: '',
    budget: '',
    currency: 'TRY',
    start_date: '',
    end_date: '',
    priority: 'medium',
    manager_name: '',
    notes: '',
  })

  useEffect(() => {
    if (open && tenantId) {
      supabase
        .from('customers')
        .select('id, name, company_title')
        .eq('tenant_id', tenantId)
        .order('name')
        .then(({ data }) => setCustomers(data || []))
    }
  }, [open, tenantId])

  async function generateCode() {
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    return `PRJ-${String((count || 0) + 1).padStart(4, '0')}`
  }

  async function handleSubmit() {
    if (!formData.name.trim()) {
      toast.error(isTR ? 'Proje adi zorunludur' : 'Project name is required')
      return
    }

    setSaving(true)
    try {
      const code = formData.code || await generateCode()

      const { error } = await supabase.from('projects').insert({
        tenant_id: tenantId,
        name: formData.name,
        code,
        description: formData.description,
        status: formData.status,
        client_id: formData.client_id || null,
        budget: formData.budget ? Number(formData.budget) : 0,
        currency: formData.currency,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        priority: formData.priority,
        manager_name: formData.manager_name,
        notes: formData.notes,
      })

      if (error) throw error
      toast.success(isTR ? 'Proje olusturuldu' : 'Project created')
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
      name: '', code: '', description: '', status: 'planning', client_id: '',
      budget: '', currency: 'TRY', start_date: '', end_date: '',
      priority: 'medium', manager_name: '', notes: '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isTR ? 'Yeni Proje' : 'New Project'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Label>{isTR ? 'Proje Adi' : 'Project Name'} *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder={isTR ? 'Proje adini girin' : 'Enter project name'}
              />
            </div>
            <div>
              <Label>{isTR ? 'Proje Kodu' : 'Project Code'}</Label>
              <Input
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder="PRJ-0001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{isTR ? 'Musteri' : 'Client'}</Label>
              <Select
                value={formData.client_id || 'none'}
                onValueChange={v => setFormData({ ...formData, client_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isTR ? 'Musteri secin' : 'Select client'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{isTR ? 'Musteri yok' : 'No client'}</SelectItem>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_title || c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isTR ? 'Oncelik' : 'Priority'}</Label>
              <Select value={formData.priority} onValueChange={v => setFormData({ ...formData, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <Label>{isTR ? 'Butce' : 'Budget'}</Label>
              <Input
                type="number"
                value={formData.budget}
                onChange={e => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <Label>{isTR ? 'Para Birimi' : 'Currency'}</Label>
              <Select value={formData.currency} onValueChange={v => setFormData({ ...formData, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{isTR ? 'Baslangic Tarihi' : 'Start Date'}</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label>{isTR ? 'Bitis Tarihi' : 'End Date'}</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>{isTR ? 'Proje Yoneticisi' : 'Project Manager'}</Label>
            <Input
              value={formData.manager_name}
              onChange={e => setFormData({ ...formData, manager_name: e.target.value })}
              placeholder={isTR ? 'Yonetici adi' : 'Manager name'}
            />
          </div>

          <div>
            <Label>{isTR ? 'Aciklama' : 'Description'}</Label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={2}
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
              {isTR ? 'Proje Olustur' : 'Create Project'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
