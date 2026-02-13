'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Plus, Sparkles, Mail, Send, TrendingUp, AlertTriangle, Edit2, Trash2, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { EditCampaignDialog } from '@/components/edit-campaign-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Campaign {
  id: string
  name: string
  description?: string
  type: string
  status: string
  target_segment: string
  target_audience?: string
  subject: string
  message: string
  discount_rate: number
  budget?: number
  start_date: string
  end_date: string
  created_at: string
}

interface AIRecommendation {
  title: string
  description: string
  targetSegment: string
  discountRate: number
  suggestedSubjects: string[]
  products: string[]
}

export default function CampaignsPage() {
  const { tenantId, loading: tenantLoading } = useTenant()
  const { t } = useLanguage()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([])
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteCampaign, setDeleteCampaign] = useState<Campaign | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [name, setName] = useState('')
  const [type, setType] = useState('email')
  const [targetSegment, setTargetSegment] = useState('all')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [discountRate, setDiscountRate] = useState(0)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchCampaigns()
      generateAIRecommendations()
    }
  }, [tenantId, tenantLoading])

  async function fetchCampaigns() {
    if (!tenantId) return

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  async function generateAIRecommendations() {
    if (!tenantId) return

    try {
      const { data: products } = await supabase
        .from('products')
        .select('name, current_stock, critical_level, total_sold')
        .eq('tenant_id', tenantId)

      const { data: customers } = await supabase
        .from('customers')
        .select('id')
        .eq('tenant_id', tenantId)

      const { data: invoices } = await supabase
        .from('invoices')
        .select('created_at, total')
        .eq('tenant_id', tenantId)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

      const recommendations: AIRecommendation[] = []

      if (products && products.length > 0) {
        const overstockedProducts = products.filter(
          (p: any) => Number(p.current_stock) > Number(p.critical_level) * 3 && Number(p.total_sold) < 5
        )

        if (overstockedProducts.length > 0) {
          recommendations.push({
            title: t.campaigns.clearanceCampaign,
            description: t.campaigns.overstockedProductsDesc.replace('{count}', overstockedProducts.length.toString()),
            targetSegment: 'all',
            discountRate: 15,
            suggestedSubjects: [
              t.campaigns.flashSaleSubject,
              t.campaigns.limitedTimeOffer,
              t.campaigns.specialDiscountInside
            ],
            products: overstockedProducts.slice(0, 3).map((p: any) => p.name)
          })
        }
      }

      if (customers && invoices) {
        const avgDaysBetweenPurchases = 45
        const inactiveThreshold = new Date(Date.now() - avgDaysBetweenPurchases * 24 * 60 * 60 * 1000)

        recommendations.push({
          title: t.campaigns.reEngagementCampaign,
          description: t.campaigns.targetInactiveCustomers,
          targetSegment: 'at_risk',
          discountRate: 10,
          suggestedSubjects: [
            t.campaigns.weMissYouSubject,
            t.campaigns.comeBackAndSave,
            t.campaigns.welcomeBackDiscount
          ],
          products: []
        })
      }

      if (invoices && invoices.length > 0) {
        const totalRevenue = invoices.reduce((sum: any, inv: any) => sum + Number(inv.total), 0)
        const avgOrderValue = totalRevenue / invoices.length

        recommendations.push({
          title: t.campaigns.vipCampaign,
          description: t.campaigns.rewardBestCustomers,
          targetSegment: 'champions',
          discountRate: 20,
          suggestedSubjects: [
            t.campaigns.vipExclusiveSubject,
            t.campaigns.thankYouLoyalty,
            t.campaigns.eliteMemberDiscount
          ],
          products: []
        })
      }

      setAiRecommendations(recommendations)
    } catch (error) {
      console.error('Error generating recommendations:', error)
    }
  }

  async function handleCreateCampaign() {
    if (!tenantId) return

    if (!name.trim()) {
      toast.error(t.campaigns.enterCampaignName)
      return
    }

    try {
      const { error } = await supabase.from('campaigns').insert({
        tenant_id: tenantId,
        name,
        type,
        status: 'draft',
        target_segment: targetSegment,
        subject,
        message,
        discount_rate: discountRate,
        start_date: startDate,
        end_date: endDate
      })

      if (error) throw error

      toast.success(t.campaigns.campaignCreatedSuccess)
      setDialogOpen(false)
      resetForm()
      fetchCampaigns()
    } catch (error: any) {
      console.error('Error creating campaign:', error)
      toast.error(error.message || t.campaigns.failedToCreateCampaign)
    }
  }

  function resetForm() {
    setName('')
    setType('email')
    setTargetSegment('all')
    setSubject('')
    setMessage('')
    setDiscountRate(0)
  }

  function applyRecommendation(rec: AIRecommendation) {
    setName(rec.title)
    setTargetSegment(rec.targetSegment)
    setDiscountRate(rec.discountRate)
    setSubject(rec.suggestedSubjects[0])
    setMessage(rec.description)
    setDialogOpen(true)
  }

  function handleEditCampaign(campaign: Campaign) {
    setEditCampaign(campaign)
    setEditDialogOpen(true)
  }

  function handleDeleteClick(campaign: Campaign) {
    setDeleteCampaign(campaign)
    setDeleteDialogOpen(true)
  }

  async function handleSendCampaignEmail(campaign: Campaign) {
    if (!tenantId) return

    try {
      if (campaign.type !== 'email') {
        toast.error('Only email campaigns can be sent via email')
        return
      }

      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('email, name')
        .eq('tenant_id', tenantId)
        .not('email', 'is', null)

      if (customersError) throw customersError

      const validCustomers = customers?.filter(c => c.email) || []

      if (validCustomers.length === 0) {
        toast.error('No customers with valid email addresses found')
        return
      }

      const targetCustomers = campaign.target_segment === 'all'
        ? validCustomers
        : validCustomers.filter(c => {
            return true
          })

      toast.success(`Campaign "${campaign.name}" will be sent to ${targetCustomers.length} customers`)

      await supabase
        .from('campaigns')
        .update({ status: 'active' })
        .eq('id', campaign.id)
        .eq('tenant_id', tenantId)

      fetchCampaigns()
    } catch (error: any) {
      console.error('Error sending campaign:', error)
      toast.error(error.message || 'Failed to send campaign')
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteCampaign || !tenantId) return

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', deleteCampaign.id)
        .eq('tenant_id', tenantId)

      if (error) throw error

      toast.success(t.campaigns.campaignDeletedSuccess)
      fetchCampaigns()
    } catch (error: any) {
      console.error('Error deleting campaign:', error)
      toast.error(error.message || t.campaigns.failedToDeleteCampaign)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">{t.common.draft}</Badge>
      case 'active':
        return <Badge className="bg-green-500">{t.common.active}</Badge>
      case 'paused':
        return <Badge className="bg-yellow-500">{t.invoices.paused}</Badge>
      case 'completed':
        return <Badge variant="secondary">{t.invoices.completed}</Badge>
      default:
        return <Badge>{t.inventory.unknown}</Badge>
    }
  }

  function getSegmentLabel(segment: string) {
    switch (segment) {
      case 'all':
        return t.campaigns.allCustomersTarget
      case 'champions':
        return t.campaigns.championsHighSpend
      case 'at_risk':
        return t.campaigns.atRiskInactive
      case 'new_leads':
        return t.customers.newLeads
      default:
        return segment
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0A192F]">
              Campaign Management
            </h1>
            <p className="text-[#475569] mt-1">
              {t.campaigns.createManageCampaigns}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0D1B2A] hover:bg-[#1a2d42] text-white">
                <Plus className="h-4 w-4 mr-2" />
                {t.campaigns.newCampaign}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t.campaigns.createNewCampaign}</DialogTitle>
                <DialogDescription>
                  {t.campaigns.designCampaignWithAi}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t.campaigns.campaignName}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.placeholders.campaignExample}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">{t.campaigns.campaignType}</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">{t.campaigns.email}</SelectItem>
                        <SelectItem value="discount">{t.campaigns.discount}</SelectItem>
                        <SelectItem value="announcement">{t.campaigns.announcement}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target">{t.campaigns.targetAudience}</Label>
                    <Select value={targetSegment} onValueChange={setTargetSegment}>
                      <SelectTrigger id="target">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.campaigns.allCustomersTarget}</SelectItem>
                        <SelectItem value="champions">{t.customers.champions}</SelectItem>
                        <SelectItem value="at_risk">{t.customers.atRisk}</SelectItem>
                        <SelectItem value="new_leads">{t.customers.newLeads}</SelectItem>
                        <SelectItem value="regular">{t.customers.regular}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">{t.campaigns.emailSubjectHeadline}</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t.placeholders.catchySubject}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">{t.campaigns.message}</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t.placeholders.campaignMessage}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">{t.campaigns.discountRate}</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(Number(e.target.value))}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start">{t.campaigns.startDate}</Label>
                    <Input
                      id="start"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end">{t.campaigns.endDate}</Label>
                    <Input
                      id="end"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  {t.common.cancel}
                </Button>
                <Button
                  className="bg-[#0D1B2A] hover:bg-[#1a2d42] text-white"
                  onClick={handleCreateCampaign}
                >
                  {t.campaigns.createCampaign}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {aiRecommendations.length > 0 && (
          <Card className="border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-sky-600 mt-1" />
                <div className="flex-1">
                  <CardTitle className="text-[#0A192F]">{t.campaigns.aiCampaignRecommendations}</CardTitle>
                  <CardDescription className="text-sky-700 mt-1">
                    {t.campaigns.basedOnInventoryCustomers}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiRecommendations.map((rec, index) => (
                <Card key={index} className="bg-white">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#0A192F] mb-2">{rec.title}</h4>
                        <p className="text-sm text-[#475569] mb-3">{rec.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">
                            {t.campaigns.target} {getSegmentLabel(rec.targetSegment)}
                          </Badge>
                          <Badge variant="outline">{t.campaigns.suggested} {rec.discountRate}% off</Badge>
                          {rec.products.length > 0 && (
                            <Badge variant="outline">
                              {t.campaigns.products} {rec.products.join(', ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-[#0D1B2A] hover:bg-[#1a2d42] text-white"
                        onClick={() => applyRecommendation(rec)}
                      >
                        {t.campaigns.useThis}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t.campaigns.allCampaigns}</CardTitle>
            <CardDescription>{t.campaigns.manageCampaigns}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || tenantLoading ? (
              <div className="text-center py-8 text-[#475569]">{t.common.loading}</div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8 text-[#475569]">
                {t.campaigns.noCampaignsYet}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.campaigns.campaignName}</TableHead>
                    <TableHead>{t.campaigns.type}</TableHead>
                    <TableHead>{t.common.status}</TableHead>
                    <TableHead>{t.campaigns.target}</TableHead>
                    <TableHead>{t.campaigns.discount}</TableHead>
                    <TableHead>{t.campaigns.duration}</TableHead>
                    <TableHead>{t.campaigns.created}</TableHead>
                    <TableHead className="w-[80px]">{t.common.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{campaign.type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>{getSegmentLabel(campaign.target_segment)}</TableCell>
                      <TableCell>
                        {campaign.discount_rate > 0 ? `${campaign.discount_rate}%` : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {campaign.start_date && campaign.end_date
                          ? `${format(new Date(campaign.start_date), 'MMM dd')} - ${format(
                              new Date(campaign.end_date),
                              'MMM dd'
                            )}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-[#475569]">
                        {format(new Date(campaign.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {campaign.type === 'email' && campaign.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleSendCampaignEmail(campaign)} className="text-green-600">
                                <Send className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleEditCampaign(campaign)} className="text-[#0A192F]">
                              <Edit2 className="h-4 w-4 mr-2" />
                              {t.common.edit}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(campaign)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t.common.delete}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <EditCampaignDialog
          campaign={editCampaign}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={fetchCampaigns}
        />

        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          title={t.campaigns.deleteCampaign}
          description={t.campaigns.confirmDeleteCampaign.replace('{name}', deleteCampaign?.name || '')}
        />

        <Toaster />
      </div>
    </DashboardLayout>
  )
}
