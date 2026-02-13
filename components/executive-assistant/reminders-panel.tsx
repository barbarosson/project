'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus, Bell, BellOff, Check, Trash2, Clock
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { supabase } from '@/lib/supabase'
import { format, isPast, isWithinInterval, addHours } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'

interface Reminder {
  id: string
  tenant_id: string
  user_id: string
  title: string
  message: string
  related_type: string
  related_id: string | null
  remind_at: string
  is_read: boolean
  is_dismissed: boolean
  created_at: string
}

interface RemindersPanelProps {
  reminders: Reminder[]
  tenantId: string
  userId: string
  onRefresh: () => void
}

export function RemindersPanel({ reminders, tenantId, userId, onRefresh }: RemindersPanelProps) {
  const { language } = useLanguage()
  const isTR = language === 'tr'
  const locale = isTR ? tr : enUS

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', remind_at: '' })
  const [saving, setSaving] = useState(false)
  const [showDismissed, setShowDismissed] = useState(false)

  const active = reminders.filter(r => !r.is_dismissed)
  const dismissed = reminders.filter(r => r.is_dismissed)
  const display = showDismissed ? dismissed : active

  const handleSave = async () => {
    if (!form.title || !form.remind_at) return
    setSaving(true)
    try {
      await supabase.from('executive_reminders').insert({
        tenant_id: tenantId,
        user_id: userId,
        title: form.title,
        message: form.message,
        remind_at: new Date(form.remind_at).toISOString(),
      })
      setDialogOpen(false)
      setForm({ title: '', message: '', remind_at: '' })
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const dismiss = async (id: string) => {
    await supabase.from('executive_reminders').update({ is_dismissed: true }).eq('id', id)
    onRefresh()
  }

  const markRead = async (id: string) => {
    await supabase.from('executive_reminders').update({ is_read: true }).eq('id', id)
    onRefresh()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('executive_reminders').delete().eq('id', id)
    onRefresh()
  }

  const isUrgent = (dateStr: string) => {
    const d = new Date(dateStr)
    return isPast(d) || isWithinInterval(d, { start: new Date(), end: addHours(new Date(), 1) })
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold text-[#0A192F]">
              {isTR ? 'Hatırlatmalar' : 'Reminders'}
            </CardTitle>
            {active.length > 0 && (
              <Badge className="bg-orange-500 text-white">{active.length}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-0.5">
              <button
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${!showDismissed ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setShowDismissed(false)}
              >
                {isTR ? 'Aktif' : 'Active'} ({active.length})
              </button>
              <button
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${showDismissed ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setShowDismissed(true)}
              >
                {isTR ? 'Kapatılan' : 'Dismissed'} ({dismissed.length})
              </button>
            </div>
            <Button onClick={() => setDialogOpen(true)} size="sm" className="bg-[#00D4AA] hover:bg-[#00B894] text-white">
              <Plus className="h-4 w-4 mr-1" />
              {isTR ? 'Yeni' : 'New'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {display.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <BellOff className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>{showDismissed
              ? (isTR ? 'Kapatılan hatırlatma yok.' : 'No dismissed reminders.')
              : (isTR ? 'Aktif hatırlatma yok.' : 'No active reminders.')
            }</p>
          </div>
        ) : (
          <div className="space-y-3">
            {display.map((r) => {
              const urgent = isUrgent(r.remind_at)
              const past = isPast(new Date(r.remind_at))
              return (
                <div
                  key={r.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    r.is_dismissed
                      ? 'opacity-60 bg-muted/30'
                      : urgent
                        ? 'border-orange-200 bg-orange-50/50'
                        : 'border-border'
                  }`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg ${urgent && !r.is_dismissed ? 'bg-orange-100' : 'bg-muted'}`}>
                    {urgent && !r.is_dismissed
                      ? <Bell className="h-4 w-4 text-orange-600 animate-pulse" />
                      : <Clock className="h-4 w-4 text-muted-foreground" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium text-sm ${!r.is_read && !r.is_dismissed ? 'text-[#0A192F]' : 'text-muted-foreground'}`}>
                        {r.title}
                      </h4>
                      {!r.is_read && !r.is_dismissed && (
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    {r.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.message}</p>}
                    <p className={`text-xs mt-1 ${past && !r.is_dismissed ? 'text-orange-600 font-medium' : 'text-muted-foreground'}`}>
                      {format(new Date(r.remind_at), 'dd MMM yyyy HH:mm', { locale })}
                    </p>
                  </div>
                  {!r.is_dismissed && (
                    <div className="flex items-center gap-1 shrink-0">
                      {!r.is_read && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markRead(r.id)}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => dismiss(r.id)}>
                        <BellOff className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  {r.is_dismissed && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-500" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isTR ? 'Yeni Hatırlatma' : 'New Reminder'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isTR ? 'Başlık' : 'Title'} *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>{isTR ? 'Mesaj' : 'Message'}</Label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>{isTR ? 'Hatırlatma Zamanı' : 'Remind At'} *</Label>
              <Input type="datetime-local" value={form.remind_at} onChange={(e) => setForm({ ...form, remind_at: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {isTR ? 'İptal' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.title || !form.remind_at} className="bg-[#00D4AA] hover:bg-[#00B894] text-white">
              {saving ? (isTR ? 'Kaydediliyor...' : 'Saving...') : (isTR ? 'Kaydet' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
