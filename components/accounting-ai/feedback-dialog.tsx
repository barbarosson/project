'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2 } from 'lucide-react'

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (feedback: {
    solved_problem: string
    is_accurate: string
    is_clear: string
    comment: string
  }) => Promise<void>
  isTR: boolean
}

export function FeedbackDialog({ open, onOpenChange, onSubmit, isTR }: FeedbackDialogProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    solved_problem: 'yes',
    is_accurate: 'yes',
    is_clear: 'very_clear',
    comment: '',
  })

  async function handleSubmit() {
    setSaving(true)
    try {
      await onSubmit(form)
      onOpenChange(false)
      setForm({ solved_problem: 'yes', is_accurate: 'yes', is_clear: 'very_clear', comment: '' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isTR ? 'Geri Bildirim' : 'Feedback'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <Label className="text-sm font-medium">
              {isTR ? 'Cevap sorununuzu cozdu mu?' : 'Did the answer solve your problem?'}
            </Label>
            <RadioGroup
              value={form.solved_problem}
              onValueChange={v => setForm({ ...form, solved_problem: v })}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="yes" id="sp-yes" />
                <Label htmlFor="sp-yes" className="text-sm">{isTR ? 'Evet' : 'Yes'}</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="partial" id="sp-partial" />
                <Label htmlFor="sp-partial" className="text-sm">{isTR ? 'Kismen' : 'Partially'}</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="no" id="sp-no" />
                <Label htmlFor="sp-no" className="text-sm">{isTR ? 'Hayir' : 'No'}</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-medium">
              {isTR ? 'Cevap dogru ve guncel mi?' : 'Is the answer accurate and up-to-date?'}
            </Label>
            <RadioGroup
              value={form.is_accurate}
              onValueChange={v => setForm({ ...form, is_accurate: v })}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="yes" id="ia-yes" />
                <Label htmlFor="ia-yes" className="text-sm">{isTR ? 'Evet' : 'Yes'}</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="uncertain" id="ia-uncertain" />
                <Label htmlFor="ia-uncertain" className="text-sm">{isTR ? 'Belirsiz' : 'Uncertain'}</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="no" id="ia-no" />
                <Label htmlFor="ia-no" className="text-sm">{isTR ? 'Hayir' : 'No'}</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-medium">
              {isTR ? 'Cevap yeterince acik mi?' : 'Is the answer clear enough?'}
            </Label>
            <RadioGroup
              value={form.is_clear}
              onValueChange={v => setForm({ ...form, is_clear: v })}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="very_clear" id="ic-vc" />
                <Label htmlFor="ic-vc" className="text-sm">{isTR ? 'Cok Acik' : 'Very Clear'}</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="normal" id="ic-normal" />
                <Label htmlFor="ic-normal" className="text-sm">{isTR ? 'Normal' : 'Normal'}</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="unclear" id="ic-unclear" />
                <Label htmlFor="ic-unclear" className="text-sm">{isTR ? 'Belirsiz' : 'Unclear'}</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-medium">
              {isTR ? 'Ek aciklamalar (istege bagli)' : 'Additional comments (optional)'}
            </Label>
            <Textarea
              value={form.comment}
              onChange={e => setForm({ ...form, comment: e.target.value })}
              placeholder={isTR ? 'Goruslerinizi yazin...' : 'Write your comments...'}
              rows={3}
              className="mt-2"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {isTR ? 'Iptal' : 'Cancel'}
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isTR ? 'Gonder' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
