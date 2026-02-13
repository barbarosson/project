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

interface EditProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  project: any
  onSuccess: () => void
  isTR: boolean
}

export function EditProjectDialog({ open, onOpenChange, tenantId, project, onSuccess, isTR }: EditProjectDialogProps) {
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
    actual_start_date: '',
    actual_end_date: '',
    priority: 'medium',
    progress_percent: '0',
    manager_name: '',
    notes: '',
  })

  useEffect(() => {
    if (open && project) {
      setFormData({
        name: project.name || '',
        code: project.code || '',
        description: project.description || '',
        status: project.status || 'planning',
        client_id: project.client_id || '',
        budget: project.budget ? String(project.budget) : '',
        currency: project.currency || 'TRY',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        actual_start_date: project.actual_start_date || '',
        actual_end_date: project.actual_end_date || '',
        priority: project.priority || 'medium',
        progress_percent: String(project.progress_percent || 0),
        manager_name: project.manager_name || '',
        notes: project.notes || '',
      })
    }
  }, [open, project])

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

  async function handleSubmit() {
    if (!formData.name.trim()) {
      toast.error(isTR ? 'Proje adi zorunludur' : 'Project name is required')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          status: formData.status,
          client_id: formData.client_id || null,
          budget: formData.budget ? Number(formData.budget) : 0,
          currency: formData.currency,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          actual_start_date: formData.actual_start_date || null,
          actual_end_date: formData.actual_end_date || null,
          priority: formData.priority,
          progress_percent: Number(formData.progress_percent) || 0,
          manager_name: formData.manager_name,
          notes: formData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id)
        .eq('tenant_id', tenantId)

      if (error) throw error
      toast.success(isTR ? 'Proje guncellendi' : 'Project updated')
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
          <DialogTitle>{isTR ? 'Proje Duzenle' : 'Edit Project'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Label>{isTR ? 'Proje Adi' : 'Project Name'} *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>{isTR ? 'Proje Kodu' : 'Project Code'}</Label>
              <Input
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{isTR ? 'Durum' : 'Status'}</Label>
              <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">{isTR ? 'Planlama' : 'Planning'}</SelectItem>
                  <SelectItem value="active">{isTR ? 'Aktif' : 'Active'}</SelectItem>
                  <SelectItem value="on_hold">{isTR ? 'Beklemede' : 'On Hold'}</SelectItem>
                  <SelectItem value="completed">{isTR ? 'Tamamlandi' : 'Completed'}</SelectItem>
                  <SelectItem value="cancelled">{isTR ? 'Iptal' : 'Cancelled'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isTR ? 'Musteri' : 'Client'}</Label>
              <Select
                value={formData.client_id || 'none'}
                onValueChange={v => setFormData({ ...formData, client_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
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
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>{isTR ? 'Butce' : 'Budget'}</Label>
              <Input
                type="number"
                value={formData.budget}
                onChange={e => setFormData({ ...formData, budget: e.target.value })}
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
            <Label>{isTR ? 'Ilerleme (%)' : 'Progress (%)'}</Label>
            <Input
              type="number"
              value={formData.progress_percent}
              onChange={e => setFormData({ ...formData, progress_percent: e.target.value })}
              min={0}
              max={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{isTR ? 'Plan Baslangic' : 'Planned Start'}</Label>
              <Input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
            </div>
            <div>
              <Label>{isTR ? 'Plan Bitis' : 'Planned End'}</Label>
              <Input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{isTR ? 'Gercek Baslangic' : 'Actual Start'}</Label>
              <Input type="date" value={formData.actual_start_date} onChange={e => setFormData({ ...formData, actual_start_date: e.target.value })} />
            </div>
            <div>
              <Label>{isTR ? 'Gercek Bitis' : 'Actual End'}</Label>
              <Input type="date" value={formData.actual_end_date} onChange={e => setFormData({ ...formData, actual_end_date: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>{isTR ? 'Proje Yoneticisi' : 'Project Manager'}</Label>
            <Input
              value={formData.manager_name}
              onChange={e => setFormData({ ...formData, manager_name: e.target.value })}
            />
          </div>

          <div>
            <Label>{isTR ? 'Aciklama' : 'Description'}</Label>
            <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} />
          </div>

          <div>
            <Label>{isTR ? 'Notlar' : 'Notes'}</Label>
            <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {isTR ? 'Iptal' : 'Cancel'}
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-[#2ECC71] hover:bg-[#27AE60]">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isTR ? 'Kaydet' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
