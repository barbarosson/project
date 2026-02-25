'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { MetricCard } from '@/components/metric-card'
import { CashFlowChart } from '@/components/cash-flow-chart'
import { RecentActivity } from '@/components/recent-activity'
import { ProductTour } from '@/components/product-tour'
import { DollarSign, AlertCircle, Users, Package, TrendingUp, TrendingDown, Calendar, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useCurrency } from '@/hooks/use-currency'
import { useLanguage } from '@/contexts/language-context'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { LoadingSpinner } from '@/components/loading-spinner'

interface DashboardMetrics {
  totalRevenue: number
  draftRevenue: number
  confirmedRevenue: number
  totalExpenses: number
  periodIncome: number
  periodExpenses: number
  netProfit: number
  pendingPayments: number
  activeCustomers: number
  lowStockAlerts: number
  cashOnHand: number
  collectedCash: number
  invoicedTotal: number
}

interface DateRange {
  from: Date
  to: Date
}

interface CashFlowData {
  month: string
  income: number
  expenses: number
}

interface Activity {
  id: string
  type: 'payment' | 'customer' | 'inventory' | 'invoice'
  title: string
  description: string
  time: string
  status?: 'success' | 'warning' | 'info'
  link?: string
}

export default function Dashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const { tenantId, loading: tenantLoading } = useTenant()
  const { formatCurrency } = useCurrency()
  const { t, language } = useLanguage()
  const dateLocale = language === 'tr' ? tr : enUS
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    draftRevenue: 0,
    confirmedRevenue: 0,
    totalExpenses: 0,
    periodIncome: 0,
    periodExpenses: 0,
    netProfit: 0,
    pendingPayments: 0,
    activeCustomers: 0,
    lowStockAlerts: 0,
    cashOnHand: 0,
    collectedCash: 0,
    invoicedTotal: 0
  })
  const [cashFlowSourceInvoices, setCashFlowSourceInvoices] = useState<any[]>([])
  const [cashFlowSourceExpenses, setCashFlowSourceExpenses] = useState<any[]>([])
  const [cashFlowSourceTransactions, setCashFlowSourceTransactions] = useState<any[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [activityLimit, setActivityLimit] = useState(5)
  const [loading, setLoading] = useState(true)
  const [showProductTour, setShowProductTour] = useState(false)

  const chartStartMonth = format(dateRange.from, 'yyyy-MM')
  const chartEndMonth = format(dateRange.to, 'yyyy-MM')

  const cashFlowData = useMemo(
    () =>
      calculateCashFlow(
        cashFlowSourceInvoices,
        cashFlowSourceExpenses,
        cashFlowSourceTransactions,
        language,
        chartStartMonth,
        chartEndMonth
      ),
    [
      cashFlowSourceInvoices,
      cashFlowSourceExpenses,
      cashFlowSourceTransactions,
      language,
      chartStartMonth,
      chartEndMonth
    ]
  )

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchDashboardData()
      checkFirstTimeUser()
    } else if (!tenantLoading && !tenantId) {
      setLoading(false)
    }
  }, [tenantId, tenantLoading, dateRange, language])

  async function checkFirstTimeUser() {
    if (!user) return

    const tourShownKey = `product_tour_shown_${user.id}`
    const hasSeenTour = localStorage.getItem(tourShownKey)

    if (!hasSeenTour) {
      setTimeout(() => {
        setShowProductTour(true)
        localStorage.setItem(tourShownKey, 'true')
      }, 1000)
    }
  }

  async function fetchDashboardData() {
    if (!tenantId) {
      setLoading(false)
      return
    }

    try {
      const FETCH_TIMEOUT = 10000
      const startDate = format(dateRange.from, 'yyyy-MM-dd')
      const endDate = format(dateRange.to, 'yyyy-MM-dd')

      const fetchWithTimeout = Promise.race([
        Promise.all([
          supabase.from('customers').select('id, name, email, status, created_at').eq('tenant_id', tenantId),
          supabase.from('invoices').select('id, invoice_number, amount, total, paid_amount, remaining_amount, status, issue_date, payment_date, created_at').eq('tenant_id', tenantId),
          supabase.from('products').select('id, name, stock_quantity, min_stock_level, created_at').eq('tenant_id', tenantId),
          supabase.from('expenses').select('id, description, amount, expense_date, category, created_at').eq('tenant_id', tenantId),
          supabase.from('accounts').select('current_balance, is_active').eq('tenant_id', tenantId).eq('is_active', true),
          supabase.from('transactions').select('id, amount, transaction_type, transaction_date').eq('tenant_id', tenantId)
        ]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fetch timeout')), FETCH_TIMEOUT)
        )
      ])

      const [customersRes, invoicesRes, productsRes, expensesRes, accountsRes, transactionsRes] = await fetchWithTimeout as any[]

      const customers = customersRes?.data || []
      const allInvoices = invoicesRes?.data || []
      const products = productsRes?.data || []
      const allExpenses = expensesRes?.data || []
      const accounts = accountsRes?.data || []
      const allTransactions = Array.isArray(transactionsRes?.data) ? transactionsRes.data : []

      const filteredInvoices = allInvoices.filter((i: any) => {
        const issueDate = new Date(i.issue_date)
        return issueDate >= dateRange.from && issueDate <= dateRange.to
      })

      const filteredExpenses = allExpenses.filter((e: any) => {
        const expenseDate = new Date(e.expense_date)
        return expenseDate >= dateRange.from && expenseDate <= dateRange.to
      })

      const draftRevenue = filteredInvoices
        .filter((i: any) => i.status === 'draft')
        .reduce((sum: number, i: any) => sum + (Number(i.total) || 0), 0)

      const confirmedRevenue = filteredInvoices
        .filter((i: any) => ['sent', 'paid', 'overdue'].includes(i.status))
        .reduce((sum: number, i: any) => sum + (Number(i.total) || 0), 0)

      const totalRevenue = draftRevenue + confirmedRevenue

      const collectedCash = allInvoices
        .filter((i: any) => {
          if (i.status !== 'paid' || !i.payment_date) return false
          const paymentDate = new Date(i.payment_date)
          return paymentDate >= dateRange.from && paymentDate <= dateRange.to
        })
        .reduce((sum: number, i: any) => sum + (Number(i.total) || 0), 0)

      const totalExpenses = filteredExpenses
        .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0)

      const rangeStart = dateRange.from.getTime()
      const rangeEnd = dateRange.to.getTime()
      const inRange = (d: string | Date) => {
        const t = new Date(d).getTime()
        return t >= rangeStart && t <= rangeEnd
      }
      const transactionIncome = allTransactions
        .filter((tx: any) => tx.transaction_type === 'income' && tx.transaction_date && inRange(tx.transaction_date))
        .reduce((sum: number, tx: any) => sum + (Number(tx.amount) || 0), 0)
      const transactionExpense = allTransactions
        .filter((tx: any) => tx.transaction_type === 'expense' && tx.transaction_date && inRange(tx.transaction_date))
        .reduce((sum: number, tx: any) => sum + (Number(tx.amount) || 0), 0)
      const periodIncome = collectedCash + transactionIncome
      const periodExpenses = totalExpenses + transactionExpense
      const netProfit = periodIncome - periodExpenses

      const invoicedTotal = filteredInvoices.reduce(
        (sum: number, i: any) => sum + (Number(i.total) || Number(i.amount) || 0),
        0
      )

      const cashOnHand = accounts.reduce((sum: number, acc: any) => sum + (Number(acc.current_balance) || 0), 0)

      const activeCustomers = customers.filter((c: any) => c.status === 'active').length

      const pendingPayments = allInvoices
        .filter((i: any) => ['sent', 'overdue'].includes(i.status))
        .reduce((sum: number, i: any) => sum + (Number(i.remaining_amount) || Number(i.total) || 0), 0)

      const lowStockAlerts = products.filter(
        (item: any) => item.stock_quantity <= item.min_stock_level
      ).length

      setMetrics({
        totalRevenue,
        draftRevenue,
        confirmedRevenue,
        totalExpenses,
        periodIncome,
        periodExpenses,
        netProfit,
        pendingPayments,
        activeCustomers,
        lowStockAlerts,
        cashOnHand,
        collectedCash,
        invoicedTotal
      })

      setCashFlowSourceInvoices(allInvoices)
      setCashFlowSourceExpenses(allExpenses)
      setCashFlowSourceTransactions(allTransactions)

      const recentActivities = await generateActivities(tenantId, 50)
      setActivities(recentActivities)

      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
    }
  }

  function calculateCashFlow(
    invoices: any[],
    expenses: any[],
    transactions: any[],
    lang: 'tr' | 'en' = 'tr',
    startMonth?: string,
    endMonth?: string
  ): CashFlowData[] {
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {}
    const locale = lang === 'tr' ? 'tr-TR' : 'en-US'

    // Gelir: ödenmiş faturalar (tahsilat)
    ;(invoices || [])
      .filter((inv: any) => inv.status === 'paid')
      .forEach((invoice: any) => {
        const relevantDate = invoice.payment_date ? new Date(invoice.payment_date) : new Date(invoice.issue_date)
        const monthKey = `${relevantDate.getFullYear()}-${String(relevantDate.getMonth() + 1).padStart(2, '0')}`

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0 }
        }

        monthlyData[monthKey].income += Number(invoice.total) || Number(invoice.amount) || 0
      })

    // Gider: masraflar tablosu
    ;(expenses || [])
      .filter((expense: any) => expense.expense_date)
      .forEach((expense: any) => {
        const date = new Date(expense.expense_date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0 }
        }

        monthlyData[monthKey].expenses += Number(expense.amount) || 0
      })

    // Gelir/Gider: Tahsilat ve Ödeme İşlemleri (transactions)
    ;(transactions || [])
      .filter((tx: any) => tx.transaction_date && (tx.transaction_type === 'income' || tx.transaction_type === 'expense'))
      .forEach((tx: any) => {
        const date = new Date(tx.transaction_date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0 }
        }

        const amount = Number(tx.amount) || 0
        if (tx.transaction_type === 'income') {
          monthlyData[monthKey].income += amount
        } else {
          monthlyData[monthKey].expenses += amount
        }
      })

    const now = new Date()
    let fromDate: Date
    let toDate: Date
    if (startMonth && endMonth) {
      const [sy, sm] = startMonth.split('-').map(Number)
      const [ey, em] = endMonth.split('-').map(Number)
      fromDate = new Date(sy, sm - 1, 1)
      toDate = new Date(ey, em - 1, 1)
      if (fromDate > toDate) {
        const t = fromDate
        fromDate = toDate
        toDate = t
      }
    } else {
      toDate = new Date(now.getFullYear(), now.getMonth(), 1)
      fromDate = subMonths(toDate, 5)
    }

    const result: CashFlowData[] = []
    const cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1)
    while (cursor <= toDate) {
      const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
      result.push({
        month: cursor.toLocaleString(locale, { month: 'short', year: '2-digit' }),
        income: monthlyData[monthKey]?.income || 0,
        expenses: monthlyData[monthKey]?.expenses || 0
      })
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return result
  }

  async function generateActivities(tenantId: string, maxLimit: number = 50): Promise<Activity[]> {
    const activities: Activity[] = []

    try {
      const [invoicesRes, customersRes, productsRes, transactionsRes, ordersRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('id, invoice_number, amount, total, status, created_at, updated_at')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(maxLimit),
        supabase
          .from('customers')
          .select('id, name, company_title, created_at')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(maxLimit),
        supabase
          .from('products')
          .select('id, name, stock_quantity, min_stock_level')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('transactions')
          .select('id, amount, transaction_type, description, transaction_date, created_at')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(maxLimit)
          .then(r => r.data || []).catch(() => []),
        supabase
          .from('orders')
          .select('id, order_number, total, status, created_at')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(maxLimit)
          .then(r => r.data || []).catch(() => [])
      ])

      const recentInvoices = invoicesRes.data || []
      const recentCustomers = customersRes.data || []
      const allProducts = productsRes.data || []
      const recentTransactions = Array.isArray(transactionsRes) ? transactionsRes : []
      const recentOrders = Array.isArray(ordersRes) ? ordersRes : []
      const lowStockProducts = allProducts
        .filter((p: any) => p.min_stock_level != null && Number(p.stock_quantity) <= Number(p.min_stock_level))
        .slice(0, 3)

      const allActivities: Array<Activity & { timestamp: Date }> = []

      recentInvoices.forEach((invoice: any) => {
        const amount = Number(invoice.amount ?? invoice.total ?? 0)
        const date = new Date(invoice.updated_at || invoice.created_at)
        allActivities.push({
          id: `invoice-${invoice.id}`,
          type: 'invoice',
          title: invoice.status === 'paid' ? t.dashboard.paymentReceived : t.dashboard.invoiceCreated,
          description: `${t.common.invoice} ${invoice.invoice_number} - ${formatCurrency(amount)}`,
          time: getRelativeTime(date),
          timestamp: date,
          status: invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'warning' : 'info',
          link: `/invoices/${invoice.id}`
        })
      })

      recentTransactions.forEach((tx: any) => {
        const date = new Date(tx.transaction_date || tx.date || tx.created_at)
        const amount = Number(tx.amount || 0)
        const isIncome = (tx.transaction_type || tx.type) === 'income'
        allActivities.push({
          id: `tx-${tx.id}`,
          type: 'payment',
          title: isIncome ? t.dashboard.paymentReceived : (language === 'tr' ? 'Gider kaydı' : 'Expense recorded'),
          description: (tx.description || (isIncome ? 'Gelir' : 'Gider')) + ' - ' + formatCurrency(amount),
          time: getRelativeTime(date),
          timestamp: date,
          status: isIncome ? 'success' : 'warning',
          link: '/finance/transactions'
        })
      })

      recentOrders.forEach((order: any) => {
        const total = Number(order.total ?? 0)
        allActivities.push({
          id: `order-${order.id}`,
          type: 'invoice',
          title: language === 'tr' ? 'Sipariş oluşturuldu' : 'Order created',
          description: `${language === 'tr' ? 'Sipariş' : 'Order'} ${order.order_number || order.id?.slice(0, 8)} - ${formatCurrency(total)}`,
          time: getRelativeTime(new Date(order.created_at)),
          timestamp: new Date(order.created_at),
          status: 'info',
          link: '/orders'
        })
      })

      recentCustomers.forEach((customer: any) => {
        const displayName = customer.company_title || customer.name || '-'
        allActivities.push({
          id: `customer-${customer.id}`,
          type: 'customer',
          title: t.dashboard.newCustomer,
          description: t.dashboard.customerAdded.replace('{name}', displayName),
          time: getRelativeTime(new Date(customer.created_at)),
          timestamp: new Date(customer.created_at),
          status: 'info',
          link: '/customers'
        })
      })

      lowStockProducts.forEach((product: any) => {
        allActivities.push({
          id: `low-stock-${product.id}`,
          type: 'inventory',
          title: t.dashboard.lowStockAlert,
          description: t.dashboard.lowStockMessage
            .replace('{name}', product.name)
            .replace('{current}', String(product.stock_quantity))
            .replace('{min}', String(product.min_stock_level)),
          time: t.dashboard.justNow,
          timestamp: new Date(),
          status: 'warning',
          link: '/inventory'
        })
      })

      allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      return allActivities.slice(0, maxLimit).map(({ timestamp, ...activity }) => activity)
    } catch (error) {
      console.error('Error generating activities:', error)
      return []
    }
  }

  function getRelativeTime(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t.dashboard.justNow
    if (diffMins < 60) return t.dashboard.minutesAgo.replace('{count}', diffMins.toString())
    if (diffHours < 24) return t.dashboard.hoursAgo.replace('{count}', diffHours.toString())
    if (diffDays < 7) return t.dashboard.daysAgo.replace('{count}', diffDays.toString())
    return format(date, 'MMM dd')
  }

  if (loading || tenantLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner
            size="lg"
            text={t.dashboard.loadingDashboard}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.dashboard.title}</h1>
            <p className="text-gray-500 mt-1">{t.dashboard.welcomeMessage}</p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 !text-gray-900 !bg-white border-gray-300 hover:!bg-gray-50">
                <Calendar className="h-4 w-4" />
                {format(dateRange.from, 'MMM dd', { locale: dateLocale })} - {format(dateRange.to, 'MMM dd, yyyy', { locale: dateLocale })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">{t.dashboard.from}</p>
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                    locale={dateLocale}
                    initialFocus
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">{t.dashboard.to}</p>
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                    locale={dateLocale}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const now = new Date()
                      setDateRange({
                        from: startOfMonth(now),
                        to: endOfMonth(now)
                      })
                    }}
                  >
                    {t.dashboard.thisMonth}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const now = new Date()
                      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                      setDateRange({
                        from: startOfMonth(lastMonth),
                        to: endOfMonth(lastMonth)
                      })
                    }}
                  >
                    {t.dashboard.lastMonth}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title={t.dashboard.cashOnHand}
            value={formatCurrency(metrics.cashOnHand)}
            change={t.dashboard.allAccounts}
            changeType="positive"
            icon={Wallet}
            iconColor="bg-green-600"
            clickable
            onClick={() => router.push('/finance/accounts')}
          />
          <MetricCard
            title={t.dashboard.cashFlowIncome}
            value={formatCurrency(metrics.collectedCash)}
            change={language === 'tr'
              ? 'Dönemde tahsil edilen (ödeme tarihi dönem içindeki paid faturalar)'
              : 'Collected in period (paid invoices with payment date in range)'
            }
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-[#00D4AA]"
            clickable
            onClick={() => router.push('/finance/transactions')}
          />
          <MetricCard
            title={t.dashboard.invoicing}
            value={formatCurrency(metrics.invoicedTotal)}
            change={language === 'tr'
              ? `Dönemde kesilen faturalar: ${format(dateRange.from, 'dd MMM', { locale: dateLocale })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: dateLocale })}`
              : `Invoiced in period: ${format(dateRange.from, 'MMM dd', { locale: dateLocale })} - ${format(dateRange.to, 'MMM dd, yyyy', { locale: dateLocale })}`
            }
            changeType="neutral"
            icon={DollarSign}
            iconColor="bg-emerald-500"
            clickable
            onClick={() => router.push('/invoices')}
          />
          <MetricCard
            title={t.dashboard.cashFlowExpenses}
            value={formatCurrency(metrics.periodExpenses)}
            change={language === 'tr'
              ? `Seçilen dönem: ${format(dateRange.from, 'dd MMM', { locale: dateLocale })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: dateLocale })}`
              : `Selected period: ${format(dateRange.from, 'MMM dd', { locale: dateLocale })} - ${format(dateRange.to, 'MMM dd, yyyy', { locale: dateLocale })}`
            }
            changeType="neutral"
            icon={TrendingDown}
            iconColor="bg-red-500"
            clickable
            onClick={() => router.push('/expenses')}
          />
          <MetricCard
            title={t.dashboard.activeCustomers}
            value={metrics.activeCustomers}
            change={t.dashboard.activeAccounts}
            changeType="positive"
            icon={Users}
            iconColor="bg-blue-500"
            clickable
            onClick={() => router.push('/customers')}
          />
          <MetricCard
            title={t.dashboard.lowStockAlerts}
            value={metrics.lowStockAlerts}
            change={t.dashboard.requiresAttention}
            changeType="warning"
            icon={Package}
            iconColor="bg-red-500"
            clickable
            onClick={() => router.push('/inventory')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <CashFlowChart
              data={cashFlowData}
              periodLabel={language === 'tr'
                ? `${format(dateRange.from, 'dd MMM', { locale: dateLocale })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: dateLocale })}`
                : `${format(dateRange.from, 'MMM dd', { locale: dateLocale })} - ${format(dateRange.to, 'MMM dd, yyyy', { locale: dateLocale })}`
              }
            />
          </div>
          <div>
            <RecentActivity
              activities={activities.slice(0, activityLimit)}
              limit={activityLimit}
              onLimitChange={setActivityLimit}
            />
          </div>
        </div>
      </div>

      <ProductTour
        open={showProductTour}
        onClose={() => setShowProductTour(false)}
      />
    </DashboardLayout>
  )
}
