'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/contexts/language-context'
import { useTenant } from '@/contexts/tenant-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateTicketDialog({ open, onOpenChange, onSuccess }: CreateTicketDialogProps) {
  const { t } = useLanguage()
  const { tenantId } = useTenant()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    message: '',
    created_by: 'User'
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setSubmitting(true)
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user?.id) {
        throw new Error('Authentication required. Please log in again.')
      }
      const tenant_id = userData.user.id
      const userEmail = userData.user.email || 'unknown@example.com'
      const userName = userData.user.user_metadata?.full_name || formData.created_by

      const ticketNumber = `TKT-${Date.now().toString().slice(-8)}`

      const { data: ticketData, error } = await supabase
        .from('support_tickets')
        .insert({
          tenant_id,
          subject: formData.subject,
          category: formData.category,
          priority: formData.priority,
          message: formData.message,
          created_by: userName,
          status: 'Open',
          ticket_number: ticketNumber
        })
        .select()
        .single()

      if (error) throw error

      // Send email notification to info@modulustech.com
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-ticket-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ticketData: {
                ticket_number: ticketNumber,
                subject: formData.subject,
                category: formData.category,
                priority: formData.priority,
                message: formData.message,
                user_email: userEmail,
                user_name: userName
              }
            })
          }
        )
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError)
      }

      toast.success('Support ticket created successfully')
      setFormData({
        subject: '',
        category: 'general',
        priority: 'medium',
        message: '',
        created_by: 'User'
      })
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create support ticket')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.support.createTicket}</DialogTitle>
          <DialogDescription>
            Submit a support ticket and our team will get back to you as soon as possible
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">{t.support.subject} *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief description of your issue"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">{t.support.category}</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">{t.support.categories.technical}</SelectItem>
                  <SelectItem value="billing">{t.support.categories.billing}</SelectItem>
                  <SelectItem value="feature">{t.support.categories.feature}</SelectItem>
                  <SelectItem value="general">{t.support.categories.general}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">{t.support.priority}</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t.support.priorities.low}</SelectItem>
                  <SelectItem value="medium">{t.support.priorities.medium}</SelectItem>
                  <SelectItem value="high">{t.support.priorities.high}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t.support.message} *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Please provide detailed information about your issue..."
              rows={6}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#2ECC71] hover:bg-[#27AE60]"
            >
              {submitting ? t.common.loading : t.support.createTicket}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
