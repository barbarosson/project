'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'

interface Campaign {
  id: string
  name: string
  type: string
  description?: string
  start_date: string
  end_date: string
  budget?: number
  status: string
  target_audience?: string
  target_segment?: string
  subject?: string
  message?: string
  discount_rate?: number
}

interface EditCampaignDialogProps {
  campaign: Campaign | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditCampaignDialog({
  campaign,
  open,
  onOpenChange,
  onSuccess
}: EditCampaignDialogProps) {
  const { tenantId } = useTenant()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    budget: '',
    status: 'draft',
    target_audience: '',
    target_segment: 'all',
    subject: '',
    message: '',
    discount_rate: '0'
  })

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        type: campaign.type || 'email',
        description: campaign.description || '',
        start_date: campaign.start_date ? campaign.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
        end_date: campaign.end_date ? campaign.end_date.split('T')[0] : new Date().toISOString().split('T')[0],
        budget: campaign.budget?.toString() || '0',
        status: campaign.status || 'draft',
        target_audience: campaign.target_audience || '',
        target_segment: campaign.target_segment || 'all',
        subject: campaign.subject || '',
        message: campaign.message || '',
        discount_rate: campaign.discount_rate?.toString() || '0'
      })
    }
  }, [campaign])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!campaign) return

    if (!formData.name.trim()) {
      toast.error('Campaign name is required')
      return
    }

    setLoading(true)

    try {
      if (!tenantId) {
        throw new Error('No tenant ID available')
      }

      const { error } = await supabase
        .from('campaigns')
        .update({
          name: formData.name,
          type: formData.type,
          description: formData.description,
          start_date: formData.start_date,
          end_date: formData.end_date,
          budget: parseFloat(formData.budget) || 0,
          status: formData.status,
          target_audience: formData.target_audience,
          target_segment: formData.target_segment,
          subject: formData.subject || null,
          message: formData.message || null,
          discount_rate: parseFloat(formData.discount_rate) || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaign.id)
        .eq('tenant_id', tenantId)

      if (error) throw error

      toast.success('Campaign updated successfully!')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error updating campaign:', error)
      toast.error(error.message || 'Failed to update campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
          <DialogDescription>
            Update campaign details and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter campaign name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Campaign Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="discount">Discount</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Campaign description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_segment">Target Segment</Label>
              <Select
                value={formData.target_segment}
                onValueChange={(value) => setFormData({ ...formData, target_segment: value })}
              >
                <SelectTrigger id="target_segment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="champions">Champions</SelectItem>
                  <SelectItem value="at_risk">At Risk</SelectItem>
                  <SelectItem value="new_leads">New Leads</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.type === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Email subject line"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Campaign message content"
              rows={4}
            />
          </div>

          {formData.type === 'discount' && (
            <div className="space-y-2">
              <Label htmlFor="discount_rate">Discount Rate (%)</Label>
              <Input
                id="discount_rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.discount_rate}
                onChange={(e) => setFormData({ ...formData, discount_rate: e.target.value })}
                placeholder="0"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_audience">Target Audience</Label>
              <Input
                id="target_audience"
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                placeholder="Custom audience description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
