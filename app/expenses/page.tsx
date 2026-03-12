'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, FileText, CheckCircle2, XCircle, Eye, Trash2, Pencil, Upload, MoreVertical } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useCurrency } from '@/contexts/currency-context'
import { useLanguage } from '@/contexts/language-context'
import { convertAmount, type TcmbRatesByCurrency } from '@/lib/tcmb'
import { toast } from 'sonner'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { ExpenseExcelImportDialog } from '@/components/expense-excel-import-dialog'
import { format, subDays } from 'date-fns'

interface PurchaseInvoice {
  id: string
  supplier_id: string
  invoice_number: string
  invoice_date: string
  due_date: string | null
  total_amount: number
  status: 'pending' | 'accepted' | 'rejected'
  invoice_type: string
  rejection_reason: string | null
  supplier: {
    company_title: string
    name: string
  } | null
  supplier_display_name?: string | null
}

const PURCHASE_TYPE_LABELS: Record<string, Record<string, string>> = {
  purchase: { tr: 'Alış', en: 'Purchase' },
  purchase_return: { tr: 'Alıştan İade', en: 'Purchase Return' },
  devir: { tr: 'Devir', en: 'Carry Forward' },
  devir_return: { tr: 'Devir İade', en: 'Carry Fwd Return' },
  fatura_olustur: { tr: 'Fatura Oluştur', en: 'Create Invoice' },
  konaklama_ver_faturasi: { tr: 'Konaklama Ver. Faturası Oluştur', en: 'Create Accommodation Tax Invoice' },
  maas_odemesi: { tr: 'Maaş Ödemesi Oluştur', en: 'Create Salary Payment' },
  vergi_odemesi: { tr: 'Vergi Ödemesi Oluştur', en: 'Create Tax Payment' },
  diger: { tr: 'Diğer', en: 'Other' },
  fis: { tr: 'Fiş', en: 'Receipt' },
}
const PURCHASE_TYPE_COLORS: Record<string, string> = {
  purchase: 'bg-emerald-100 text-emerald-800',
  purchase_return: 'bg-orange-100 text-orange-800',
  devir: 'bg-violet-100 text-violet-800',
  devir_return: 'bg-pink-100 text-pink-800',
  fatura_olustur: 'bg-blue-100 text-blue-800',
  konaklama_ver_faturasi: 'bg-amber-100 text-amber-800',
  maas_odemesi: 'bg-teal-100 text-teal-800',
  vergi_odemesi: 'bg-rose-100 text-rose-800',
  diger: 'bg-gray-100 text-gray-800',
  fis: 'bg-sky-100 text-sky-800',
}

export default function ExpensesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const purchaseFromUrl = searchParams.get('purchase_invoice_id')
  const { tenantId, loading: tenantLoading } = useTenant()
  const { formatCurrency, currency: preferredCurrency, defaultRateType } = useCurrency()
  const { t, language } = useLanguage()
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([])
  const [tcmbRatesByDate, setTcmbRatesByDate] = useState<Record<string, TcmbRatesByCurrency>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState<string>('all')
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState<string>('all')
  const [purchaseDateFrom, setPurchaseDateFrom] = useState<string>('')
  const [purchaseDateTo, setPurchaseDateTo] = useState<string>('')
  const [isExpenseImportDialogOpen, setIsExpenseImportDialogOpen] = useState(false)
  const [selectedPurchaseIds, setSelectedPurchaseIds] = useState<Set<string>>(new Set())
  const [isBulkDeletePurchaseDialogOpen, setIsBulkDeletePurchaseDialogOpen] = useState(false)
  const [isDeletePurchaseDialogOpen, setIsDeletePurchaseDialogOpen] = useState(false)
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null)

  const targetCurrency = (preferredCurrency || 'TRY').toUpperCase()

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchData()
    }
  }, [tenantId, tenantLoading])

  // When navigated from E-Invoice Center with a specific purchase invoice id,
  // go to the incoming invoice detail page.
  useEffect(() => {
    if (!purchaseFromUrl || !purchaseInvoices.length) return
    const inv = purchaseInvoices.find((i) => i.id === purchaseFromUrl)
    if (!inv) return
    router.replace(`/expenses/incoming/${purchaseFromUrl}`)
  }, [purchaseFromUrl, purchaseInvoices, router])

  async function fetchTcmbRatesForDates(dates: string[]): Promise<Record<string, TcmbRatesByCurrency>> {
    const fallbackDate = format(new Date(), 'yyyy-MM-dd')
    const ratesByDate: Record<string, TcmbRatesByCurrency> = {}
    for (let d = 0; d <= 3; d++) {
      const tryDate = d === 0 ? fallbackDate : format(subDays(new Date(), d), 'yyyy-MM-dd')
      try {
        const res = await fetch(`/api/tcmb?date=${tryDate}`)
        if (res.ok) {
          const data = await res.json()
          if (data && Object.keys(data).length > 0) {
            ratesByDate[fallbackDate] = data
            break
          }
        }
      } catch (_) {}
    }
    for (const dateStr of dates) {
      if (ratesByDate[dateStr]) continue
      for (let d = 0; d <= 5; d++) {
        const tryDate = d === 0 ? dateStr : format(subDays(new Date(dateStr), d), 'yyyy-MM-dd')
        try {
          const res = await fetch(`/api/tcmb?date=${tryDate}`)
          if (res.ok) {
            const data = await res.json()
            if (data && Object.keys(data).length > 0) {
              ratesByDate[dateStr] = data
              break
            }
          }
        } catch (_) {}
      }
      if (!ratesByDate[dateStr] && ratesByDate[fallbackDate]) ratesByDate[dateStr] = ratesByDate[fallbackDate]
    }
    return ratesByDate
  }

  function getRatesForDate(dateStr: string | null): TcmbRatesByCurrency | null {
    if (!dateStr) return null
    return tcmbRatesByDate[dateStr] ?? tcmbRatesByDate[format(new Date(), 'yyyy-MM-dd')] ?? null
  }

  function convertToPreferred(amount: number, fromCurrency: string, dateStr: string | null): number {
    const c = (fromCurrency || 'TRY').toUpperCase()
    if (c === targetCurrency) return amount
    const rates = getRatesForDate(dateStr)
    if (rates) {
      const converted = convertAmount(amount, c, targetCurrency, rates, defaultRateType)
      if (converted != null) return converted
    }
    return amount
  }

  /** Tercih edilen para biriminden farklıysa orijinal + çevrilmiş tutarı döndürür. */
  function renderAmountWithConversion(
    amount: number,
    fromCurrency: string,
    dateStr: string | null
  ): ReactNode {
    const from = (fromCurrency || 'TRY').toUpperCase()
    const originalFormatted = formatCurrency(amount, from)
    if (from === targetCurrency) return originalFormatted
    const converted = convertToPreferred(amount, from, dateStr)
    return (
      <span className="inline-flex flex-col items-start">
        <span>{originalFormatted}</span>
        <span className="text-muted-foreground text-xs font-normal">≈ {formatCurrency(converted, targetCurrency)}</span>
      </span>
    )
  }

  async function fetchData() {
    if (!tenantId) return

    setLoading(true)
    try {
      await fetchPurchaseInvoices()
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (purchaseInvoices.length === 0) return
    const uniqueDates = Array.from(new Set(
      purchaseInvoices.map(inv => inv.invoice_date ? format(new Date(inv.invoice_date), 'yyyy-MM-dd') : null).filter(Boolean)
    )) as string[]
    fetchTcmbRatesForDates(uniqueDates).then(setTcmbRatesByDate)
  }, [purchaseInvoices.length])

  async function fetchPurchaseInvoices() {
    if (!tenantId) return

    const { data, error } = await supabase
      .from('purchase_invoices')
      .select('*, supplier:customers(company_title, name)')
      .eq('tenant_id', tenantId)
      .order('invoice_date', { ascending: false })

    if (error) {
      console.error('Error fetching purchase invoices:', error)
      return
    }

    setPurchaseInvoices(data || [])
  }

  const filteredInvoices = purchaseInvoices.filter((invoice) => {
    if (purchaseStatusFilter !== 'all' && invoice.status !== purchaseStatusFilter) return false
    if (purchaseTypeFilter !== 'all' && (invoice.invoice_type || 'purchase') !== purchaseTypeFilter) return false
    if (purchaseDateFrom || purchaseDateTo) {
      const d = invoice.invoice_date ? new Date(invoice.invoice_date).toISOString().slice(0, 10) : ''
      if (purchaseDateFrom && d < purchaseDateFrom) return false
      if (purchaseDateTo && d > purchaseDateTo) return false
    }
    const q = searchQuery.toLowerCase()
    if (q && !(
      invoice.invoice_number.toLowerCase().includes(q) ||
      invoice.supplier?.company_title?.toLowerCase().includes(q) ||
      invoice.supplier?.name?.toLowerCase().includes(q)
    )) return false
    return true
  })

  function toggleSelectAllPurchase() {
    if (selectedPurchaseIds.size === filteredInvoices.length) {
      setSelectedPurchaseIds(new Set())
    } else {
      setSelectedPurchaseIds(new Set(filteredInvoices.map(inv => inv.id)))
    }
  }

  function toggleSelectPurchase(id: string) {
    const next = new Set(selectedPurchaseIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedPurchaseIds(next)
  }

  async function handleDeletePurchaseInvoice(invoiceId: string) {
    if (!tenantId) return
    const inv = purchaseInvoices.find(i => i.id === invoiceId)
    if (!inv) return
    try {
      if (inv.status === 'accepted' && inv.supplier_id && Number(inv.total_amount) > 0) {
        const { data: supplier } = await supabase.from('customers').select('balance').eq('id', inv.supplier_id).eq('tenant_id', tenantId).single()
        if (supplier) {
          await supabase.from('customers').update({ balance: Number(supplier.balance ?? 0) + Number(inv.total_amount) }).eq('id', inv.supplier_id).eq('tenant_id', tenantId)
        }
      }
      await supabase.from('purchase_invoice_line_items').delete().eq('purchase_invoice_id', invoiceId).eq('tenant_id', tenantId)
      const { error } = await supabase.from('purchase_invoices').delete().eq('id', invoiceId).eq('tenant_id', tenantId)
      if (error) throw error
      toast.success(language === 'tr' ? 'Alış faturası silindi.' : 'Purchase invoice deleted.')
      fetchData()
    } catch (error: any) {
      toast.error(error.message || (language === 'tr' ? 'Silme hatası.' : 'Delete failed.'))
    } finally {
      setIsDeletePurchaseDialogOpen(false)
      setPurchaseToDelete(null)
    }
  }

  async function handleBulkDeletePurchase() {
    if (!tenantId || selectedPurchaseIds.size === 0) return
    try {
      for (const id of selectedPurchaseIds) {
        const inv = purchaseInvoices.find(i => i.id === id)
        if (!inv) continue
        if (inv.status === 'accepted' && inv.supplier_id && Number(inv.total_amount) > 0) {
          const { data: supplier } = await supabase.from('customers').select('balance').eq('id', inv.supplier_id).eq('tenant_id', tenantId).single()
          if (supplier) {
            await supabase.from('customers').update({ balance: Number(supplier.balance ?? 0) + Number(inv.total_amount) }).eq('id', inv.supplier_id).eq('tenant_id', tenantId)
          }
        }
        await supabase.from('purchase_invoice_line_items').delete().eq('purchase_invoice_id', id).eq('tenant_id', tenantId)
        const { error } = await supabase.from('purchase_invoices').delete().eq('id', id).eq('tenant_id', tenantId)
        if (error) throw error
      }
      toast.success(language === 'tr' ? 'Alış faturaları silindi.' : 'Purchase invoices deleted.')
      setSelectedPurchaseIds(new Set())
      fetchData()
    } catch (error: any) {
      toast.error(error.message || (language === 'tr' ? 'Toplu silme hatası.' : 'Bulk delete failed.'))
    } finally {
      setIsBulkDeletePurchaseDialogOpen(false)
    }
  }

  async function handleAcceptInvoice(invoiceId: string) {
    if (!tenantId) return

    try {
      const invoice = purchaseInvoices.find(inv => inv.id === invoiceId)
      if (!invoice) return

      const { data: lineItems } = await supabase
        .from('purchase_invoice_line_items')
        .select('*')
        .eq('purchase_invoice_id', invoiceId)
        .eq('tenant_id', tenantId)

      const { error: updateError } = await supabase
        .from('purchase_invoices')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .eq('tenant_id', tenantId)

      if (updateError) throw updateError

      if (invoice.supplier_id && Number(invoice.total_amount) > 0) {
        const { data: supplier } = await supabase.from('customers').select('balance').eq('id', invoice.supplier_id).eq('tenant_id', tenantId).single()
        if (supplier) {
          await supabase.from('customers').update({ balance: Number(supplier.balance ?? 0) - Number(invoice.total_amount) }).eq('id', invoice.supplier_id).eq('tenant_id', tenantId)
        }
      }

      const supplierLabel = invoice.supplier_id
        ? (invoice.supplier?.company_title || invoice.supplier?.name)
        : (invoice.supplier_display_name || invoice.invoice_number)
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert({
          tenant_id: tenantId,
          category: 'general',
          description: `Purchase Invoice ${invoice.invoice_number} from ${supplierLabel}`,
          amount: invoice.total_amount,
          expense_date: invoice.invoice_date,
          payment_method: 'bank_transfer',
          notes: `Accepted purchase invoice`
        })

      if (expenseError) throw expenseError

      let stockUpdatedCount = 0
      if (lineItems && lineItems.length > 0) {
        let productsByName: { id: string; name: string }[] | null = null
        const resolveProductId = async (item: (typeof lineItems)[0]): Promise<string | null> => {
          if (item.product_id) return item.product_id
          const desc = (item.description && typeof item.description === 'string') ? item.description.trim() : ''
          if (!desc) return null
          if (!productsByName) {
            const { data: list } = await supabase.from('products').select('id, name').eq('tenant_id', tenantId).eq('status', 'active')
            productsByName = (list || []).map((p: { id: string; name: string }) => ({ id: p.id, name: (p.name || '').trim().toLowerCase() }))
          }
          const descLower = desc.toLowerCase()
          const products = productsByName ?? []
          const exact = products.filter((p) => p.name === descLower)
          if (exact.length === 1) return exact[0].id
          const partial = products.filter((p) => p.name && descLower.includes(p.name))
          return partial.length === 1 ? partial[0].id : null
        }
        for (const item of lineItems) {
          let productId = item.product_id
          if (!productId) {
            productId = await resolveProductId(item)
            if (productId && item.id) {
              await supabase.from('purchase_invoice_line_items').update({ product_id: productId }).eq('id', item.id).eq('tenant_id', tenantId)
            }
          }
          if (productId) {
            const { data: product } = await supabase
              .from('products')
              .select('current_stock, stock_quantity, purchase_price')
              .eq('id', productId)
              .eq('tenant_id', tenantId)
              .single()

            if (product) {
              const newStock = Number(product.current_stock ?? product.stock_quantity ?? 0) + Number(item.quantity)
              const updateData: Record<string, unknown> = {
                current_stock: newStock,
                stock_quantity: newStock
              }

              if (item.unit_price && Number(item.unit_price) > 0) {
                updateData.purchase_price = Number(item.unit_price)
              }

              const { error: updateErr } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', productId)
                .eq('tenant_id', tenantId)

              if (!updateErr) {
                stockUpdatedCount += 1
                await supabase
                  .from('stock_movements')
                  .insert({
                    tenant_id: tenantId,
                    product_id: productId,
                    movement_type: 'in',
                    quantity: item.quantity,
                    unit_cost: item.unit_price ? Number(item.unit_price) : 0,
                    reason: `Purchase invoice ${invoice.invoice_number}`,
                    reference_type: 'purchase_invoice',
                    reference_id: invoiceId,
                    notes: item.unit_price ? `Unit price: ${Number(item.unit_price).toFixed(2)}` : undefined
                  })
              }
            }
          }
        }
      }
      if (lineItems?.length && stockUpdatedCount === 0) {
        toast.warning(t.expenses.stockNoProductMatchWarning)
      }

      toast.success(t.expenses.invoiceAcceptedSuccess)
      fetchData()
    } catch (error: any) {
      console.error('Error accepting invoice:', error)
      toast.error(error.message || t.expenses.acceptInvoiceError)
    }
  }

  async function handleRejectInvoice(invoiceId: string) {
    if (!tenantId) return

    const reason = prompt(t.expenses.rejectionReasonPrompt)
    if (!reason) return

    try {
      const { data: inv } = await supabase.from('purchase_invoices').select('supplier_id, total_amount, status').eq('id', invoiceId).eq('tenant_id', tenantId).single()
      if (inv?.status === 'accepted' && inv.supplier_id && Number(inv.total_amount) > 0) {
        const { data: supplier } = await supabase.from('customers').select('balance').eq('id', inv.supplier_id).eq('tenant_id', tenantId).single()
        if (supplier) {
          await supabase.from('customers').update({ balance: Number(supplier.balance ?? 0) + Number(inv.total_amount) }).eq('id', inv.supplier_id).eq('tenant_id', tenantId)
        }
      }

      const { error } = await supabase
        .from('purchase_invoices')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .eq('tenant_id', tenantId)

      if (error) throw error

      toast.success(t.expenses.invoiceRejectedSuccess)
      fetchPurchaseInvoices()
    } catch (error: any) {
      console.error('Error rejecting invoice:', error)
      toast.error(error.message || t.expenses.rejectInvoiceError)
    }
  }

  const totalAcceptedInvoices = purchaseInvoices
    .filter(inv => inv.status === 'accepted')
    .reduce(
      (sum, inv) =>
        sum +
        convertToPreferred(
          Number(inv.total_amount),
          'TRY',
          inv.invoice_date ? format(new Date(inv.invoice_date), 'yyyy-MM-dd') : null
        ),
      0
    )
  const totalExpenses = totalAcceptedInvoices
  const pendingInvoicesCount = purchaseInvoices.filter(inv => inv.status === 'pending').length

  if (loading || tenantLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-gray-500">{t.common.loading}</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.expenses.title}</h1>
            <p className="text-gray-500 mt-1">{t.expenses.subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">{t.expenses.acceptedPurchases}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalAcceptedInvoices, targetCurrency)}</div>
              <p className="text-xs text-gray-500 mt-1">
                {purchaseInvoices.filter(inv => inv.status === 'accepted').length} {t.expenses.invoiceCountLabel}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">{t.expenses.totalExpensesCard}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalExpenses, targetCurrency)}</div>
              <p className="text-xs text-gray-500 mt-1">{t.expenses.allExpensesCombined}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">{t.expenses.pendingInvoicesCard}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInvoicesCount}</div>
              <p className="text-xs text-gray-500 mt-1">{t.expenses.awaitingApproval}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between min-w-0">
              <div className="flex items-center gap-2">
                <FileText size={16} />
                <span>{t.expenses.incomingInvoices}</span>
                {pendingInvoicesCount > 0 && (
                  <Badge variant="destructive" className="ml-1">{pendingInvoicesCount}</Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial sm:justify-end">
                <div className="relative min-w-0 flex-1 sm:flex-initial" style={{ maxWidth: '100%' }}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 shrink-0" size={16} />
                  <Input
                    placeholder={t.common.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full min-w-0 sm:w-52 md:w-64 max-w-full"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsExpenseImportDialogOpen(true)}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-white hover:bg-gray-50 h-10 px-4 py-2 text-contrast-body shrink-0"
                  >
                    <Upload size={16} className="mr-2" />
                    {t.expenses.bulkImport}
                  </Button>
                  <Button
                    onClick={() => router.push('/expenses/incoming/new')}
                    className="shrink-0 bg-[#00D4AA] hover:bg-[#00B894] font-semibold text-contrast-body"
                  >
                    <Plus size={16} className="mr-2" />
                    {t.expenses.addIncomingInvoice}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Select value={purchaseStatusFilter} onValueChange={setPurchaseStatusFilter}>
                    <SelectTrigger className="w-[160px] h-9">
                      <SelectValue placeholder={t.expenses.status} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.expenses.filterAllStatuses}</SelectItem>
                      <SelectItem value="pending">{t.expenses.pending}</SelectItem>
                      <SelectItem value="accepted">{t.expenses.accepted}</SelectItem>
                      <SelectItem value="rejected">{t.expenses.rejected}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={purchaseTypeFilter} onValueChange={setPurchaseTypeFilter}>
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder={t.expenses.invoiceTypeColumn} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.expenses.filterAllTypes}</SelectItem>
                      <SelectItem value="purchase">{PURCHASE_TYPE_LABELS.purchase[language]}</SelectItem>
                      <SelectItem value="purchase_return">{PURCHASE_TYPE_LABELS.purchase_return[language]}</SelectItem>
                      <SelectItem value="devir">{PURCHASE_TYPE_LABELS.devir[language]}</SelectItem>
                      <SelectItem value="devir_return">{PURCHASE_TYPE_LABELS.devir_return[language]}</SelectItem>
                      <SelectItem value="fatura_olustur">{PURCHASE_TYPE_LABELS.fatura_olustur[language]}</SelectItem>
                      <SelectItem value="konaklama_ver_faturasi">{PURCHASE_TYPE_LABELS.konaklama_ver_faturasi[language]}</SelectItem>
                      <SelectItem value="maas_odemesi">{PURCHASE_TYPE_LABELS.maas_odemesi[language]}</SelectItem>
                      <SelectItem value="vergi_odemesi">{PURCHASE_TYPE_LABELS.vergi_odemesi[language]}</SelectItem>
                      <SelectItem value="diger">{PURCHASE_TYPE_LABELS.diger[language]}</SelectItem>
                      <SelectItem value="fis">{PURCHASE_TYPE_LABELS.fis[language]}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={purchaseDateFrom}
                    onChange={(e) => setPurchaseDateFrom(e.target.value)}
                    className="w-[150px] h-9"
                    aria-label={language === 'tr' ? 'Başlangıç tarihi' : 'Start date'}
                  />
                  <span className="text-gray-400 text-sm">–</span>
                  <Input
                    type="date"
                    value={purchaseDateTo}
                    onChange={(e) => setPurchaseDateTo(e.target.value)}
                    className="w-[150px] h-9"
                    aria-label={language === 'tr' ? 'Bitiş tarihi' : 'End date'}
                  />
                </div>
                {selectedPurchaseIds.size > 0 && (
                  <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-lg bg-blue-50 border border-blue-200">
                    <span className="text-sm font-medium text-blue-800">
                      {selectedPurchaseIds.size} {t.common.selected}
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-[var(--color-info)] bg-white hover:bg-gray-100"
                      onClick={() => setIsBulkDeletePurchaseDialogOpen(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      {t.common.bulkDelete}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedPurchaseIds(new Set())}>
                      {language === 'tr' ? 'Seçimi temizle' : 'Clear selection'}
                    </Button>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="h-8 w-4 min-w-4 max-w-4 p-0.5 text-center align-middle">
                        <div className="inline-flex items-center justify-center w-4 h-6">
                          <Checkbox
                            size="sm"
                            checked={filteredInvoices.length > 0 && selectedPurchaseIds.size === filteredInvoices.length}
                            onCheckedChange={toggleSelectAllPurchase}
                            aria-label={t.common.selectAll}
                          />
                        </div>
                      </TableHead>
                      <TableHead>{t.expenses.invoiceNumber}</TableHead>
                      <TableHead>{t.expenses.invoiceTypeColumn}</TableHead>
                      <TableHead>{t.expenses.supplier}</TableHead>
                      <TableHead>{t.expenses.invoiceDate}</TableHead>
                      <TableHead>{t.expenses.total}</TableHead>
                      <TableHead>{t.common.status}</TableHead>
                      <TableHead className="w-[60px]">{t.common.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          {t.common.noData}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id} className={selectedPurchaseIds.has(invoice.id) ? 'bg-blue-50' : ''}>
                          <TableCell className="w-4 min-w-4 max-w-4 p-0.5 text-center align-middle">
                            <div className="inline-flex items-center justify-center w-4 h-6">
                              <Checkbox
                                size="sm"
                                checked={selectedPurchaseIds.has(invoice.id)}
                                onCheckedChange={() => toggleSelectPurchase(invoice.id)}
                                aria-label={t.common.select}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>
                            <Badge className={PURCHASE_TYPE_COLORS[invoice.invoice_type || 'purchase'] || 'bg-gray-100 text-gray-800'} variant="secondary">
                              {PURCHASE_TYPE_LABELS[invoice.invoice_type || 'purchase']?.[language] || (invoice.invoice_type || 'purchase')}
                            </Badge>
                          </TableCell>
                          <TableCell>{invoice.supplier_id ? (invoice.supplier?.company_title || invoice.supplier?.name) : (invoice.supplier_display_name || '–')}</TableCell>
                          <TableCell>{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="font-semibold">{renderAmountWithConversion(Number(invoice.total_amount), 'TRY', invoice.invoice_date ? format(new Date(invoice.invoice_date), 'yyyy-MM-dd') : null)}</TableCell>
                          <TableCell>
                            {invoice.status === 'pending' && <Badge variant="outline">{t.expenses.pending}</Badge>}
                            {invoice.status === 'accepted' && <Badge className="bg-green-500">{t.expenses.accepted}</Badge>}
                            {invoice.status === 'rejected' && <Badge variant="destructive">{t.expenses.rejected}</Badge>}
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button type="button" variant="ghost" size="sm" className="bg-slate-100 hover:bg-slate-200 text-slate-800" aria-label={t.common.actions}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      const path = `/expenses/incoming/${invoice.id}`
                                      setTimeout(() => router.push(path), 50)
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    {t.common.view}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      const path = `/expenses/incoming/${invoice.id}?mode=edit`
                                      setTimeout(() => router.push(path), 50)
                                    }}
                                  >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    {t.common.edit}
                                  </DropdownMenuItem>
                                  {invoice.status === 'pending' && (
                                    <>
                                      <DropdownMenuItem onSelect={() => handleAcceptInvoice(invoice.id)} className="text-green-600">
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        {t.common.accepted}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onSelect={() => handleRejectInvoice(invoice.id)} className="text-red-600">
                                        <XCircle className="h-4 w-4 mr-2" />
                                        {t.common.rejected}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuItem
                                    onSelect={() => { setPurchaseToDelete(invoice.id); setIsDeletePurchaseDialogOpen(true) }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {t.common.delete}
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
          </CardHeader>
        </Card>
      </div>

      <ExpenseExcelImportDialog
        isOpen={isExpenseImportDialogOpen}
        onClose={() => setIsExpenseImportDialogOpen(false)}
        onSuccess={fetchData}
      />

      <ConfirmDeleteDialog
        open={isDeletePurchaseDialogOpen}
        onOpenChange={setIsDeletePurchaseDialogOpen}
        onConfirm={() => purchaseToDelete && handleDeletePurchaseInvoice(purchaseToDelete)}
        title={language === 'tr' ? 'Alış faturasını sil' : 'Delete purchase invoice'}
        description={language === 'tr' ? 'Bu alış faturasını silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this purchase invoice?'}
      />

      <ConfirmDeleteDialog
        open={isBulkDeletePurchaseDialogOpen}
        onOpenChange={setIsBulkDeletePurchaseDialogOpen}
        onConfirm={handleBulkDeletePurchase}
        itemCount={selectedPurchaseIds.size}
        title={language === 'tr' ? 'Alış faturalarını sil' : 'Delete purchase invoices'}
        description={language === 'tr' ? `${selectedPurchaseIds.size} alış faturasını silmek istediğinize emin misiniz?` : `Are you sure you want to delete ${selectedPurchaseIds.size} purchase invoice(s)?`}
      />

    </DashboardLayout>
  )
}
