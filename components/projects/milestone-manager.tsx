'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Plus, Trash2, CheckCircle2, Clock, AlertTriangle,
  GripVertical, Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface MilestoneManagerProps {
  projectId: string
  tenantId: string
  isTR: boolean
}

interface Milestone {
  id: string
  title: string
  due_date: string | null
  status: string
  invoice_on_complete: boolean
  invoice_amount: number
  order_index: number
  completed_at: string | null
}

export function MilestoneManager({ projectId, tenantId, isTR }: MilestoneManagerProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newInvoiceAmount, setNewInvoiceAmount] = useState('')
  const [newAutoInvoice, setNewAutoInvoice] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchMilestones()
  }, [projectId])

  async function fetchMilestones() {
    const { data } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .eq('tenant_id', tenantId)
      .order('order_index')

    setMilestones(data || [])
    setLoading(false)
  }

  async function addMilestone() {
    if (!newTitle.trim()) return

    setSaving(true)
    const { error } = await supabase.from('project_milestones').insert({
      tenant_id: tenantId,
      project_id: projectId,
      title: newTitle,
      due_date: newDueDate || null,
      invoice_on_complete: newAutoInvoice,
      invoice_amount: newInvoiceAmount ? Number(newInvoiceAmount) : 0,
      order_index: milestones.length,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(isTR ? 'Kilometre tasi eklendi' : 'Milestone added')
      setNewTitle('')
      setNewDueDate('')
      setNewInvoiceAmount('')
      setNewAutoInvoice(false)
      fetchMilestones()
    }
    setSaving(false)
  }

  async function toggleComplete(milestone: Milestone) {
    const newStatus = milestone.status === 'completed' ? 'pending' : 'completed'
    const { error } = await supabase
      .from('project_milestones')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', milestone.id)

    if (!error) {
      fetchMilestones()
      if (newStatus === 'completed') {
        toast.success(isTR ? 'Tamamlandi olarak isaretlendi' : 'Marked as completed')
      }
    }
  }

  async function deleteMilestone(id: string) {
    const { error } = await supabase
      .from('project_milestones')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (!error) {
      toast.success(isTR ? 'Silindi' : 'Deleted')
      fetchMilestones()
    }
  }

  function getStatusIcon(status: string) {
    if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-green-600" />
    if (status === 'overdue') return <AlertTriangle className="h-4 w-4 text-red-600" />
    return <Clock className="h-4 w-4 text-gray-400" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{isTR ? 'Kilometre Taslari / Hakedis' : 'Milestones / Progress Billing'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {milestones.length > 0 && (
          <div className="space-y-2">
            {milestones.map(m => (
              <div
                key={m.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  m.status === 'completed' ? 'bg-green-50/50 border-green-200' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <button onClick={() => toggleComplete(m)} className="shrink-0">
                  {getStatusIcon(m.status)}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${m.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                    {m.title}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {m.due_date && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.due_date).toLocaleDateString(isTR ? 'tr-TR' : 'en-US')}
                      </span>
                    )}
                    {m.invoice_on_complete && (
                      <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600">
                        {isTR ? 'Oto. Fatura' : 'Auto Invoice'}
                      </Badge>
                    )}
                  </div>
                </div>
                {m.invoice_amount > 0 && (
                  <span className="text-sm font-semibold text-[#0D1B2A]">
                    {Number(m.invoice_amount).toLocaleString('tr-TR')}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => deleteMilestone(m.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            {isTR ? 'Yeni Kilometre Tasi' : 'New Milestone'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder={isTR ? 'Baslik' : 'Title'}
              />
            </div>
            <Input
              type="date"
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
            />
            <Input
              type="number"
              value={newInvoiceAmount}
              onChange={e => setNewInvoiceAmount(e.target.value)}
              placeholder={isTR ? 'Hakedis tutari' : 'Invoice amount'}
              min={0}
              step={0.01}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={newAutoInvoice} onCheckedChange={setNewAutoInvoice} />
              <Label className="text-xs">{isTR ? 'Tamamlandiginda otomatik fatura' : 'Auto invoice on complete'}</Label>
            </div>
            <Button size="sm" onClick={addMilestone} disabled={saving || !newTitle.trim()} className="bg-[#0D1B2A]">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
              {isTR ? 'Ekle' : 'Add'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
