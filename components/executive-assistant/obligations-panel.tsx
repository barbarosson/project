'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus, Search, AlertTriangle, Clock, CheckCircle2, Trash2, Pencil, Filter
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { supabase } from '@/lib/supabase'
import { format, isPast, isWithinInterval, addDays } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'

interface ObligationType {
  id: number
  name: string
  category: string
  default_reminder_days: number
}

interface Obligation {
  id: string
  tenant_id: string
  user_id: string
  obligation_type_id: number | null
  title: string
  description: string
  due_date: string
  frequency: string
  next_due_date: string | null
  status: string
  priority: string
  responsible_person: string
  contact_email: string
  notes: string
  created_at: string
  obligation_types?: ObligationType
}

interface ObligationsPanelProps {
  obligations: Obligation[]
  obligationTypes: ObligationType[]
  tenantId: string
  userId: string
  onRefresh: () => void
}

const emptyForm = {
  title: '',
  description: '',
  due_date: '',
  frequency: 'once',
  status: 'pending',
  priority: 'medium',
  responsible_person: '',
  contact_email: '',
  notes: '',
  obligation_type_id: '',
}

export function ObligationsPanel({ obligations, obligationTypes, tenantId, userId, onRefresh }: ObligationsPanelProps) {
  const { language } = useLanguage()
  const isTR = language === 'tr'
  const locale = isTR ? tr : enUS

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  const statusLabel = (status: string) => {
    const map: Record<string, string> = isTR
      ? { pending: 'Beklemede', in_progress: 'Devam Ediyor', completed: 'Tamamlandı', overdue: 'Gecikmiş' }
      : { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', overdue: 'Overdue' }
    return map[status] || status
  }

  const priorityLabel = (p: string) => {
    const map: Record<string, string> = isTR
      ? { low: 'Düşük', medium: 'Orta', high: 'Yüksek', critical: 'Kritik' }
      : { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }
    return map[p] || p
  }

  const frequencyLabel = (f: string) => {
    const map: Record<string, string> = isTR
      ? { once: 'Tek Seferlik', monthly: 'Aylık', quarterly: 'Üç Aylık', yearly: 'Yıllık' }
      : { once: 'One-time', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }
    return map[f] || f
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'overdue': return 'destructive'
      case 'in_progress': return 'secondary'
      default: return 'outline'
    }
  }

  const priorityColor = (p: string) => {
    switch (p) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-amber-600 bg-amber-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const filtered = obligations.filter(o => {
    if (searchQuery && !o.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterStatus !== 'all' && o.status !== filterStatus) return false
    if (filterCategory !== 'all') {
      const type = obligationTypes.find(t => t.id === o.obligation_type_id)
      if (!type || type.category !== filterCategory) return false
    }
    return true
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (o: Obligation) => {
    setEditingId(o.id)
    setForm({
      title: o.title,
      description: o.description || '',
      due_date: o.due_date,
      frequency: o.frequency || 'once',
      status: o.status,
      priority: o.priority,
      responsible_person: o.responsible_person || '',
      contact_email: o.contact_email || '',
      notes: o.notes || '',
      obligation_type_id: o.obligation_type_id?.toString() || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.due_date) return
    setSaving(true)
    try {
      const payload = {
        tenant_id: tenantId,
        user_id: userId,
        title: form.title,
        description: form.description,
        due_date: form.due_date,
        frequency: form.frequency,
        status: form.status,
        priority: form.priority,
        responsible_person: form.responsible_person,
        contact_email: form.contact_email,
        notes: form.notes,
        obligation_type_id: form.obligation_type_id ? parseInt(form.obligation_type_id) : null,
        updated_at: new Date().toISOString(),
      }
      if (editingId) {
        await supabase.from('executive_obligations').update(payload).eq('id', editingId)
      } else {
        await supabase.from('executive_obligations').insert(payload)
      }
      setDialogOpen(false)
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(isTR ? 'Bu yükümlülüğü silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this obligation?')) return
    await supabase.from('executive_obligations').delete().eq('id', id)
    onRefresh()
  }

  const isDueSoon = (dateStr: string) => {
    const date = new Date(dateStr)
    return isWithinInterval(date, { start: new Date(), end: addDays(new Date(), 7) })
  }

  const categories = Array.from(new Set(obligationTypes.map(t => t.category)))

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold text-[#0A192F]">
            {isTR ? 'Yasal Yükümlülükler' : 'Legal Obligations'}
          </CardTitle>
          <Button onClick={openCreate} size="sm" className="bg-[#2ECC71] hover:bg-[#27AE60] text-white">
            <Plus className="h-4 w-4 mr-1" />
            {isTR ? 'Yeni Yükümlülük' : 'New Obligation'}
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isTR ? 'Yükümlülük ara...' : 'Search obligations...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] h-9">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isTR ? 'Tüm Durumlar' : 'All Status'}</SelectItem>
              <SelectItem value="pending">{isTR ? 'Beklemede' : 'Pending'}</SelectItem>
              <SelectItem value="in_progress">{isTR ? 'Devam Ediyor' : 'In Progress'}</SelectItem>
              <SelectItem value="completed">{isTR ? 'Tamamlandı' : 'Completed'}</SelectItem>
              <SelectItem value="overdue">{isTR ? 'Gecikmiş' : 'Overdue'}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isTR ? 'Tüm Kategoriler' : 'All Categories'}</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {isTR ? 'Henüz yükümlülük eklenmemiş.' : 'No obligations yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">{isTR ? 'Yükümlülük' : 'Obligation'}</TableHead>
                  <TableHead className="font-semibold">{isTR ? 'Kategori' : 'Category'}</TableHead>
                  <TableHead className="font-semibold">{isTR ? 'Vade' : 'Due Date'}</TableHead>
                  <TableHead className="font-semibold">{isTR ? 'Periyot' : 'Frequency'}</TableHead>
                  <TableHead className="font-semibold">{isTR ? 'Öncelik' : 'Priority'}</TableHead>
                  <TableHead className="font-semibold">{isTR ? 'Durum' : 'Status'}</TableHead>
                  <TableHead className="font-semibold text-right">{isTR ? 'İşlemler' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => {
                  const type = obligationTypes.find(t => t.id === o.obligation_type_id)
                  const overdue = o.status !== 'completed' && isPast(new Date(o.due_date))
                  const soon = !overdue && isDueSoon(o.due_date)
                  return (
                    <TableRow key={o.id} className={overdue ? 'bg-red-50/50' : soon ? 'bg-amber-50/30' : ''}>
                      <TableCell>
                        <div className="font-medium text-[#0A192F]">{o.title}</div>
                        {o.responsible_person && (
                          <div className="text-xs text-muted-foreground mt-0.5">{o.responsible_person}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {type ? (
                          <Badge variant="outline" className="text-xs">
                            {type.category.charAt(0).toUpperCase() + type.category.slice(1)}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {overdue && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                          {soon && <Clock className="h-3.5 w-3.5 text-amber-500" />}
                          <span className={overdue ? 'text-red-600 font-medium' : ''}>
                            {format(new Date(o.due_date), 'dd MMM yyyy', { locale })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{frequencyLabel(o.frequency)}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${priorityColor(o.priority)}`}>
                          {priorityLabel(o.priority)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(overdue && o.status !== 'completed' ? 'overdue' : o.status)}>
                          {overdue && o.status !== 'completed'
                            ? statusLabel('overdue')
                            : statusLabel(o.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {o.status !== 'completed' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={async () => {
                                await supabase.from('executive_obligations').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', o.id)
                                onRefresh()
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(o)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(o.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? (isTR ? 'Yükümlülük Düzenle' : 'Edit Obligation')
                : (isTR ? 'Yeni Yükümlülük' : 'New Obligation')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isTR ? 'Başlık' : 'Title'} *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>{isTR ? 'Yükümlülük Türü' : 'Obligation Type'}</Label>
              <Select value={form.obligation_type_id} onValueChange={(v) => setForm({ ...form, obligation_type_id: v })}>
                <SelectTrigger><SelectValue placeholder={isTR ? 'Tür seçin...' : 'Select type...'} /></SelectTrigger>
                <SelectContent>
                  {obligationTypes.map(t => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isTR ? 'Açıklama' : 'Description'}</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isTR ? 'Vade Tarihi' : 'Due Date'} *</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div>
                <Label>{isTR ? 'Periyot' : 'Frequency'}</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">{isTR ? 'Tek Seferlik' : 'One-time'}</SelectItem>
                    <SelectItem value="monthly">{isTR ? 'Aylık' : 'Monthly'}</SelectItem>
                    <SelectItem value="quarterly">{isTR ? 'Üç Aylık' : 'Quarterly'}</SelectItem>
                    <SelectItem value="yearly">{isTR ? 'Yıllık' : 'Yearly'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isTR ? 'Öncelik' : 'Priority'}</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{isTR ? 'Düşük' : 'Low'}</SelectItem>
                    <SelectItem value="medium">{isTR ? 'Orta' : 'Medium'}</SelectItem>
                    <SelectItem value="high">{isTR ? 'Yüksek' : 'High'}</SelectItem>
                    <SelectItem value="critical">{isTR ? 'Kritik' : 'Critical'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isTR ? 'Durum' : 'Status'}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{isTR ? 'Beklemede' : 'Pending'}</SelectItem>
                    <SelectItem value="in_progress">{isTR ? 'Devam Ediyor' : 'In Progress'}</SelectItem>
                    <SelectItem value="completed">{isTR ? 'Tamamlandı' : 'Completed'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isTR ? 'Sorumlu Kişi' : 'Responsible Person'}</Label>
                <Input value={form.responsible_person} onChange={(e) => setForm({ ...form, responsible_person: e.target.value })} />
              </div>
              <div>
                <Label>{isTR ? 'İletişim E-posta' : 'Contact Email'}</Label>
                <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>{isTR ? 'Notlar' : 'Notes'}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {isTR ? 'İptal' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.title || !form.due_date} className="bg-[#2ECC71] hover:bg-[#27AE60] text-white">
              {saving ? (isTR ? 'Kaydediliyor...' : 'Saving...') : (isTR ? 'Kaydet' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
