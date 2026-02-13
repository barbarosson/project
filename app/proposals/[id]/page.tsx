'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ArrowLeft, FileText, CheckCircle, Send, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { useTenant } from '@/contexts/tenant-context'

interface ProposalLineItem {
  id: string
  product_name: string
  description: string
  quantity: number
  unit_price: number
  discount_percent: number
  vat_rate: number
  line_total: number
  vat_amount: number
  total_with_vat: number
  product_id: string | null
}

interface Proposal {
  id: string
  proposal_number: string
  customer_id: string
  title: string
  description: string
  status: string
  valid_until: string
  subtotal: number
  vat_total: number
  total: number
  notes: string
  terms: string
  created_at: string
  sent_at: string | null
  responded_at: string | null
  converted_invoice_id: string | null
  customers: {
    name: string
    company_title: string
    tax_number: string
    address: string
    email: string
  }
}

export default function ProposalDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { tenantId, loading: tenantLoading } = useTenant()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [lineItems, setLineItems] = useState<ProposalLineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState(false)

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchProposal()
    }
  }, [tenantId, tenantLoading, params.id])

  async function fetchProposal() {
    if (!tenantId) return

    try {
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .select(`
          *,
          customers (
            name,
            company_title,
            tax_number,
            address,
            email
          )
        `)
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single()

      if (proposalError) throw proposalError

      const { data: itemsData, error: itemsError } = await supabase
        .from('proposal_line_items')
        .select('*')
        .eq('proposal_id', params.id)
        .eq('tenant_id', tenantId)

      if (itemsError) throw itemsError

      setProposal(proposalData)
      setLineItems(itemsData || [])
    } catch (error) {
      console.error('Error fetching proposal:', error)
      toast.error('Failed to load proposal')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!tenantId) return

    try {
      const updateData: any = { status: newStatus }

      if (newStatus === 'sent' && !proposal?.sent_at) {
        updateData.sent_at = new Date().toISOString()
      }

      if ((newStatus === 'accepted' || newStatus === 'rejected') && !proposal?.responded_at) {
        updateData.responded_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('proposals')
        .update(updateData)
        .eq('id', params.id)
        .eq('tenant_id', tenantId)

      if (error) throw error

      toast.success('Proposal status updated')
      fetchProposal()
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error(error.message || 'Failed to update status')
    }
  }

  async function handleConvertToInvoice() {
    if (!proposal || proposal.converted_invoice_id || !tenantId) return

    setConverting(true)

    try {
      const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      let nextNumber = 1
      if (lastInvoice?.invoice_number) {
        const lastNumber = parseInt(lastInvoice.invoice_number.split('-')[2])
        nextNumber = lastNumber + 1
      }

      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          tenant_id: tenantId,
          invoice_number: invoiceNumber,
          customer_id: proposal.customer_id,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'draft',
          subtotal: proposal.subtotal,
          vat_total: proposal.vat_total,
          total: proposal.total,
          notes: `Converted from Proposal ${proposal.proposal_number}\n\n${proposal.notes || ''}`
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      const invoiceLineItems = lineItems.map(item => ({
        tenant_id: tenantId,
        invoice_id: invoice.id,
        product_name: item.product_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        line_total: item.line_total,
        vat_amount: item.vat_amount,
        total_with_vat: item.total_with_vat,
        product_id: item.product_id
      }))

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(invoiceLineItems)

      if (lineItemsError) throw lineItemsError

      for (const item of lineItems) {
        if (item.product_id) {
          const { data: product } = await supabase
            .from('products')
            .select('current_stock, critical_level, total_sold')
            .eq('id', item.product_id)
            .eq('tenant_id', tenantId)
            .maybeSingle()

          if (product) {
            const newStock = Number(product.current_stock) - item.quantity
            const newTotalSold = Number(product.total_sold || 0) + item.quantity

            let stockStatus = 'in_stock'
            if (newStock === 0) {
              stockStatus = 'out_of_stock'
            } else if (newStock <= Number(product.critical_level)) {
              stockStatus = 'low_stock'
            }

            await supabase
              .from('products')
              .update({
                current_stock: newStock,
                total_sold: newTotalSold,
                stock_status: stockStatus
              })
              .eq('id', item.product_id)
              .eq('tenant_id', tenantId)

            await supabase
              .from('stock_movements')
              .insert({
                tenant_id: tenantId,
                product_id: item.product_id,
                movement_type: 'out',
                quantity: item.quantity,
                reason: `Invoice ${invoiceNumber} (from Proposal ${proposal.proposal_number})`,
                reference_id: invoice.id,
                reference_type: 'invoice'
              })
          }
        }
      }

      const { error: updateError } = await supabase
        .from('proposals')
        .update({
          converted_invoice_id: invoice.id,
          status: 'accepted'
        })
        .eq('id', params.id)
        .eq('tenant_id', tenantId)

      if (updateError) throw updateError

      toast.success('Successfully converted to invoice!')
      router.push(`/invoices/${invoice.id}`)
    } catch (error: any) {
      console.error('Error converting to invoice:', error)
      toast.error(error.message || 'Failed to convert to invoice')
    } finally {
      setConverting(false)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>
      case 'sent':
        return <Badge className="bg-blue-500">Sent</Badge>
      case 'accepted':
        return <Badge className="bg-green-500">Accepted</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  if (loading || tenantLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading proposal...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!proposal) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Proposal not found</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/proposals')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#0A192F]">
                {proposal.proposal_number}
              </h1>
              <p className="text-muted-foreground mt-1">{proposal.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(proposal.status)}
            {proposal.status === 'accepted' && !proposal.converted_invoice_id && (
              <Button
                className="bg-[#0A2540] hover:bg-[#1e3a5f] text-white"
                onClick={handleConvertToInvoice}
                disabled={converting}
              >
                <FileText className="h-4 w-4 mr-2" />
                {converting ? 'Converting...' : 'Convert to Invoice'}
              </Button>
            )}
            {proposal.converted_invoice_id && (
              <Button
                variant="outline"
                onClick={() => router.push(`/invoices/${proposal.converted_invoice_id}`)}
              >
                View Invoice
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Select value={proposal.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Customer Name</div>
                <div className="font-medium">{proposal.customers.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Company</div>
                <div className="font-medium">{proposal.customers.company_title}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tax Number</div>
                <div className="font-medium">{proposal.customers.tax_number}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Address</div>
                <div className="font-medium">{proposal.customers.address}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{proposal.customers.email}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proposal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Valid Until</div>
                <div className="font-medium">
                  {proposal.valid_until
                    ? format(new Date(proposal.valid_until), 'MMMM dd, yyyy')
                    : '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Created On</div>
                <div className="font-medium">
                  {format(new Date(proposal.created_at), 'MMMM dd, yyyy')}
                </div>
              </div>
              {proposal.sent_at && (
                <div>
                  <div className="text-sm text-muted-foreground">Sent On</div>
                  <div className="font-medium">
                    {format(new Date(proposal.sent_at), 'MMMM dd, yyyy')}
                  </div>
                </div>
              )}
              {proposal.responded_at && (
                <div>
                  <div className="text-sm text-muted-foreground">Responded On</div>
                  <div className="font-medium">
                    {format(new Date(proposal.responded_at), 'MMMM dd, yyyy')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {proposal.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{proposal.description}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product/Service</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">VAT</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs">
                      {item.description}
                    </TableCell>
                    <TableCell className="text-right">{Number(item.quantity).toFixed(0)}</TableCell>
                    <TableCell className="text-right">
                      ${Number(item.unit_price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(item.discount_percent).toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-right">
                      ${Number(item.vat_amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Number(item.total_with_vat).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-6 space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">${Number(proposal.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT:</span>
                <span className="font-medium">${Number(proposal.vat_total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-purple-600">${Number(proposal.total).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {proposal.terms && (
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {proposal.terms}
              </p>
            </CardContent>
          </Card>
        )}

        {proposal.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {proposal.notes}
              </p>
            </CardContent>
          </Card>
        )}

        <Toaster />
      </div>
    </DashboardLayout>
  )
}
