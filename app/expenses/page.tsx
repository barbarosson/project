'use client'

import { useEffect, useState } from 'react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, FileText, Receipt, CheckCircle2, XCircle, Eye, Trash2, Pencil } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'
import { AddManualExpenseDialog } from '@/components/add-manual-expense-dialog'
import { EditManualExpenseDialog } from '@/components/edit-manual-expense-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { format } from 'date-fns'

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  expense_date: string
  payment_method: string
  receipt_url: string | null
  notes: string | null
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
  const { t, language } = useLanguage()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState<string>('all')
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState<string>('all')
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false)
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] = useState(false)
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('manual')

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchData()
    }
  }, [tenantId, tenantLoading])

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
      toast.error('Failed to load expenses')
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
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseToDelete)
        .eq('tenant_id', tenantId)

      if (error) throw error

      toast.success('Expense deleted successfully')
      fetchExpenses()
    } catch (error: any) {
      console.error('Error deleting expense:', error)
      toast.error(error.message || 'Failed to delete expense')
    } finally {
      setIsDeleteDialogOpen(false)
      setExpenseToDelete(null)
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

      if (lineItems && lineItems.length > 0) {
        for (const item of lineItems) {
          if (item.product_id) {
            const { data: product } = await supabase
              .from('products')
              .select('current_stock, purchase_price')
              .eq('id', item.product_id)
              .eq('tenant_id', tenantId)
              .single()

            if (product) {
              const updateData: any = {
                current_stock: Number(product.current_stock || 0) + Number(item.quantity),
                updated_at: new Date().toISOString()
              }

              if (item.unit_price && Number(item.unit_price) > 0) {
                updateData.purchase_price = Number(item.unit_price)
              }

              await supabase
                .from('products')
                .update(updateData)
                .eq('id', item.product_id)
                .eq('tenant_id', tenantId)

              await supabase
                .from('stock_movements')
                .insert({
                  tenant_id: tenantId,
                  product_id: item.product_id,
                  movement_type: 'purchase',
                  quantity: item.quantity,
                  reference_type: 'purchase_invoice',
                  reference_id: invoiceId,
                  notes: `Stock increased from purchase invoice ${invoice.invoice_number}${item.unit_price ? ` at $${Number(item.unit_price).toFixed(2)} per unit` : ''}`
                })
            }
          }
        }
      }

      toast.success('Invoice accepted and expense created')
      fetchData()
    } catch (error: any) {
      console.error('Error accepting invoice:', error)
      toast.error(error.message || 'Failed to accept invoice')
    }
  }

  async function handleRejectInvoice(invoiceId: string) {
    if (!tenantId) return

    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    try {
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

      toast.success('Invoice rejected')
      fetchPurchaseInvoices()
    } catch (error: any) {
      console.error('Error rejecting invoice:', error)
      toast.error(error.message || 'Failed to reject invoice')
    }
  }

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

  const totalManualExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  const totalAcceptedInvoices = purchaseInvoices
    .filter(inv => inv.status === 'accepted')
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0)
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
            <p className="text-gray-500 mt-1">Track manual expenses and incoming supplier invoices</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Manual Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalManualExpenses.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">{expenses.length} expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Accepted Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalAcceptedInvoices.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">
                {purchaseInvoices.filter(inv => inv.status === 'accepted').length} invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">All expenses combined</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInvoicesCount}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between">
                <TabsList>
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

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      placeholder={t.common.search}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  {activeTab === 'manual' && (
                    <Button onClick={() => setIsAddExpenseDialogOpen(true)}>
                      <Plus size={16} className="mr-2" />
                      {t.expenses.addExpense}
                    </Button>
                  )}
                </div>
              </div>

              <TabsContent value="manual" className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.expenses.expenseDate}</TableHead>
                      <TableHead>{t.expenses.category}</TableHead>
                      <TableHead>{t.expenses.description}</TableHead>
                      <TableHead>{t.expenses.amount}</TableHead>
                      <TableHead>{t.expenses.paymentMethod}</TableHead>
                      <TableHead className="text-right">{t.common.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          {t.common.noData}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{format(new Date(expense.expense_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {t.expenses.categories[expense.category as keyof typeof t.expenses.categories]}
                            </Badge>
                          </TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell className="font-semibold">${Number(expense.amount).toLocaleString()}</TableCell>
                          <TableCell>
                            {t.expenses.paymentMethods[expense.payment_method as keyof typeof t.expenses.paymentMethods]}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setExpenseToEdit(expense)
                                  setIsEditExpenseDialogOpen(true)
                                }}
                              >
                                <Pencil size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setExpenseToDelete(expense.id)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 size={16} className="text-red-500" />
                              </Button>
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
                      <SelectValue placeholder={language === 'tr' ? 'Durum' : 'Status'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === 'tr' ? 'Tüm Durumlar' : 'All Status'}</SelectItem>
                      <SelectItem value="pending">{language === 'tr' ? 'Bekleyen' : 'Pending'}</SelectItem>
                      <SelectItem value="accepted">{language === 'tr' ? 'Kabul' : 'Accepted'}</SelectItem>
                      <SelectItem value="rejected">{language === 'tr' ? 'Red' : 'Rejected'}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={purchaseTypeFilter} onValueChange={setPurchaseTypeFilter}>
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder={language === 'tr' ? 'Fatura Tipi' : 'Invoice Type'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === 'tr' ? 'Tüm Tipler' : 'All Types'}</SelectItem>
                      <SelectItem value="purchase">{language === 'tr' ? 'Alış' : 'Purchase'}</SelectItem>
                      <SelectItem value="purchase_return">{language === 'tr' ? 'Alıştan İade' : 'Purchase Return'}</SelectItem>
                      <SelectItem value="devir">{language === 'tr' ? 'Devir' : 'Carry Forward'}</SelectItem>
                      <SelectItem value="devir_return">{language === 'tr' ? 'Devir İade' : 'Carry Fwd Return'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.expenses.invoiceNumber}</TableHead>
                      <TableHead>{language === 'tr' ? 'Tip' : 'Type'}</TableHead>
                      <TableHead>{t.expenses.supplier}</TableHead>
                      <TableHead>{t.expenses.invoiceDate}</TableHead>
                      <TableHead>{t.expenses.total}</TableHead>
                      <TableHead>{t.common.status}</TableHead>
                      <TableHead className="text-right">{t.common.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          {t.common.noData}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>
                            <Badge className={PURCHASE_TYPE_COLORS[invoice.invoice_type || 'purchase'] || 'bg-gray-100 text-gray-800'} variant="secondary">
                              {PURCHASE_TYPE_LABELS[invoice.invoice_type || 'purchase']?.[language] || (invoice.invoice_type || 'purchase')}
                            </Badge>
                          </TableCell>
                          <TableCell>{invoice.supplier?.company_title || invoice.supplier?.name}</TableCell>
                          <TableCell>{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="font-semibold">${Number(invoice.total_amount).toLocaleString()}</TableCell>
                          <TableCell>
                            {invoice.status === 'pending' && <Badge variant="outline">{t.expenses.pending}</Badge>}
                            {invoice.status === 'accepted' && <Badge className="bg-green-500">{t.expenses.accepted}</Badge>}
                            {invoice.status === 'rejected' && <Badge variant="destructive">{t.expenses.rejected}</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {invoice.status === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAcceptInvoice(invoice.id)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <CheckCircle2 size={16} className="mr-1" />
                                    {t.common.accepted}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRejectInvoice(invoice.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <XCircle size={16} className="mr-1" />
                                    {t.common.rejected}
                                  </Button>
                                </>
                              )}
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
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
      />
    </DashboardLayout>
  )
}
