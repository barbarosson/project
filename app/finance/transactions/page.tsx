'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ArrowDownCircle, ArrowUpCircle, Filter, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/hooks/use-currency'
import { EmptyState } from '@/components/empty-state'
import { AddTransactionDialog } from '@/components/add-transaction-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'

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
  const { tenantId } = useTenant()
  const { t } = useLanguage()
  const { formatCurrency } = useCurrency()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netCashFlow: 0,
    cashOnHand: 0
  })

  useEffect(() => {
    if (tenantId) {
      fetchTransactions()
      fetchSummary()
    }
  }, [tenantId])

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
        .select('current_balance')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)

      const cashOnHand = accounts?.reduce((sum, acc) => sum + Number(acc.current_balance), 0) || 0

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

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.finance.transactions.title}</h1>
            <p className="text-gray-500 mt-1">Track all your income and expense transactions</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
            <Button variant="outline" onClick={() => setFilterOpen(!filterOpen)}>
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/90 text-sm font-medium">
                {t.finance.transactions.cashOnHand}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={ArrowDownCircle}
            title={t.finance.transactions.noTransactions}
            description={t.finance.transactions.noTransactionsDesc}
            action={{
              label: t.finance.transactions.addTransaction,
              onClick: () => setAddDialogOpen(true)
            }}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.finance.transactions.transactionDate}</TableHead>
                      <TableHead>{t.finance.transactions.description}</TableHead>
                      <TableHead>{t.finance.transactions.account}</TableHead>
                      <TableHead>{t.finance.transactions.customer}</TableHead>
                      <TableHead>{t.finance.transactions.reference}</TableHead>
                      <TableHead>{t.finance.transactions.paymentMethod}</TableHead>
                      <TableHead className="text-right">{t.finance.transactions.amount}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => {
                      const isIncome = transaction.transaction_type === 'income'

                      return (
                        <TableRow key={transaction.id}>
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
      </div>
    </DashboardLayout>
  )
}
