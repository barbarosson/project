'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Plus, Search, FileText, Receipt, CheckCircle2, XCircle, Eye, Trash2, Pencil, Upload, MoreVertical } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useCurrency } from '@/contexts/currency-context'
import { useLanguage } from '@/contexts/language-context'
import { convertAmount, type TcmbRatesByCurrency } from '@/lib/tcmb'
import { toast } from 'sonner'
import { AddManualExpenseDialog } from '@/components/add-manual-expense-dialog'
import { EditManualExpenseDialog } from '@/components/edit-manual-expense-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { ExpenseExcelImportDialog } from '@/components/expense-excel-import-dialog'
import { AddManualPurchaseInvoiceDialog } from '@/components/add-manual-purchase-invoice-dialog'
import { format, subDays } from 'date-fns'

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  expense_date: string
  payment_method: string
  receipt_url: string | null
  notes: string | null
  currency?: string
  customer_id?: string | null
}

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
  }
}

const PURCHASE_TYPE_LABELS: Record<string, Record<string, string>> = {
  purchase: { tr: 'Alış', en: 'Purchase' },
  purchase_return: { tr: 'Alıştan İade', en: 'Purchase Return' },
  devir: { tr: 'Devir', en: 'Carry Forward' },
  devir_return: { tr: 'Devir İade', en: 'Carry Fwd Return' },
}
const PURCHASE_TYPE_COLORS: Record<string, string> = {
  purchase: 'bg-emerald-100 text-emerald-800',
  purchase_return: 'bg-orange-100 text-orange-800',
  devir: 'bg-violet-100 text-violet-800',
  devir_return: 'bg-pink-100 text-pink-800',
}

export default function ExpensesPage() {
  const { tenantId, loading: tenantLoading } = useTenant()
  const { formatCurrency, currency: preferredCurrency, defaultRateType } = useCurrency()
  const { t, language } = useLanguage()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([])
  const [tcmbRatesByDate, setTcmbRatesByDate] = useState<Record<string, TcmbRatesByCurrency>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState<string>('all')
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState<string>('all')
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false)
  const [isAddPurchaseInvoiceDialogOpen, setIsAddPurchaseInvoiceDialogOpen] = useState(false)
  const [isExpenseImportDialogOpen, setIsExpenseImportDialogOpen] = useState(false)
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] = useState(false)
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expenseToView, setExpenseToView] = useState<Expense | null>(null)
  const [selectedPurchaseIds, setSelectedPurchaseIds] = useState<Set<string>>(new Set())
  const [purchaseToView, setPurchaseToView] = useState<PurchaseInvoice | null>(null)
  const [isBulkDeletePurchaseDialogOpen, setIsBulkDeletePurchaseDialogOpen] = useState(false)
  const [isDeletePurchaseDialogOpen, setIsDeletePurchaseDialogOpen] = useState(false)
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('manual')

  const targetCurrency = (preferredCurrency || 'TRY').toUpperCase()

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchData()
    }
  }, [tenantId, tenantLoading])

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
      await Promise.all([fetchExpenses(), fetchPurchaseInvoices()])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (expenses.length === 0 && purchaseInvoices.length === 0) return
    const uniqueDates = Array.from(new Set([
      ...expenses.map(e => e.expense_date ? format(new Date(e.expense_date), 'yyyy-MM-dd') : null),
      ...purchaseInvoices.map(inv => inv.invoice_date ? format(new Date(inv.invoice_date), 'yyyy-MM-dd') : null)
    ].filter(Boolean))) as string[]
    fetchTcmbRatesForDates(uniqueDates).then(setTcmbRatesByDate)
  }, [expenses.length, purchaseInvoices.length])

  async function fetchExpenses() {
    if (!tenantId) {
      console.warn('⚠️ Cannot fetch expenses: tenantId is null')
      return
    }

    console.log('🔍 Fetching expenses for tenant:', tenantId)

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('expense_date', { ascending: false })

    if (error) {
      console.error('❌ Error fetching expenses:', error)
      toast.error(t.expenses.loadExpensesError)
      return
    }

    console.log('✅ Expenses loaded:', data?.length || 0, 'records')
    setExpenses(data || [])
  }

  async function fetchPurchaseInvoices() {
    if (!tenantId) return

    const { data, error } = await supabase
      .from('purchase_invoices')
      .select(`
        *,
        supplier:customers!purchase_invoices_supplier_id_fkey(company_title, name)
      `)
      .eq('tenant_id', tenantId)
      .order('invoice_date', { ascending: false })

    if (error) {
      console.error('Error fetching purchase invoices:', error)
      return
    }

    setPurchaseInvoices(data || [])
  }

  async function handleDeleteExpense() {
    if (!expenseToDelete || !tenantId) return

    try {
      const { data: exp } = await supabase
        .from('expenses')
        .select('customer_id, amount')
        .eq('id', expenseToDelete)
        .eq('tenant_id', tenantId)
        .single()

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseToDelete)
        .eq('tenant_id', tenantId)

      if (error) throw error

      if (exp?.customer_id && Number(exp.amount) > 0) {
        const { data: cust } = await supabase.from('customers').select('balance').eq('id', exp.customer_id).eq('tenant_id', tenantId).single()
        if (cust) {
          await supabase.from('customers').update({ balance: Math.max(0, Number(cust.balance ?? 0) - Number(exp.amount)) }).eq('id', exp.customer_id).eq('tenant_id', tenantId)
        }
      }

      toast.success(t.expenses.expenseDeletedSuccess)
      fetchExpenses()
    } catch (error: any) {
      console.error('Error deleting expense:', error)
      toast.error(error.message || t.expenses.deleteExpenseError)
    } finally {
      setIsDeleteDialogOpen(false)
      setExpenseToDelete(null)
    }
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredExpenses.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredExpenses.map(e => e.id)))
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  async function handleBulkDelete() {
    if (!tenantId || selectedIds.size === 0) return
    try {
      for (const id of selectedIds) {
        const exp = expenses.find(e => e.id === id)
        if (!exp) continue
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', id)
          .eq('tenant_id', tenantId)
        if (error) throw error
        if (exp.customer_id && Number(exp.amount) > 0) {
          const { data: cust } = await supabase.from('customers').select('balance').eq('id', exp.customer_id).eq('tenant_id', tenantId).single()
          if (cust) {
            await supabase.from('customers').update({ balance: Math.max(0, Number(cust.balance ?? 0) - Number(exp.amount)) }).eq('id', exp.customer_id).eq('tenant_id', tenantId)
          }
        }
      }
      toast.success(t.expenses.expenseDeletedSuccess)
      setSelectedIds(new Set())
      fetchExpenses()
    } catch (error: any) {
      toast.error(error.message || t.expenses.deleteExpenseError)
    } finally {
      setIsBulkDeleteDialogOpen(false)
    }
  }

  const filteredInvoices = purchaseInvoices.filter((invoice) => {
    if (purchaseStatusFilter !== 'all' && invoice.status !== purchaseStatusFilter) return false
    if (purchaseTypeFilter !== 'all' && (invoice.invoice_type || 'purchase') !== purchaseTypeFilter) return false
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

      const { error: expenseError } = await supabase
        .from('expenses')
        .insert({
          tenant_id: tenantId,
          category: 'general',
          description: `Purchase Invoice ${invoice.invoice_number} from ${invoice.supplier?.company_title || invoice.supplier?.name}`,
          amount: invoice.total_amount,
          expense_date: invoice.invoice_date,
          payment_method: 'bank_transfer',
          notes: `Accepted purchase invoice`
        })

      if (expenseError) throw expenseError

      let stockUpdatedCount = 0
      if (lineItems && lineItems.length > 0) {
        let productsByName: { id: string; name: string }[] | null = null
        async function resolveProductId(item: (typeof lineItems)[0]): Promise<string | null> {
          if (item.product_id) return item.product_id
          const desc = (item.description && typeof item.description === 'string') ? item.description.trim() : ''
          if (!desc) return null
          if (!productsByName) {
            const { data: list } = await supabase.from('products').select('id, name').eq('tenant_id', tenantId).eq('status', 'active')
            productsByName = (list || []).map((p: { id: string; name: string }) => ({ id: p.id, name: (p.name || '').trim().toLowerCase() }))
          }
          const descLower = desc.toLowerCase()
          const exact = productsByName.filter((p) => p.name === descLower)
          if (exact.length === 1) return exact[0].id
          const partial = productsByName.filter((p) => p.name && descLower.includes(p.name))
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

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalManualExpenses = expenses.reduce(
    (sum, exp) => sum + convertToPreferred(Number(exp.amount), (exp as Expense).currency ?? 'TRY', exp.expense_date ? format(new Date(exp.expense_date), 'yyyy-MM-dd') : null),
    0
  )
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
  const totalExpenses = totalManualExpenses + totalAcceptedInvoices
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">{t.expenses.manualExpenses}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalManualExpenses, targetCurrency)}</div>
              <p className="text-xs text-gray-500 mt-1">{expenses.length} {t.expenses.expenseCountLabel}</p>
            </CardContent>
          </Card>

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
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between min-w-0">
                <TabsList className="w-full sm:w-auto flex-shrink-0">
                  <TabsTrigger value="manual" className="flex items-center gap-2 data-[state=inactive]:text-[#0A192F]">
                    <Receipt size={16} />
                    {t.expenses.manualExpenses}
                  </TabsTrigger>
                  <TabsTrigger value="incoming" className="flex items-center gap-2 data-[state=inactive]:text-[#0A192F]">
                    <FileText size={16} />
                    {t.expenses.incomingInvoices}
                    {pendingInvoicesCount > 0 && (
                      <Badge variant="destructive" className="ml-1">{pendingInvoicesCount}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

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
                    {activeTab === 'manual' && (
                      <Button
                        onClick={() => setIsAddExpenseDialogOpen(true)}
                        className="shrink-0 bg-[#00D4AA] hover:bg-[#00B894] font-semibold text-contrast-body"
                      >
                        <Plus size={16} className="mr-2" />
                        {t.expenses.addExpense}
                      </Button>
                    )}
                    {activeTab === 'incoming' && (
                      <Button
                        onClick={() => setIsAddPurchaseInvoiceDialogOpen(true)}
                        className="shrink-0 bg-[#00D4AA] hover:bg-[#00B894] font-semibold text-contrast-body"
                      >
                        <Plus size={16} className="mr-2" />
                        {t.expenses.addIncomingInvoice}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <TabsContent value="manual" className="mt-6">
                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-lg bg-blue-50 border border-blue-200">
                    <span className="text-sm font-medium text-blue-800">
                      {selectedIds.size} {t.common.selected}
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-[var(--color-info)] bg-white hover:bg-gray-100"
                      onClick={() => setIsBulkDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      {t.common.bulkDelete}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
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
                            checked={filteredExpenses.length > 0 && selectedIds.size === filteredExpenses.length}
                            onCheckedChange={toggleSelectAll}
                            aria-label={t.common.selectAll}
                          />
                        </div>
                      </TableHead>
                      <TableHead>{t.expenses.expenseDate}</TableHead>
                      <TableHead>{t.expenses.category}</TableHead>
                      <TableHead>{t.expenses.description}</TableHead>
                      <TableHead>{t.expenses.amount}</TableHead>
                      <TableHead>{t.expenses.paymentMethod}</TableHead>
                      <TableHead className="w-[60px]">{t.common.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          {t.common.noData}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExpenses.map((expense) => (
                        <TableRow key={expense.id} className={selectedIds.has(expense.id) ? 'bg-blue-50' : ''}>
                          <TableCell className="w-4 min-w-4 max-w-4 p-0.5 text-center align-middle">
                            <div className="inline-flex items-center justify-center w-4 h-6">
                              <Checkbox
                                size="sm"
                                checked={selectedIds.has(expense.id)}
                                onCheckedChange={() => toggleSelect(expense.id)}
                                aria-label={t.common.select}
                              />
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(expense.expense_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {t.expenses.categories[expense.category as keyof typeof t.expenses.categories]}
                            </Badge>
                          </TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell className="font-semibold">{renderAmountWithConversion(Number(expense.amount), (expense as Expense).currency ?? 'TRY', expense.expense_date ? format(new Date(expense.expense_date), 'yyyy-MM-dd') : null)}</TableCell>
                          <TableCell>
                            {t.expenses.paymentMethods[expense.payment_method as keyof typeof t.expenses.paymentMethods]}
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex items-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="bg-slate-100 hover:bg-slate-200 text-slate-800" aria-label={t.common.actions}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setExpenseToView(expense) }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    {t.common.view}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setExpenseToEdit(expense); setIsEditExpenseDialogOpen(true) }}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    {t.common.edit}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => { setExpenseToDelete(expense.id); setIsDeleteDialogOpen(true) }}
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
              </TabsContent>

              <TabsContent value="incoming" className="mt-6">
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
                    </SelectContent>
                  </Select>
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
                          <TableCell>{invoice.supplier?.company_title || invoice.supplier?.name}</TableCell>
                          <TableCell>{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="font-semibold">{renderAmountWithConversion(Number(invoice.total_amount), 'TRY', invoice.invoice_date ? format(new Date(invoice.invoice_date), 'yyyy-MM-dd') : null)}</TableCell>
                          <TableCell>
                            {invoice.status === 'pending' && <Badge variant="outline">{t.expenses.pending}</Badge>}
                            {invoice.status === 'accepted' && <Badge className="bg-green-500">{t.expenses.accepted}</Badge>}
                            {invoice.status === 'rejected' && <Badge variant="destructive">{t.expenses.rejected}</Badge>}
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex items-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="bg-slate-100 hover:bg-slate-200 text-slate-800" aria-label={t.common.actions}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setPurchaseToView(invoice)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    {t.common.view}
                                  </DropdownMenuItem>
                                  {invoice.status === 'pending' && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleAcceptInvoice(invoice.id)} className="text-green-600">
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        {t.common.accepted}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleRejectInvoice(invoice.id)} className="text-red-600">
                                        <XCircle className="h-4 w-4 mr-2" />
                                        {t.common.rejected}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => { setPurchaseToDelete(invoice.id); setIsDeletePurchaseDialogOpen(true) }}
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
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>

      <AddManualExpenseDialog
        open={isAddExpenseDialogOpen}
        onOpenChange={setIsAddExpenseDialogOpen}
        onSuccess={fetchExpenses}
      />

      <ExpenseExcelImportDialog
        isOpen={isExpenseImportDialogOpen}
        onClose={() => setIsExpenseImportDialogOpen(false)}
        onSuccess={fetchData}
      />

      <AddManualPurchaseInvoiceDialog
        open={isAddPurchaseInvoiceDialogOpen}
        onOpenChange={setIsAddPurchaseInvoiceDialogOpen}
        onSuccess={fetchData}
      />

      <EditManualExpenseDialog
        expense={expenseToEdit}
        open={isEditExpenseDialogOpen}
        onOpenChange={(open) => {
          setIsEditExpenseDialogOpen(open)
          if (!open) setExpenseToEdit(null)
        }}
        onSuccess={() => {
          fetchExpenses()
          setIsEditExpenseDialogOpen(false)
          setExpenseToEdit(null)
        }}
      />

      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteExpense}
        title={t.expenses.deleteExpenseTitle}
        description={t.expenses.deleteExpenseDescription}
      />

      <ConfirmDeleteDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
        onConfirm={handleBulkDelete}
        itemCount={selectedIds.size}
        title={t.expenses.deleteExpenseTitle}
        description={language === 'tr' ? `${selectedIds.size} masrafı silmek istediğinize emin misiniz?` : `Are you sure you want to delete ${selectedIds.size} expense(s)?`}
      />

      <Dialog open={!!expenseToView} onOpenChange={(open) => !open && setExpenseToView(null)}>
        <DialogContent className="max-w-md bg-blue-50 border-blue-200">
          <DialogHeader>
            <DialogTitle>{t.common.view} - {t.expenses.manualExpenses}</DialogTitle>
          </DialogHeader>
          {expenseToView && (
            <div className="grid gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-500">{t.expenses.expenseDate}</span>
                <p>{format(new Date(expenseToView.expense_date), 'dd MMM yyyy')}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">{t.expenses.category}</span>
                <p>{t.expenses.categories[expenseToView.category as keyof typeof t.expenses.categories]}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">{t.expenses.description}</span>
                <p>{expenseToView.description}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">{t.expenses.amount}</span>
                <p className="font-semibold">{renderAmountWithConversion(Number(expenseToView.amount), expenseToView.currency ?? 'TRY', format(new Date(expenseToView.expense_date), 'yyyy-MM-dd'))}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">{t.expenses.paymentMethod}</span>
                <p>{t.expenses.paymentMethods[expenseToView.payment_method as keyof typeof t.expenses.paymentMethods]}</p>
              </div>
              {expenseToView.notes && (
                <div>
                  <span className="font-medium text-gray-500">{t.common.notes}</span>
                  <p>{expenseToView.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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

      <Dialog open={!!purchaseToView} onOpenChange={(open) => !open && setPurchaseToView(null)}>
        <DialogContent className="max-w-md bg-blue-50 border-blue-200">
          <DialogHeader>
            <DialogTitle>{t.common.view} - {t.expenses.incomingInvoices}</DialogTitle>
          </DialogHeader>
          {purchaseToView && (
            <div className="grid gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-500">{t.expenses.invoiceNumber}</span>
                <p className="font-medium">{purchaseToView.invoice_number}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">{t.expenses.invoiceTypeColumn}</span>
                <p>
                  <Badge className={PURCHASE_TYPE_COLORS[purchaseToView.invoice_type || 'purchase'] || 'bg-gray-100 text-gray-800'} variant="secondary">
                    {PURCHASE_TYPE_LABELS[purchaseToView.invoice_type || 'purchase']?.[language] || (purchaseToView.invoice_type || 'purchase')}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-500">{t.expenses.supplier}</span>
                <p>{purchaseToView.supplier?.company_title || purchaseToView.supplier?.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">{t.expenses.invoiceDate}</span>
                <p>{format(new Date(purchaseToView.invoice_date), 'dd MMM yyyy')}</p>
              </div>
              {purchaseToView.due_date && (
                <div>
                  <span className="font-medium text-gray-500">{t.expenses.dueDate}</span>
                  <p>{format(new Date(purchaseToView.due_date), 'dd MMM yyyy')}</p>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-500">{t.expenses.total}</span>
                <p className="font-semibold">{renderAmountWithConversion(Number(purchaseToView.total_amount), 'TRY', format(new Date(purchaseToView.invoice_date), 'yyyy-MM-dd'))}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">{t.common.status}</span>
                <p>
                  {purchaseToView.status === 'pending' && <Badge variant="outline">{t.expenses.pending}</Badge>}
                  {purchaseToView.status === 'accepted' && <Badge className="bg-green-500">{t.expenses.accepted}</Badge>}
                  {purchaseToView.status === 'rejected' && <Badge variant="destructive">{t.expenses.rejected}</Badge>}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
