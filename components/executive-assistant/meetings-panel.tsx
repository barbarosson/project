'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus, Calendar, Clock, MapPin, Video, Phone, Users, Trash2, Pencil, CheckCircle2
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { supabase } from '@/lib/supabase'
import { format, isPast, isToday, isTomorrow, isWithinInterval, addDays } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'

interface Meeting {
  id: string
  tenant_id: string
  user_id: string
  title: string
  description: string
  start_time: string
  end_time: string
  location: string
  meeting_type: string
  status: string
  notes: string
  created_at: string
}

interface MeetingsPanelProps {
  meetings: Meeting[]
  tenantId: string
  userId: string
  onRefresh: () => void
}

const emptyForm = {
  title: '',
  description: '',
  start_time: '',
  end_time: '',
  location: '',
  meeting_type: 'in_person',
  status: 'scheduled',
  notes: '',
}

export function MeetingsPanel({ meetings, tenantId, userId, onRefresh }: MeetingsPanelProps) {
  const { language } = useLanguage()
  const isTR = language === 'tr'
  const locale = isTR ? tr : enUS

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'upcoming' | 'all'>('upcoming')

  const typeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />
      case 'phone': return <Phone className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const typeLabel = (type: string) => {
    const map: Record<string, string> = isTR
      ? { in_person: 'Yüz Yüze', video: 'Video Konferans', phone: 'Telefon' }
      : { in_person: 'In Person', video: 'Video Call', phone: 'Phone Call' }
    return map[type] || type
  }

  const statusLabel = (s: string) => {
    const map: Record<string, string> = isTR
      ? { scheduled: 'Planlandı', in_progress: 'Devam Ediyor', completed: 'Tamamlandı', cancelled: 'İptal Edildi' }
      : { scheduled: 'Scheduled', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' }
    return map[s] || s
  }

  const dateLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return isTR ? 'Bugün' : 'Today'
    if (isTomorrow(date)) return isTR ? 'Yarın' : 'Tomorrow'
    return format(date, 'dd MMM yyyy', { locale })
  }

  const filtered = meetings.filter(m => {
    if (view === 'upcoming') {
      return m.status !== 'completed' && m.status !== 'cancelled' && !isPast(new Date(m.end_time))
    }
    return true
  }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (m: Meeting) => {
    setEditingId(m.id)
    setForm({
      title: m.title,
      description: m.description || '',
      start_time: m.start_time ? format(new Date(m.start_time), "yyyy-MM-dd'T'HH:mm") : '',
      end_time: m.end_time ? format(new Date(m.end_time), "yyyy-MM-dd'T'HH:mm") : '',
      location: m.location || '',
      meeting_type: m.meeting_type || 'in_person',
      status: m.status,
      notes: m.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.start_time || !form.end_time) return
    setSaving(true)
    try {
      const payload = {
        tenant_id: tenantId,
        user_id: userId,
        title: form.title,
        description: form.description,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        location: form.location,
        meeting_type: form.meeting_type,
        status: form.status,
        notes: form.notes,
        updated_at: new Date().toISOString(),
      }
      if (editingId) {
        await supabase.from('executive_meetings').update(payload).eq('id', editingId)
      } else {
        await supabase.from('executive_meetings').insert(payload)
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
    if (!confirm(isTR ? 'Bu toplantıyı silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this meeting?')) return
    await supabase.from('executive_meetings').delete().eq('id', id)
    onRefresh()
  }

  const grouped = filtered.reduce<Record<string, Meeting[]>>((acc, m) => {
    const key = format(new Date(m.start_time), 'yyyy-MM-dd')
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold text-[#0A192F]">
            {isTR ? 'Toplantı Yönetimi' : 'Meeting Management'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-0.5">
              <button
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === 'upcoming' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setView('upcoming')}
              >
                {isTR ? 'Yaklaşan' : 'Upcoming'}
              </button>
              <button
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === 'all' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setView('all')}
              >
                {isTR ? 'Tümü' : 'All'}
              </button>
            </div>
            <Button onClick={openCreate} size="sm" className="bg-[#00D4AA] hover:bg-[#00B894] text-white">
              <Plus className="h-4 w-4 mr-1" />
              {isTR ? 'Yeni Toplantı' : 'New Meeting'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>{isTR ? 'Toplantı bulunamadı.' : 'No meetings found.'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateKey, dayMeetings]) => (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-sm font-medium text-muted-foreground px-2">
                    {dateLabel(dateKey)}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-3">
                  {dayMeetings.map((m) => {
                    const isActive = isWithinInterval(new Date(), {
                      start: new Date(m.start_time),
                      end: new Date(m.end_time)
                    })
                    return (
                      <div
                        key={m.id}
                        className={`flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${
                          isActive ? 'border-emerald-200 bg-emerald-50/50' : 'border-border bg-card'
                        }`}
                      >
                        <div className="flex flex-col items-center min-w-[56px] text-center">
                          <span className="text-2xl font-bold text-[#0A192F]">
                            {format(new Date(m.start_time), 'HH:mm')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(m.end_time), 'HH:mm')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-[#0A192F] truncate">{m.title}</h4>
                            {isActive && (
                              <Badge className="bg-emerald-500 text-white text-[10px]">
                                {isTR ? 'ŞİMDİ' : 'NOW'}
                              </Badge>
                            )}
                          </div>
                          {m.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{m.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {typeIcon(m.meeting_type)}
                              {typeLabel(m.meeting_type)}
                            </span>
                            {m.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {m.location}
                              </span>
                            )}
                            <Badge variant="outline" className="text-[10px]">
                              {statusLabel(m.status)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {m.status === 'scheduled' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                              onClick={async () => {
                                await supabase.from('executive_meetings').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', m.id)
                                onRefresh()
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(m.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? (isTR ? 'Toplantı Düzenle' : 'Edit Meeting')
                : (isTR ? 'Yeni Toplantı' : 'New Meeting')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isTR ? 'Başlık' : 'Title'} *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>{isTR ? 'Açıklama / Gündem' : 'Description / Agenda'}</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isTR ? 'Başlangıç' : 'Start'} *</Label>
                <Input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div>
                <Label>{isTR ? 'Bitiş' : 'End'} *</Label>
                <Input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isTR ? 'Toplantı Türü' : 'Meeting Type'}</Label>
                <Select value={form.meeting_type} onValueChange={(v) => setForm({ ...form, meeting_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">{isTR ? 'Yüz Yüze' : 'In Person'}</SelectItem>
                    <SelectItem value="video">{isTR ? 'Video Konferans' : 'Video Call'}</SelectItem>
                    <SelectItem value="phone">{isTR ? 'Telefon' : 'Phone Call'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isTR ? 'Konum' : 'Location'}</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>{isTR ? 'Toplantı Notları' : 'Meeting Notes'}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {isTR ? 'İptal' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.title || !form.start_time || !form.end_time} className="bg-[#00D4AA] hover:bg-[#00B894] text-white">
              {saving ? (isTR ? 'Kaydediliyor...' : 'Saving...') : (isTR ? 'Kaydet' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
