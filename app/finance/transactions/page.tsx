'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ArrowDownCircle, ArrowUpCircle, Filter, Download, MoreVertical, Eye, Pencil, Trash2, FileSignature, CheckSquare, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/hooks/use-currency'
import { convertAmount } from '@/lib/tcmb'
import type { TcmbRatesByCurrency } from '@/lib/tcmb'
import { EmptyState } from '@/components/empty-state'
import { AddTransactionDialog } from '@/components/add-transaction-dialog'
import { TransactionExcelImportDialog } from '@/components/transaction-excel-import-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Transaction {
  id: string
  account_id: string
  transaction_type: 'income' | 'expense'
  amount: number
  currency: string
  transaction_date: string
  description: string
  reference_type?: string
  reference_id?: string
  customer_id?: string
  payment_method: string
  notes?: string
  created_at: string
  invoice_number?: string
  invoice_status?: string
  accounts?: {
    name: string
    type: string
  }
  customers?: {
    name: string
  }
}

export default function TransactionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filterReferenceId = searchParams.get('reference_id')
  const filterReferenceType = searchParams.get('reference_type')
  const { tenantId } = useTenant()
  const { t, language } = useLanguage()
  const { formatCurrency, currency: preferredCurrency, defaultRateType } = useCurrency()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [matchTransaction, setMatchTransaction] = useState<Transaction | null>(null)
  const [matchInvoiceId, setMatchInvoiceId] = useState<string>('')
  const [matchInvoices, setMatchInvoices] = useState<{ id: string; invoice_number: string; amount: number }[]>([])
  const [matchLoading, setMatchLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isTransactionImportOpen, setIsTransactionImportOpen] = useState(false)
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netCashFlow: 0,
    cashOnHand: 0
  })

  const filteredTransactions = useMemo(() => {
    if (!filterReferenceId || !filterReferenceType) return transactions
    return transactions.filter(
      (tr) => tr.reference_id === filterReferenceId && tr.reference_type === filterReferenceType
    )
  }, [transactions, filterReferenceId, filterReferenceType])

  const allVisibleSelected = filteredTransactions.length > 0 && filteredTransactions.every((tr) => selectedIds.has(tr.id))
  const someSelected = selectedIds.size > 0

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredTransactions.map((tr) => tr.id)))
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
    const ok = window.confirm(
      language === 'tr'
        ? `${selectedIds.size} işlem silinecek. Emin misiniz?`
        : `Delete ${selectedIds.size} transaction(s). Are you sure?`
    )
    if (!ok) return
    try {
      const toDelete = transactions.filter((t) => selectedIds.has(t.id))
      const invoicePayments: { reference_id: string; amount: number }[] = toDelete
        .filter((t) => t.reference_type === 'invoice' && t.transaction_type === 'income' && t.reference_id)
        .map((t) => ({ reference_id: t.reference_id!, amount: Number(t.amount) || 0 }))
      const expensePayments: { reference_id: string; amount: number }[] = toDelete
        .filter((t) => t.reference_type === 'expense' && t.transaction_type === 'expense' && t.reference_id)
        .map((t) => ({ reference_id: t.reference_id!, amount: Number(t.amount) || 0 }))

      for (const id of Array.from(selectedIds)) {
        await supabase.from('transactions').delete().eq('id', id).eq('tenant_id', tenantId)
      }

      const invoiceIds = [...new Set(invoicePayments.map((p) => p.reference_id))]
      for (const invId of invoiceIds) {
        const totalAmount = invoicePayments.filter((p) => p.reference_id === invId).reduce((sum, p) => sum + p.amount, 0)
        const { data: inv } = await supabase
          .from('invoices')
          .select('id, total, amount, paid_amount, status')
          .eq('id', invId)
          .eq('tenant_id', tenantId)
          .single()
        if (inv && totalAmount > 0) {
          const total = Number(inv.total ?? inv.amount ?? 0)
          const currentPaid = Number(inv.paid_amount ?? 0)
          const newPaid = Math.max(0, currentPaid - totalAmount)
          const newRemaining = total - newPaid
          const isFullyPaid = newRemaining <= 0.01
          await supabase
            .from('invoices')
            .update({
              paid_amount: newPaid,
              remaining_amount: newRemaining,
              status: isFullyPaid ? 'paid' : inv.status === 'paid' ? 'overdue' : inv.status,
              ...(isFullyPaid ? {} : { payment_date: null })
            })
            .eq('id', invId)
            .eq('tenant_id', tenantId)
        }
      }

      const expenseIds = [...new Set(expensePayments.map((p) => p.reference_id))]
      for (const expId of expenseIds) {
        const totalAmount = expensePayments.filter((p) => p.reference_id === expId).reduce((sum, p) => sum + p.amount, 0)
        const { data: exp } = await supabase
          .from('expenses')
          .select('id, amount, paid_amount, status')
          .eq('id', expId)
          .eq('tenant_id', tenantId)
          .single()
        if (exp && totalAmount > 0) {
          const total = Number(exp.amount ?? 0)
          const currentPaid = Number(exp.paid_amount ?? 0)
          const newPaid = Math.max(0, currentPaid - totalAmount)
          const newRemaining = total - newPaid
          const isFullyPaid = newRemaining <= 0.01
          await supabase
            .from('expenses')
            .update({
              paid_amount: newPaid,
              remaining_amount: newRemaining,
              status: isFullyPaid ? 'paid' : 'pending'
            })
            .eq('id', expId)
            .eq('tenant_id', tenantId)
        }
      }

      toast.success(language === 'tr' ? `${selectedIds.size} işlem silindi` : `${selectedIds.size} transaction(s) deleted`)
      setSelectedIds(new Set())
      fetchTransactions()
      fetchSummary()
    } catch (err: any) {
      toast.error(err?.message || (language === 'tr' ? 'Silinemedi' : 'Delete failed'))
    }
  }

  useEffect(() => {
    if (tenantId) {
      fetchTransactions()
      fetchSummary()
    }
  }, [tenantId])

  useEffect(() => {
    if (matchTransaction && tenantId) {
      supabase
        .from('invoices')
        .select('id, invoice_number, amount')
        .eq('tenant_id', tenantId)
        .in('status', ['sent', 'overdue', 'draft'])
        .order('invoice_number', { ascending: false })
        .limit(200)
        .then(({ data }) => setMatchInvoices(data || []))
      setMatchInvoiceId('')
    } else {
      setMatchInvoices([])
    }
  }, [matchTransaction, tenantId])

  async function fetchTransactions() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('transactions_with_invoice_details')
        .select(`
          *,
          accounts:account_id (name, type),
          customers:customer_id (name)
        `)
        .eq('tenant_id', tenantId)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error: any) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSummary() {
    try {
      const { data: accounts } = await supabase
        .from('accounts')
        .select('current_balance, currency')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)

      const targetCurrency = (preferredCurrency || 'TRY').toUpperCase()
      let cashOnHand = 0
      if (accounts && accounts.length > 0) {
        const dateStr = new Date().toISOString().slice(0, 10)
        let rates: TcmbRatesByCurrency | null = null
        try {
          const res = await fetch(`/api/tcmb?date=${dateStr}`)
          if (res.ok) {
            const data = await res.json()
            if (data && Object.keys(data).length > 0) rates = data
          }
        } catch (_) {}
        cashOnHand = accounts.reduce((sum, acc) => {
          const amt = Number(acc.current_balance) || 0
          const cur = ((acc as { currency?: string }).currency || 'TRY').toUpperCase()
          if (cur === targetCurrency) return sum + amt
          if (rates) {
            const converted = convertAmount(amt, cur, targetCurrency, rates, defaultRateType)
            if (converted != null) return sum + converted
          }
          return sum
        }, 0)
      }

      const { data: transactions } = await supabase
        .from('transactions')
        .select('transaction_type, amount')
        .eq('tenant_id', tenantId)

      const income = transactions?.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0
      const expense = transactions?.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0

      setSummary({
        totalIncome: income,
        totalExpense: expense,
        netCashFlow: income - expense,
        cashOnHand
      })
    } catch (error: any) {
      console.error('Error fetching summary:', error)
    }
  }

  function getPaymentMethodLabel(method: string) {
    const methods = t.finance.transactions.paymentMethods as any
    return methods[method] || method
  }

  function getReferenceTypeLabel(type?: string) {
    if (!type) return '-'
    const types = t.finance.transactions.referenceTypes as any
    return types[type] || type
  }

  function handleView(transaction: Transaction) {
    if (transaction.reference_type === 'invoice' && transaction.reference_id) {
      router.push(`/invoices/${transaction.reference_id}`)
    } else {
      toast.info(language === 'tr' ? 'Bu işleme bağlı fatura yok.' : 'No invoice linked to this transaction.')
    }
  }

  async function handleDelete(transaction: Transaction) {
    if (!tenantId) return
    const ok = window.confirm(
      language === 'tr'
        ? 'Bu tahsilat kaydını silmek istediğinize emin misiniz?'
        : 'Are you sure you want to delete this transaction?'
    )
    if (!ok) return
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id)
        .eq('tenant_id', tenantId)
      if (error) throw error

      const amount = Number(transaction.amount) || 0
      if (transaction.reference_type === 'invoice' && transaction.reference_id && transaction.transaction_type === 'income' && amount > 0) {
        const { data: inv } = await supabase
          .from('invoices')
          .select('id, total, amount, paid_amount, status')
          .eq('id', transaction.reference_id)
          .eq('tenant_id', tenantId)
          .single()
        if (inv) {
          const total = Number(inv.total ?? inv.amount ?? 0)
          const currentPaid = Number(inv.paid_amount ?? 0)
          const newPaid = Math.max(0, currentPaid - amount)
          const newRemaining = total - newPaid
          const isFullyPaid = newRemaining <= 0.01
          await supabase
            .from('invoices')
            .update({
              paid_amount: newPaid,
              remaining_amount: newRemaining,
              status: isFullyPaid ? 'paid' : inv.status === 'paid' ? 'overdue' : inv.status,
              ...(isFullyPaid ? {} : { payment_date: null })
            })
            .eq('id', transaction.reference_id)
            .eq('tenant_id', tenantId)
        }
      }
      if (transaction.reference_type === 'expense' && transaction.reference_id && transaction.transaction_type === 'expense' && amount > 0) {
        const { data: exp } = await supabase
          .from('expenses')
          .select('id, amount, paid_amount')
          .eq('id', transaction.reference_id)
          .eq('tenant_id', tenantId)
          .single()
        if (exp) {
          const total = Number(exp.amount ?? 0)
          const currentPaid = Number(exp.paid_amount ?? 0)
          const newPaid = Math.max(0, currentPaid - amount)
          const newRemaining = total - newPaid
          const isFullyPaid = newRemaining <= 0.01
          await supabase
            .from('expenses')
            .update({
              paid_amount: newPaid,
              remaining_amount: newRemaining,
              status: isFullyPaid ? 'paid' : 'pending'
            })
            .eq('id', transaction.reference_id)
            .eq('tenant_id', tenantId)
        }
      }

      toast.success(language === 'tr' ? 'Tahsilat silindi.' : 'Transaction deleted.')
      fetchTransactions()
      fetchSummary()
    } catch (err: any) {
      toast.error(err?.message || (language === 'tr' ? 'Silinemedi' : 'Delete failed'))
    }
  }

  function handleEdit(transaction: Transaction) {
    if (transaction.reference_type === 'invoice' && transaction.reference_id) {
      router.push(`/invoices/${transaction.reference_id}`)
    } else {
      setMatchTransaction(transaction)
    }
  }

  function handleMatchWithInvoice(transaction: Transaction) {
    setMatchTransaction(transaction)
  }

  async function handleMatchConfirm() {
    if (!matchTransaction || !matchInvoiceId || !tenantId) return
    setMatchLoading(true)
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ reference_type: 'invoice', reference_id: matchInvoiceId })
        .eq('id', matchTransaction.id)
        .eq('tenant_id', tenantId)
      if (error) throw error
      toast.success(language === 'tr' ? 'İşlem faturayla eşlendi.' : 'Transaction matched with invoice.')
      setMatchTransaction(null)
      setMatchInvoiceId('')
      fetchTransactions()
      fetchSummary()
    } catch (err: any) {
      toast.error(err?.message || (language === 'tr' ? 'Eşlenemedi' : 'Match failed'))
    } finally {
      setMatchLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.finance.transactions.title}</h1>
            <p className="text-gray-500 mt-1">{t.finance.transactions.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsTransactionImportOpen(true)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-white hover:bg-gray-50 h-10 px-4 py-2 shrink-0"
            >
              <Upload className="mr-2 h-4 w-4" />
              {language === 'tr' ? 'Toplu aktarım' : 'Bulk import'}
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t.finance.transactions.addTransaction}
            </Button>
            <Button variant="outline" onClick={() => setFilterOpen(!filterOpen)}>
              <Filter className="mr-2 h-4 w-4" />
              {t.common.filter}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2 bg-[var(--color-success)]">
              <CardTitle className="text-[var(--color-text)] text-sm font-medium">
                {t.finance.transactions.cashOnHand}
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-[var(--color-success)]">
              <div className="text-2xl font-bold">{formatCurrency(summary.cashOnHand)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-green-600" />
                {t.finance.transactions.totalIncome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-red-600" />
                {t.finance.transactions.totalExpense}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t.finance.transactions.netCashFlow}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.netCashFlow)}
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-8">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-gray-100 rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            icon={ArrowDownCircle}
            title={t.finance.transactions.noTransactions}
            description={filterReferenceId ? (language === 'tr' ? 'Bu fatura için henüz ödeme kaydı yok.' : 'No payments recorded for this invoice yet.') : t.finance.transactions.noTransactionsDesc}
            action={!filterReferenceId ? {
              label: t.finance.transactions.addTransaction,
              onClick: () => setAddDialogOpen(true)
            } : undefined}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              {filterReferenceId && (
                <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 text-sm text-blue-800">
                  {t.finance.transactions.paymentsForThisInvoice} ({filteredTransactions.length})
                </div>
              )}
              {someSelected && (
                <div className="flex items-center gap-3 px-6 py-3 bg-blue-50 border-b border-blue-200">
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {t.finance.transactions.transactionsSelected.replace('{count}', String(selectedIds.size))}
                  </span>
                  <Button size="sm" variant="destructive" className="text-[var(--color-info)] bg-white hover:bg-gray-100" onClick={handleBulkDelete}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    {t.finance.transactions.deleteSelected}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
                    {t.finance.transactions.clearSelection}
                  </Button>
                </div>
              )}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="h-8 w-4 min-w-4 max-w-4 p-0.5 text-center align-middle">
                        <div className="inline-flex items-center justify-center w-4 h-6">
                          <Checkbox
                            size="sm"
                            checked={allVisibleSelected && filteredTransactions.length > 0}
                            onCheckedChange={toggleSelectAll}
                            aria-label={t.common.selectAll}
                          />
                        </div>
                      </TableHead>
                      <TableHead>{t.finance.transactions.transactionDate}</TableHead>
                      <TableHead>{t.finance.transactions.description}</TableHead>
                      <TableHead>{t.finance.transactions.account}</TableHead>
                      <TableHead>{t.finance.transactions.customer}</TableHead>
                      <TableHead>{t.finance.transactions.reference}</TableHead>
                      <TableHead>{t.finance.transactions.paymentMethod}</TableHead>
                      <TableHead className="text-right">{t.finance.transactions.amount}</TableHead>
                      <TableHead className="w-[60px]">{t.common.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => {
                      const isIncome = transaction.transaction_type === 'income'

                      return (
                        <TableRow
                          key={transaction.id}
                          className={`transition-colors hover:bg-muted/50 ${selectedIds.has(transaction.id) ? 'bg-blue-50' : ''}`}
                        >
                          <TableCell className="w-4 min-w-4 max-w-4 p-0.5 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center justify-center w-4 h-6">
                              <Checkbox
                                size="sm"
                                checked={selectedIds.has(transaction.id)}
                                onCheckedChange={() => toggleSelect(transaction.id)}
                                aria-label={t.common.select}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {format(new Date(transaction.transaction_date), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isIncome ? (
                                <ArrowDownCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <ArrowUpCircle className="h-4 w-4 text-red-600" />
                              )}
                              <div>
                                <div className="font-medium">{transaction.description}</div>
                                {transaction.notes && (
                                  <div className="text-xs text-gray-500">{transaction.notes}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {transaction.accounts?.name}
                              <div className="text-xs text-gray-500">
                                {transaction.accounts?.type === 'cash' ? t.finance.accounts.cash : t.finance.accounts.bank}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {transaction.customers ? (
                              <Link
                                href={`/customers`}
                                className="text-blue-600 hover:underline text-sm"
                              >
                                {transaction.customers.name}
                              </Link>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {transaction.reference_type ? (
                              <div>
                                <Badge variant="outline" className="text-xs">
                                  {getReferenceTypeLabel(transaction.reference_type)}
                                </Badge>
                                {transaction.reference_type === 'invoice' && transaction.invoice_number && (
                                  <Link
                                    href={`/invoices/${transaction.reference_id}`}
                                    className="block text-xs text-blue-600 hover:underline mt-1"
                                  >
                                    #{transaction.invoice_number}
                                  </Link>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {getPaymentMethodLabel(transaction.payment_method)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                              {isIncome ? '+' : '-'} {transaction.currency} {Number(transaction.amount).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
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
                                <DropdownMenuItem
                                  onClick={() => handleDelete(transaction)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t.finance.transactions.deleteTransaction}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  {t.finance.transactions.updateTransaction}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleView(transaction)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t.finance.transactions.viewTransaction}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMatchWithInvoice(transaction)}>
                                  <FileSignature className="h-4 w-4 mr-2" />
                                  {t.finance.transactions.matchWithInvoice}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <AddTransactionDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSuccess={() => {
            fetchTransactions()
            fetchSummary()
          }}
        />

        <TransactionExcelImportDialog
          isOpen={isTransactionImportOpen}
          onClose={() => setIsTransactionImportOpen(false)}
          onSuccess={() => {
            fetchTransactions()
            fetchSummary()
          }}
        />

        <Dialog open={!!matchTransaction} onOpenChange={(open) => !open && setMatchTransaction(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t.finance.transactions.matchWithInvoice}</DialogTitle>
              <DialogDescription>
                {language === 'tr'
                  ? 'Bu tahsilatı hangi faturayla eşlemek istiyorsunuz?'
                  : 'Which invoice should this transaction be matched to?'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{language === 'tr' ? 'Fatura' : 'Invoice'}</Label>
                <Select value={matchInvoiceId} onValueChange={setMatchInvoiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'tr' ? 'Fatura seçin' : 'Select invoice'} />
                  </SelectTrigger>
                  <SelectContent>
                    {matchInvoices.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.invoice_number} — {inv.amount?.toLocaleString()} TRY
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMatchTransaction(null)}>
                {language === 'tr' ? 'İptal' : 'Cancel'}
              </Button>
              <Button onClick={handleMatchConfirm} disabled={!matchInvoiceId || matchLoading}>
                {matchLoading ? (language === 'tr' ? 'Kaydediliyor...' : 'Saving...') : language === 'tr' ? 'Eşle' : 'Match'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
