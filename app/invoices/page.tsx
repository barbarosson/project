'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Loader2, Eye, MoreVertical, Edit, Trash2, Upload, AlertCircle, ShoppingCart, FileCheck2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Toaster } from '@/components/ui/sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditInvoiceDialog } from '@/components/edit-invoice-dialog'
import { BulkCreateInvoicesDialog } from '@/components/bulk-create-invoices-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { RecordPaymentDialog } from '@/components/record-payment-dialog'
import { toast } from 'sonner'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { DollarSign } from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  amount: number
  subtotal: number
  total_vat: number
  paid_amount: number
  remaining_amount: number
  status: string
  issue_date: string
  due_date: string
  created_at: string
  order_id?: string | null
  customers: {
    name: string
    company_title: string
  }
}

export default function InvoicesPage() {
  const router = useRouter()
  const { tenantId, loading: tenantLoading } = useTenant()
  const { language, t } = useLanguage()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showBulkCreateDialog, setShowBulkCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<any>(null)
  const [deletingInvoice, setDeletingInvoice] = useState<any>(null)
  const [payingInvoice, setPayingInvoice] = useState<any>(null)

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchInvoices()
    }
  }, [tenantId, tenantLoading])

  async function fetchInvoices() {
    if (!tenantId) return

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            name,
            company_title
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      const invoicesWithDefaults = data?.map(inv => {
        const paidAmount = inv.paid_amount || 0
        const totalAmount = inv.total || inv.amount || 0
        const remainingAmount = inv.status === 'paid' ? 0 : (inv.remaining_amount ?? (totalAmount - paidAmount))

        return {
          ...inv,
          paid_amount: paidAmount,
          remaining_amount: Math.max(0, remainingAmount)
        }
      })

      if (error) throw error

      setInvoices(invoicesWithDefaults || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-400 text-white',
      sent: 'bg-blue-500 text-white',
      paid: 'bg-[#2ECC71] text-white',
      overdue: 'bg-red-600 text-white',
      cancelled: 'bg-gray-500 text-white'
    }
    return colors[status] || 'bg-gray-400 text-white'
  }

  function handleRecordPayment(invoice: any) {
    setPayingInvoice(invoice)
    setShowPaymentDialog(true)
  }

  function handleEdit(invoice: any) {
    setEditingInvoice(invoice)
    setShowEditDialog(true)
  }

  function handleDelete(invoice: any) {
    setDeletingInvoice(invoice)
    setShowDeleteDialog(true)
  }

  async function confirmDelete() {
    if (!deletingInvoice || !tenantId) return

    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('balance')
        .eq('id', deletingInvoice.customer_id)
        .eq('tenant_id', tenantId)
        .single()

      if (customer) {
        await supabase
          .from('customers')
          .update({ balance: (customer.balance || 0) - deletingInvoice.amount })
          .eq('id', deletingInvoice.customer_id)
          .eq('tenant_id', tenantId)
      }

      const { data: lineItems } = await supabase
        .from('invoice_line_items')
        .select('product_id, quantity')
        .eq('invoice_id', deletingInvoice.id)
        .eq('tenant_id', tenantId)

      if (lineItems) {
        for (const item of lineItems) {
          const { data: inventory } = await supabase
            .from('inventory')
            .select('stock_quantity')
            .eq('product_id', item.product_id)
            .eq('tenant_id', tenantId)
            .single()

          if (inventory) {
            await supabase
              .from('inventory')
              .update({ stock_quantity: inventory.stock_quantity + item.quantity })
              .eq('product_id', item.product_id)
              .eq('tenant_id', tenantId)
          }
        }
      }

      await supabase.from('invoice_line_items').delete().eq('invoice_id', deletingInvoice.id).eq('tenant_id', tenantId)
      await supabase.from('stock_movements').delete().eq('reference_id', deletingInvoice.id).eq('tenant_id', tenantId)

      const { error } = await supabase.from('invoices').delete().eq('id', deletingInvoice.id).eq('tenant_id', tenantId)

      if (error) throw error

      toast.success(t.invoices.invoiceDeletedSuccess)
      fetchInvoices()
    } catch (error: any) {
      console.error('Error deleting invoice:', error)
      toast.error(error.message || t.invoices.failedToDeleteInvoice)
    } finally {
      setShowDeleteDialog(false)
      setDeletingInvoice(null)
    }
  }

  const filteredInvoices = statusFilter === 'all'
    ? invoices
    : invoices.filter(inv => inv.status === statusFilter)

  if (loading || tenantLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-500 mt-1">{t.invoices.manageInvoicesBilling}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowBulkCreateDialog(true)}
              variant="outline"
              className="text-[#0A192F]"
            >
              <Upload className="mr-2 h-4 w-4" />
              {t.invoices.bulkCreate}
            </Button>
            <Button
              onClick={() => router.push('/invoices/new')}
              className="bg-[#2ECC71] hover:bg-[#27AE60]"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.invoices.createNewInvoice}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                className={statusFilter === 'all' ? 'bg-[#0D1B2A]' : ''}
              >
                {t.common.all}
              </Button>
              <Button
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('draft')}
                className={statusFilter === 'draft' ? 'bg-[#0D1B2A]' : ''}
              >
                {t.common.draft}
              </Button>
              <Button
                variant={statusFilter === 'sent' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('sent')}
                className={statusFilter === 'sent' ? 'bg-[#0D1B2A]' : ''}
              >
                {t.common.sent}
              </Button>
              <Button
                variant={statusFilter === 'paid' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('paid')}
                className={statusFilter === 'paid' ? 'bg-[#0D1B2A]' : ''}
              >
                {t.common.paid}
              </Button>
              <Button
                variant={statusFilter === 'overdue' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('overdue')}
                className={statusFilter === 'overdue' ? 'bg-[#0D1B2A]' : ''}
              >
                {t.common.overdue}
              </Button>
              <Button
                variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('cancelled')}
                className={statusFilter === 'cancelled' ? 'bg-[#0D1B2A]' : ''}
              >
                {t.common.cancelled}
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">{t.invoices.invoiceNo}</TableHead>
                    <TableHead className="font-semibold">{t.invoices.customer}</TableHead>
                    <TableHead className="font-semibold">{t.invoices.issueDate}</TableHead>
                    <TableHead className="font-semibold">{t.invoices.dueDate}</TableHead>
                    <TableHead className="font-semibold text-right">{t.invoices.amount}</TableHead>
                    <TableHead className="font-semibold">{t.common.status}</TableHead>
                    <TableHead className="font-semibold">{language === 'tr' ? 'Baglanti' : 'Links'}</TableHead>
                    <TableHead className="font-semibold">{t.invoices.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                        {t.invoices.noInvoicesFound}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                          invoice.status === 'overdue' ? 'border-l-4 border-l-red-600 bg-red-50' : ''
                        }`}
                      >
                        <TableCell>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {invoice.status === 'overdue' && (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            {invoice.invoice_number}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">
                              {invoice.customers?.company_title || invoice.customers?.name || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-700">
                            {new Date(invoice.issue_date).toLocaleDateString('tr-TR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`text-sm flex items-center gap-2 ${
                            invoice.status === 'overdue' ? 'text-red-600 font-semibold' : 'text-gray-700'
                          }`}>
                            {invoice.status === 'overdue' && (
                              <AlertCircle className="h-4 w-4" />
                            )}
                            {new Date(invoice.due_date).toLocaleDateString('tr-TR')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-semibold text-gray-900">
                            ${Number(invoice.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          {invoice.paid_amount > 0 && invoice.status !== 'draft' && (
                            <div className="text-xs text-green-600">
                              {t.common.paid}: ${Number(invoice.paid_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          )}
                          {Number(invoice.remaining_amount || 0) > 0.01 && invoice.status !== 'paid' && (
                            <div className="text-xs text-red-600">
                              {t.invoices.remaining}: ${Number(invoice.remaining_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(invoice.status)}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {invoice.order_id && (
                              <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-700 border-teal-200 cursor-pointer"
                                onClick={() => router.push('/orders')}
                              >
                                <ShoppingCart className="h-2.5 w-2.5 mr-0.5" />
                                {language === 'tr' ? 'Siparis' : 'Order'}
                              </Badge>
                            )}
                            {invoice.status === 'paid' && (
                              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 cursor-pointer"
                                onClick={() => router.push('/edocuments')}
                              >
                                <FileCheck2 className="h-2.5 w-2.5 mr-0.5" />
                                {language === 'tr' ? 'E-Belge' : 'E-Doc'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                {t.invoices.view}
                              </DropdownMenuItem>
                              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && Number(invoice.remaining_amount || 0) > 0.01 && (
                                <DropdownMenuItem onClick={() => handleRecordPayment(invoice)} className="text-green-600">
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  {t.invoices.recordPayment}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleEdit(invoice)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t.invoices.edit}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(invoice)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t.invoices.delete}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <EditInvoiceDialog
        invoice={editingInvoice}
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false)
          setEditingInvoice(null)
        }}
        onSuccess={fetchInvoices}
      />

      <BulkCreateInvoicesDialog
        isOpen={showBulkCreateDialog}
        onClose={() => setShowBulkCreateDialog(false)}
        onSuccess={fetchInvoices}
      />

      {deletingInvoice && (
        <ConfirmDeleteDialog
          open={showDeleteDialog}
          onOpenChange={(open) => {
            setShowDeleteDialog(open)
            if (!open) setDeletingInvoice(null)
          }}
          onConfirm={confirmDelete}
          title={t.invoices.deleteInvoice}
          description={t.invoices.confirmDeleteInvoice.replace('{number}', deletingInvoice.invoice_number)}
        />
      )}

      {payingInvoice && (
        <RecordPaymentDialog
          open={showPaymentDialog}
          onOpenChange={(open) => {
            setShowPaymentDialog(open)
            if (!open) setPayingInvoice(null)
          }}
          type="invoice"
          referenceId={payingInvoice.id}
          customerId={payingInvoice.customer_id}
          totalAmount={payingInvoice.amount}
          paidAmount={payingInvoice.paid_amount || 0}
          currency="USD"
          onSuccess={() => {
            fetchInvoices()
            setPayingInvoice(null)
          }}
        />
      )}

      <Toaster />
    </DashboardLayout>
  )
}
