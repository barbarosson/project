'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Plus, Loader2, Eye, MoreVertical, Edit, Trash2, Upload, AlertCircle, ShoppingCart, FileCheck2, CheckSquare, Search } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { Toaster } from '@/components/ui/sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditInvoiceDialog } from '@/components/edit-invoice-dialog'
import { InvoiceCsvImportDialog } from '@/components/invoice-csv-import-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { RecordPaymentDialog } from '@/components/record-payment-dialog'
import { toast } from 'sonner'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/contexts/currency-context'
import { DollarSign } from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  amount: number
  total?: number
  subtotal: number
  total_vat: number
  paid_amount: number
  remaining_amount: number
  status: string
  invoice_type: string
  currency?: string
  issue_date: string
  due_date: string
  created_at: string
  order_id?: string | null
  customers: {
    name: string
    company_title: string
  }
}

const INVOICE_TYPE_LABELS: Record<string, Record<string, string>> = {
  sale: { tr: 'Satış', en: 'Sale' },
  sale_return: { tr: 'Satıştan İade', en: 'Sale Return' },
  devir: { tr: 'Devir', en: 'Carry Forward' },
  devir_return: { tr: 'Devir İade', en: 'Carry Fwd Return' },
}
const INVOICE_TYPE_COLORS: Record<string, string> = {
  sale: 'bg-emerald-100 text-emerald-800',
  sale_return: 'bg-orange-100 text-orange-800',
  devir: 'bg-violet-100 text-violet-800',
  devir_return: 'bg-pink-100 text-pink-800',
}

export default function InvoicesPage() {
  const router = useRouter()
  const { tenantId, loading: tenantLoading } = useTenant()
  const { language, t } = useLanguage()
  const { formatCurrency } = useCurrency()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showCsvImportDialog, setShowCsvImportDialog] = useState(false)
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
        const derivedRemaining = Math.max(0, totalAmount - paidAmount)
        const remainingAmount =
          inv.status === 'paid'
            ? 0
            : Math.max(derivedRemaining, inv.remaining_amount ?? derivedRemaining)

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
      paid: 'bg-[#00D4AA] text-white',
      overdue: 'bg-red-600 text-white',
      cancelled: 'bg-gray-500 text-white'
    }
    return colors[status] || 'bg-gray-400 text-white'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: t.common.draft,
      sent: t.common.sent,
      paid: t.common.paid,
      overdue: t.common.overdue,
      cancelled: t.common.cancelled,
      pending: t.common.pending,
    }

    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1)
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
    if (Number(invoice.paid_amount ?? 0) > 0.01) {
      toast.error(t.invoices.cannotDeleteInvoiceWithPayments)
      return
    }
    setDeletingInvoice(invoice)
    setShowDeleteDialog(true)
  }

  async function confirmDelete() {
    if (!deletingInvoice || !tenantId) return
    if (Number(deletingInvoice.paid_amount ?? 0) > 0.01) {
      toast.error(t.invoices.cannotDeleteInvoiceWithPayments)
      setShowDeleteDialog(false)
      setDeletingInvoice(null)
      return
    }

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

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false
    if (typeFilter !== 'all' && (inv.invoice_type || 'sale') !== typeFilter) return false

    const q = searchQuery.trim().toLowerCase()
    if (!q) return true

    const customerName = (inv.customers?.company_title || inv.customers?.name || '').toLowerCase()
    const invoiceNo = (inv.invoice_number || '').toLowerCase()
    const issueDateStr = inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('tr-TR') : ''
    const dueDateStr = inv.due_date ? new Date(inv.due_date).toLocaleDateString('tr-TR') : ''

    return (
      invoiceNo.includes(q) ||
      customerName.includes(q) ||
      issueDateStr.toLowerCase().includes(q) ||
      dueDateStr.toLowerCase().includes(q)
    )
  })

  const allVisibleSelected = filteredInvoices.length > 0 && filteredInvoices.every((inv) => selectedIds.has(inv.id))
  const someSelected = selectedIds.size > 0

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredInvoices.map((inv) => inv.id)))
    }
  }
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleBulkDelete() {
    if (!tenantId || selectedIds.size === 0) return
    const toDelete = filteredInvoices.filter((inv) => selectedIds.has(inv.id))
    const withPayments = toDelete.filter((inv) => Number(inv.paid_amount ?? 0) > 0.01)
    const withoutPayments = toDelete.filter((inv) => Number(inv.paid_amount ?? 0) <= 0.01)
    if (withPayments.length > 0 && withoutPayments.length === 0) {
      toast.error(t.invoices.cannotDeleteInvoiceWithPayments)
      return
    }
    if (withPayments.length > 0) {
      const ok = window.confirm(
        language === 'tr'
          ? `${withPayments.length} faturada ödeme kaydı var, silinemez. Sadece ${withoutPayments.length} fatura silinecek. Devam?`
          : `${withPayments.length} invoice(s) have payment(s) and cannot be deleted. Only ${withoutPayments.length} will be deleted. Continue?`
      )
      if (!ok) return
    } else {
      const confirmed = window.confirm(
        language === 'tr'
          ? `${withoutPayments.length} fatura silinecek. Emin misiniz?`
          : `Delete ${withoutPayments.length} invoice(s). Are you sure?`
      )
      if (!confirmed) return
    }
    try {
      let deleted = 0
      for (const inv of withoutPayments) {
        await supabase.from('invoice_line_items').delete().eq('invoice_id', inv.id).eq('tenant_id', tenantId)
        await supabase.from('invoices').delete().eq('id', inv.id).eq('tenant_id', tenantId)
        deleted++
      }
      if (deleted > 0) {
        toast.success(language === 'tr' ? `${deleted} fatura silindi` : `${deleted} invoice(s) deleted`)
      }
      if (withPayments.length > 0) {
        toast.info(language === 'tr' ? `${withPayments.length} fatura ödemesi olduğu için silinemedi` : `${withPayments.length} invoice(s) not deleted (have payments)`)
      }
      setSelectedIds(new Set())
      fetchInvoices()
    } catch (err: any) {
      toast.error(err.message || 'Hata')
    }
  }

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{language === 'tr' ? 'Satış Faturaları' : 'Invoices'}</h1>
            <p className="text-gray-500 mt-1">{t.invoices.manageInvoicesBilling}</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              onClick={() => setShowCsvImportDialog(true)}
              variant="outline"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-white hover:bg-gray-50 h-10 px-4 py-2 text-gray-900 hover:text-gray-900 shrink-0"
            >
              <Upload className="mr-2 h-4 w-4" />
              {language === 'tr' ? 'Toplu aktarım' : 'Bulk import'}
            </Button>
            <Button
              onClick={() => router.push('/invoices/new')}
              className="bg-[#00D4AA] hover:bg-[#00B894] text-contrast-body"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.invoices.createNewInvoice}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'tr' ? 'Fatura no, tarih veya müşteri ara' : 'Search by number, date or customer'}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setSelectedIds(new Set()) }}>
                <SelectTrigger className="w-[160px] h-9" data-field="invoices-status-filter">
                  <SelectValue placeholder={language === 'tr' ? 'Durum' : 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.common.all}</SelectItem>
                  <SelectItem value="draft">{t.common.draft}</SelectItem>
                  <SelectItem value="sent">{t.common.sent}</SelectItem>
                  <SelectItem value="paid">{t.common.paid}</SelectItem>
                  <SelectItem value="overdue">{t.common.overdue}</SelectItem>
                  <SelectItem value="cancelled">{t.common.cancelled}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setSelectedIds(new Set()) }}>
                <SelectTrigger className="w-[180px] h-9" data-field="invoices-type-filter">
                  <SelectValue placeholder={language === 'tr' ? 'Fatura Tipi' : 'Invoice Type'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'tr' ? 'Tüm Tipler' : 'All Types'}</SelectItem>
                  <SelectItem value="sale">{language === 'tr' ? 'Satış' : 'Sale'}</SelectItem>
                  <SelectItem value="sale_return">{language === 'tr' ? 'Satıştan İade' : 'Sale Return'}</SelectItem>
                  <SelectItem value="devir">{language === 'tr' ? 'Devir' : 'Carry Forward'}</SelectItem>
                  <SelectItem value="devir_return">{language === 'tr' ? 'Devir İade' : 'Carry Fwd Return'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Toplu işlem çubuğu */}
            {someSelected && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <CheckSquare className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {language === 'tr' ? `${selectedIds.size} fatura seçili` : `${selectedIds.size} invoice(s) selected`}
                </span>
                <Button size="sm" variant="destructive" className="text-[#0A2540]" onClick={handleBulkDelete}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  {language === 'tr' ? 'Seçilenleri Sil' : 'Delete Selected'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
                  {language === 'tr' ? 'Seçimi Temizle' : 'Clear Selection'}
                </Button>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="h-8 w-4 min-w-4 max-w-4 p-0.5 text-center align-middle">
                      <div className="inline-flex items-center justify-center w-4 h-6">
                        <Checkbox size="sm" checked={allVisibleSelected && filteredInvoices.length > 0} onCheckedChange={toggleSelectAll} aria-label="Select all" data-field="invoices-select-all" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">{t.invoices.invoiceNo}</TableHead>
                    <TableHead className="font-semibold">{language === 'tr' ? 'Tip' : 'Type'}</TableHead>
                    <TableHead className="font-semibold">{language === 'tr' ? 'Para Birimi' : 'Currency'}</TableHead>
                    <TableHead className="font-semibold">{t.invoices.customer}</TableHead>
                    <TableHead className="font-semibold">{t.invoices.issueDate}</TableHead>
                    <TableHead className="font-semibold">{t.invoices.dueDate}</TableHead>
                    <TableHead className="font-semibold text-right">{t.invoices.amount}</TableHead>
                    <TableHead className="font-semibold">{t.common.status}</TableHead>
                    <TableHead className="font-semibold">{language === 'tr' ? 'Bağlantı' : 'Links'}</TableHead>
                    <TableHead className="font-semibold">{t.invoices.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-12 text-gray-500">
                        {t.invoices.noInvoicesFound}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                          invoice.status === 'overdue' ? 'border-l-4 border-l-red-600 bg-red-50' : ''
                        } ${selectedIds.has(invoice.id) ? 'bg-blue-50' : ''}`}
                      >
                        <TableCell className="w-4 min-w-4 max-w-4 p-0.5 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center justify-center w-4 h-6">
                            <Checkbox size="sm" checked={selectedIds.has(invoice.id)} onCheckedChange={() => toggleSelect(invoice.id)} aria-label="Select" data-field="invoices-row-select" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {invoice.status === 'overdue' && (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            {invoice.invoice_number}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={INVOICE_TYPE_COLORS[invoice.invoice_type || 'sale'] || 'bg-gray-100 text-gray-800'} variant="secondary">
                            {INVOICE_TYPE_LABELS[invoice.invoice_type || 'sale']?.[language] || (invoice.invoice_type || 'sale')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-gray-700">{invoice.currency || 'TRY'}</span>
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
                            {formatCurrency(Number(invoice.total ?? invoice.amount ?? 0), invoice.currency || 'TRY')}
                          </div>
                          {invoice.paid_amount > 0 && invoice.status !== 'draft' && (
                            <div className="text-xs text-green-600">
                              {t.common.paid}: {formatCurrency(Number(invoice.paid_amount), invoice.currency || 'TRY')}
                            </div>
                          )}
                          {Number(invoice.remaining_amount || 0) > 0.01 && invoice.status !== 'paid' && (
                            <div className="text-xs text-red-600">
                              {t.invoices.remaining}: {formatCurrency(Number(invoice.remaining_amount), invoice.currency || 'TRY')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusBadge(invoice.status)} ${invoice.status === 'paid' ? 'cursor-pointer hover:opacity-90' : ''}`}
                            onClick={invoice.status === 'paid' ? () => router.push(`/finance/transactions?reference_type=invoice&reference_id=${invoice.id}`) : undefined}
                          >
                            {getStatusLabel(invoice.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1">
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
                          <div className="flex items-center gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-800"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t.invoices.view}
                                </DropdownMenuItem>
                                {invoice.status !== 'paid' &&
                                  invoice.status !== 'cancelled' &&
                                  invoice.status !== 'draft' &&
                                  Number(invoice.remaining_amount ?? 0) > 0.01 && (
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
                                  disabled={Number(invoice.paid_amount ?? 0) > 0.01}
                                  title={Number(invoice.paid_amount ?? 0) > 0.01 ? t.invoices.cannotDeleteInvoiceWithPayments : undefined}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t.invoices.delete}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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

      <InvoiceCsvImportDialog
        isOpen={showCsvImportDialog}
        onClose={() => setShowCsvImportDialog(false)}
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
          totalAmount={Number(payingInvoice.total ?? payingInvoice.amount ?? 0)}
          paidAmount={Number(payingInvoice.paid_amount ?? 0)}
          currency={payingInvoice.currency || 'TRY'}
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
