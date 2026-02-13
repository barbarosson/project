import { supabase } from '@/lib/supabase'

export interface ModuleHealth {
  score: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
}

export interface ModuleInsight {
  type: 'success' | 'warning' | 'danger' | 'info'
  title: string
  description: string
  metric?: string
  action?: string
}

export interface CashFlowForecast {
  month: string
  predicted_in: number
  predicted_out: number
  predicted_balance: number
  confidence: number
}

export interface InvoiceAnalysis {
  health: ModuleHealth
  insights: ModuleInsight[]
  totalRevenue: number
  confirmedRevenue: number
  draftRevenue: number
  overdueAmount: number
  overdueCount: number
  avgCollectionDays: number
  paidOnTimeRate: number
  topDebtors: { name: string; amount: number }[]
}

export interface ExpenseAnalysis {
  health: ModuleHealth
  insights: ModuleInsight[]
  totalExpenses: number
  byCategory: { category: string; amount: number; percentage: number }[]
  monthOverMonth: number
  dailyBurnRate: number
  unpaidExpenses: number
  topCategory: string
}

export interface CustomerAnalysis {
  health: ModuleHealth
  insights: ModuleInsight[]
  totalCustomers: number
  activeCustomers: number
  atRiskCustomers: number
  avgRevenuePerCustomer: number
  topCustomers: { name: string; revenue: number }[]
  churnRisk: number
}

export interface InventoryAnalysis {
  health: ModuleHealth
  insights: ModuleInsight[]
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  totalValue: number
  turnoverRate: number
  deadStock: number
}

export interface CashFlowAnalysis {
  health: ModuleHealth
  insights: ModuleInsight[]
  cashOnHand: number
  totalInflow: number
  totalOutflow: number
  netCashFlow: number
  liquidityRatio: number
  forecast: CashFlowForecast[]
  accountBalances: { name: string; balance: number; type: string }[]
}

export interface OverallAnalysis {
  overallScore: number
  overallStatus: 'excellent' | 'good' | 'warning' | 'critical'
  keyFindings: ModuleInsight[]
  recommendations: string[]
  profitMargin: number
  netProfit: number
}

export interface FinanceRobotReport {
  invoices: InvoiceAnalysis
  expenses: ExpenseAnalysis
  customers: CustomerAnalysis
  inventory: InventoryAnalysis
  cashFlow: CashFlowAnalysis
  overall: OverallAnalysis
  generatedAt: string
}

function getHealthStatus(score: number): ModuleHealth['status'] {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'warning'
  return 'critical'
}

function getTrend(current: number, previous: number): ModuleHealth['trend'] {
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0
  if (change > 5) return 'up'
  if (change < -5) return 'down'
  return 'stable'
}

export async function analyzeInvoices(tenantId: string, formatCurrency: (n: number) => string): Promise<InvoiceAnalysis> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, amount, status, due_date, paid_date, paid_amount, remaining_amount, created_at, customer_id, customers(name)')
    .eq('tenant_id', tenantId)

  const allInvoices = invoices || []
  const recent = allInvoices.filter(i => new Date(i.created_at) >= thirtyDaysAgo)
  const previous = allInvoices.filter(i => new Date(i.created_at) >= sixtyDaysAgo && new Date(i.created_at) < thirtyDaysAgo)

  const totalRevenue = allInvoices.reduce((s, i) => s + Number(i.amount || 0), 0)
  const confirmedRevenue = allInvoices.filter(i => ['sent', 'paid', 'overdue'].includes(i.status)).reduce((s, i) => s + Number(i.amount || 0), 0)
  const draftRevenue = allInvoices.filter(i => i.status === 'draft').reduce((s, i) => s + Number(i.amount || 0), 0)

  const overdueInvoices = allInvoices.filter(i => i.status === 'overdue' || (i.status === 'pending' && i.due_date && new Date(i.due_date) < now))
  const overdueAmount = overdueInvoices.reduce((s, i) => s + Number(i.remaining_amount || i.amount || 0), 0)

  const paidInvoices = allInvoices.filter(i => i.status === 'paid' && i.paid_date)
  const paidOnTimeCount = paidInvoices.filter(i => i.due_date && new Date(i.paid_date!) <= new Date(i.due_date)).length

  const collectionDays = paidInvoices.length > 0
    ? paidInvoices.reduce((s, i) => {
        const created = new Date(i.created_at)
        const paid = new Date(i.paid_date!)
        return s + (paid.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      }, 0) / paidInvoices.length
    : 0

  const debtorMap = new Map<string, { name: string; amount: number }>()
  overdueInvoices.forEach(i => {
    const name = (i.customers as any)?.name || 'Unknown'
    const existing = debtorMap.get(name) || { name, amount: 0 }
    existing.amount += Number(i.remaining_amount || i.amount || 0)
    debtorMap.set(name, existing)
  })
  const topDebtors = Array.from(debtorMap.values()).sort((a, b) => b.amount - a.amount).slice(0, 5)

  const recentTotal = recent.reduce((s, i) => s + Number(i.amount || 0), 0)
  const previousTotal = previous.reduce((s, i) => s + Number(i.amount || 0), 0)

  let score = 70
  if (overdueInvoices.length > allInvoices.length * 0.3) score -= 20
  else if (overdueInvoices.length > allInvoices.length * 0.1) score -= 10
  if (collectionDays > 60) score -= 15
  else if (collectionDays > 45) score -= 5
  if (paidOnTimeCount / Math.max(paidInvoices.length, 1) > 0.8) score += 15
  if (recentTotal > previousTotal) score += 10
  score = Math.max(0, Math.min(100, score))

  const insights: ModuleInsight[] = []

  if (overdueInvoices.length > 0) {
    insights.push({
      type: overdueInvoices.length > 5 ? 'danger' : 'warning',
      title: `${overdueInvoices.length} Overdue Invoice`,
      description: `Total overdue: ${formatCurrency(overdueAmount)}. Average collection: ${Math.round(collectionDays)} days.`,
      metric: formatCurrency(overdueAmount),
      action: 'Review overdue invoices and follow up with customers',
    })
  }

  if (draftRevenue > 0) {
    insights.push({
      type: 'info',
      title: 'Draft Invoices Pending',
      description: `${formatCurrency(draftRevenue)} in draft invoices waiting to be sent.`,
      metric: formatCurrency(draftRevenue),
    })
  }

  if (recentTotal > previousTotal * 1.1) {
    insights.push({
      type: 'success',
      title: 'Revenue Growing',
      description: `Revenue increased ${previousTotal > 0 ? Math.round(((recentTotal - previousTotal) / previousTotal) * 100) : 100}% vs previous period.`,
      metric: `+${Math.round(((recentTotal - previousTotal) / Math.max(previousTotal, 1)) * 100)}%`,
    })
  } else if (recentTotal < previousTotal * 0.9 && previousTotal > 0) {
    insights.push({
      type: 'warning',
      title: 'Revenue Declining',
      description: `Revenue decreased ${Math.round(((previousTotal - recentTotal) / previousTotal) * 100)}% vs previous period.`,
      metric: `-${Math.round(((previousTotal - recentTotal) / previousTotal) * 100)}%`,
    })
  }

  if (paidInvoices.length > 0 && paidOnTimeCount / paidInvoices.length >= 0.8) {
    insights.push({
      type: 'success',
      title: 'Strong Collection Rate',
      description: `${Math.round((paidOnTimeCount / paidInvoices.length) * 100)}% of invoices paid on time.`,
    })
  }

  return {
    health: { score, status: getHealthStatus(score), trend: getTrend(recentTotal, previousTotal) },
    insights,
    totalRevenue,
    confirmedRevenue,
    draftRevenue,
    overdueAmount,
    overdueCount: overdueInvoices.length,
    avgCollectionDays: Math.round(collectionDays),
    paidOnTimeRate: paidInvoices.length > 0 ? Math.round((paidOnTimeCount / paidInvoices.length) * 100) : 100,
    topDebtors,
  }
}

export async function analyzeExpenses(tenantId: string, formatCurrency: (n: number) => string): Promise<ExpenseAnalysis> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('tenant_id', tenantId)

  const allExpenses = expenses || []
  const recent = allExpenses.filter(e => new Date(e.expense_date) >= thirtyDaysAgo)
  const previous = allExpenses.filter(e => new Date(e.expense_date) >= sixtyDaysAgo && new Date(e.expense_date) < thirtyDaysAgo)

  const totalExpenses = allExpenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const recentTotal = recent.reduce((s, e) => s + Number(e.amount || 0), 0)
  const previousTotal = previous.reduce((s, e) => s + Number(e.amount || 0), 0)

  const categoryMap = new Map<string, number>()
  allExpenses.forEach(e => {
    const cat = e.category || 'other'
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(e.amount || 0))
  })

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  const monthOverMonth = previousTotal > 0 ? Math.round(((recentTotal - previousTotal) / previousTotal) * 100) : 0
  const dailyBurnRate = recentTotal / 30
  const unpaidExpenses = allExpenses.filter(e => e.status === 'unpaid' || e.status === 'partially_paid').reduce((s, e) => s + Number(e.remaining_amount || e.amount || 0), 0)

  let score = 75
  if (monthOverMonth > 20) score -= 15
  if (monthOverMonth > 50) score -= 15
  if (unpaidExpenses > totalExpenses * 0.3) score -= 10
  if (recentTotal < previousTotal) score += 10
  score = Math.max(0, Math.min(100, score))

  const insights: ModuleInsight[] = []

  if (monthOverMonth > 20) {
    insights.push({
      type: 'warning',
      title: 'Expense Spike',
      description: `Expenses increased ${monthOverMonth}% compared to last month.`,
      metric: `+${monthOverMonth}%`,
      action: 'Review recent expenses for unusual spending patterns',
    })
  } else if (monthOverMonth < -10) {
    insights.push({
      type: 'success',
      title: 'Expenses Reduced',
      description: `Expenses decreased ${Math.abs(monthOverMonth)}% compared to last month.`,
      metric: `${monthOverMonth}%`,
    })
  }

  if (byCategory.length > 0) {
    const top = byCategory[0]
    insights.push({
      type: 'info',
      title: `Top Category: ${top.category}`,
      description: `${top.category} accounts for ${top.percentage}% of total expenses (${formatCurrency(top.amount)}).`,
      metric: `${top.percentage}%`,
    })
  }

  if (unpaidExpenses > 0) {
    insights.push({
      type: 'warning',
      title: 'Unpaid Expenses',
      description: `You have ${formatCurrency(unpaidExpenses)} in unpaid expenses.`,
      metric: formatCurrency(unpaidExpenses),
      action: 'Process pending expense payments',
    })
  }

  return {
    health: { score, status: getHealthStatus(score), trend: getTrend(previousTotal, recentTotal) },
    insights,
    totalExpenses,
    byCategory,
    monthOverMonth,
    dailyBurnRate,
    unpaidExpenses,
    topCategory: byCategory[0]?.category || 'N/A',
  }
}

export async function analyzeCustomers(tenantId: string, formatCurrency: (n: number) => string): Promise<CustomerAnalysis> {
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, status, total_revenue, created_at')
    .eq('tenant_id', tenantId)

  const { data: invoices } = await supabase
    .from('invoices')
    .select('customer_id, amount, status, created_at')
    .eq('tenant_id', tenantId)

  const allCustomers = customers || []
  const allInvoices = invoices || []

  const totalCustomers = allCustomers.length
  const activeCustomers = allCustomers.filter(c => c.status === 'active').length
  const totalRevenue = allCustomers.reduce((s, c) => s + Number(c.total_revenue || 0), 0)
  const avgRevenuePerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0

  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  const customerLastActivity = new Map<string, Date>()
  allInvoices.forEach(i => {
    const date = new Date(i.created_at)
    const existing = customerLastActivity.get(i.customer_id)
    if (!existing || date > existing) {
      customerLastActivity.set(i.customer_id, date)
    }
  })

  const atRiskCustomers = allCustomers.filter(c => {
    const lastActivity = customerLastActivity.get(c.id)
    return c.status === 'active' && (!lastActivity || lastActivity < sixtyDaysAgo)
  }).length

  const topCustomers = [...allCustomers]
    .sort((a, b) => Number(b.total_revenue || 0) - Number(a.total_revenue || 0))
    .slice(0, 5)
    .map(c => ({ name: c.name, revenue: Number(c.total_revenue || 0) }))

  const churnRisk = activeCustomers > 0 ? Math.round((atRiskCustomers / activeCustomers) * 100) : 0

  let score = 70
  if (churnRisk > 30) score -= 20
  else if (churnRisk > 15) score -= 10
  if (activeCustomers / Math.max(totalCustomers, 1) > 0.8) score += 15
  if (avgRevenuePerCustomer > 1000) score += 10
  score = Math.max(0, Math.min(100, score))

  const insights: ModuleInsight[] = []

  if (atRiskCustomers > 0) {
    insights.push({
      type: atRiskCustomers > 5 ? 'danger' : 'warning',
      title: `${atRiskCustomers} At-Risk Customers`,
      description: `These customers haven't placed orders in 60+ days. ${churnRisk}% churn risk.`,
      metric: `${churnRisk}%`,
      action: 'Launch re-engagement campaign for at-risk customers',
    })
  }

  if (topCustomers.length > 0 && topCustomers[0].revenue > totalRevenue * 0.4) {
    insights.push({
      type: 'warning',
      title: 'Revenue Concentration',
      description: `${topCustomers[0].name} accounts for ${Math.round((topCustomers[0].revenue / Math.max(totalRevenue, 1)) * 100)}% of total revenue. Consider diversifying.`,
      action: 'Diversify revenue sources to reduce dependency',
    })
  }

  if (activeCustomers > totalCustomers * 0.8) {
    insights.push({
      type: 'success',
      title: 'High Activity Rate',
      description: `${Math.round((activeCustomers / Math.max(totalCustomers, 1)) * 100)}% of customers are active.`,
    })
  }

  return {
    health: { score, status: getHealthStatus(score), trend: churnRisk > 20 ? 'down' : 'up' },
    insights,
    totalCustomers,
    activeCustomers,
    atRiskCustomers,
    avgRevenuePerCustomer,
    topCustomers,
    churnRisk,
  }
}

export async function analyzeInventory(tenantId: string, formatCurrency: (n: number) => string): Promise<InventoryAnalysis> {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, current_stock, critical_level, sale_price, total_sold, stock_status')
    .eq('tenant_id', tenantId)

  const allProducts = products || []
  const totalProducts = allProducts.length
  const lowStockCount = allProducts.filter(p => p.stock_status === 'low_stock').length
  const outOfStockCount = allProducts.filter(p => p.stock_status === 'out_of_stock' || Number(p.current_stock || 0) === 0).length
  const totalValue = allProducts.reduce((s, p) => s + Number(p.current_stock || 0) * Number(p.sale_price || 0), 0)
  const totalSold = allProducts.reduce((s, p) => s + Number(p.total_sold || 0), 0)
  const totalStock = allProducts.reduce((s, p) => s + Number(p.current_stock || 0), 0)
  const turnoverRate = totalStock > 0 ? totalSold / totalStock : 0
  const deadStock = allProducts.filter(p => Number(p.total_sold || 0) === 0 && Number(p.current_stock || 0) > 0).length

  let score = 75
  if (outOfStockCount > totalProducts * 0.2) score -= 20
  else if (outOfStockCount > 0) score -= 10
  if (lowStockCount > totalProducts * 0.3) score -= 10
  if (deadStock > totalProducts * 0.2) score -= 10
  if (turnoverRate > 1) score += 10
  score = Math.max(0, Math.min(100, score))

  const insights: ModuleInsight[] = []

  if (outOfStockCount > 0) {
    insights.push({
      type: 'danger',
      title: `${outOfStockCount} Out of Stock`,
      description: `${outOfStockCount} products are out of stock. Revenue loss risk.`,
      metric: String(outOfStockCount),
      action: 'Reorder out-of-stock products immediately',
    })
  }

  if (lowStockCount > 0) {
    insights.push({
      type: 'warning',
      title: `${lowStockCount} Low Stock`,
      description: `${lowStockCount} products are below critical level.`,
      metric: String(lowStockCount),
      action: 'Plan reorders for low stock items',
    })
  }

  if (deadStock > 0) {
    insights.push({
      type: 'info',
      title: `${deadStock} Dead Stock Items`,
      description: `${deadStock} products have never been sold. Consider promotions or clearance.`,
      action: 'Run promotions or clearance sales',
    })
  }

  insights.push({
    type: 'info',
    title: 'Inventory Value',
    description: `Total inventory value: ${formatCurrency(totalValue)}.`,
    metric: formatCurrency(totalValue),
  })

  return {
    health: { score, status: getHealthStatus(score), trend: outOfStockCount > lowStockCount ? 'down' : 'stable' },
    insights,
    totalProducts,
    lowStockCount,
    outOfStockCount,
    totalValue,
    turnoverRate: Math.round(turnoverRate * 100) / 100,
    deadStock,
  }
}

export async function analyzeCashFlow(tenantId: string, formatCurrency: (n: number) => string): Promise<CashFlowAnalysis> {
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, type, current_balance, opening_balance, is_active')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, transaction_type, amount, transaction_date, account_id')
    .eq('tenant_id', tenantId)
    .order('transaction_date', { ascending: true })

  const allAccounts = accounts || []
  const allTransactions = transactions || []

  const cashOnHand = allAccounts.reduce((s, a) => s + Number(a.current_balance || 0), 0)
  const accountBalances = allAccounts.map(a => ({
    name: a.name,
    balance: Number(a.current_balance || 0),
    type: a.type,
  }))

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const recentTransactions = allTransactions.filter(t => new Date(t.transaction_date) >= thirtyDaysAgo)

  const totalInflow = recentTransactions.filter(t => t.transaction_type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0)
  const totalOutflow = recentTransactions.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0)
  const netCashFlow = totalInflow - totalOutflow
  const liquidityRatio = totalOutflow > 0 ? cashOnHand / (totalOutflow / 30 * 90) : 10

  const monthlyData = new Map<string, { inflow: number; outflow: number }>()
  allTransactions.forEach(t => {
    const month = t.transaction_date.substring(0, 7)
    const existing = monthlyData.get(month) || { inflow: 0, outflow: 0 }
    if (t.transaction_type === 'income') existing.inflow += Number(t.amount || 0)
    else existing.outflow += Number(t.amount || 0)
    monthlyData.set(month, existing)
  })

  const months = Array.from(monthlyData.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  const lastThreeMonths = months.slice(-3)

  const avgIn = lastThreeMonths.length > 0 ? lastThreeMonths.reduce((s, [, d]) => s + d.inflow, 0) / lastThreeMonths.length : totalInflow
  const avgOut = lastThreeMonths.length > 0 ? lastThreeMonths.reduce((s, [, d]) => s + d.outflow, 0) / lastThreeMonths.length : totalOutflow

  const forecast: CashFlowForecast[] = []
  let runningBalance = cashOnHand
  for (let i = 1; i <= 3; i++) {
    const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const monthStr = forecastDate.toISOString().substring(0, 7)
    const growthFactor = 1 + (i * 0.02)
    const predictedIn = avgIn * growthFactor
    const predictedOut = avgOut * (1 + (i * 0.01))
    runningBalance += predictedIn - predictedOut

    forecast.push({
      month: monthStr,
      predicted_in: Math.round(predictedIn),
      predicted_out: Math.round(predictedOut),
      predicted_balance: Math.round(runningBalance),
      confidence: Math.max(60, 95 - (i * 10)),
    })
  }

  let score = 70
  if (netCashFlow > 0) score += 15
  else if (netCashFlow < 0) score -= 20
  if (liquidityRatio > 2) score += 10
  else if (liquidityRatio < 1) score -= 15
  if (cashOnHand <= 0) score -= 25
  score = Math.max(0, Math.min(100, score))

  const insights: ModuleInsight[] = []

  if (netCashFlow < 0) {
    insights.push({
      type: 'danger',
      title: 'Negative Cash Flow',
      description: `Net cash flow is ${formatCurrency(netCashFlow)} for the last 30 days. Outflows exceed inflows.`,
      metric: formatCurrency(netCashFlow),
      action: 'Review expenses and accelerate receivable collections',
    })
  } else {
    insights.push({
      type: 'success',
      title: 'Positive Cash Flow',
      description: `Net cash flow is +${formatCurrency(netCashFlow)} for the last 30 days.`,
      metric: formatCurrency(netCashFlow),
    })
  }

  if (liquidityRatio < 1) {
    insights.push({
      type: 'danger',
      title: 'Low Liquidity',
      description: `Liquidity ratio: ${liquidityRatio.toFixed(2)}. Cash reserves won't cover 3 months of expenses.`,
      metric: liquidityRatio.toFixed(2),
      action: 'Build cash reserves or secure credit lines',
    })
  }

  const negativeForecasts = forecast.filter(f => f.predicted_balance < 0)
  if (negativeForecasts.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Cash Deficit Forecast',
      description: `Projected cash deficit in ${negativeForecasts[0].month}. Plan ahead.`,
      action: 'Prepare contingency funding or adjust spending',
    })
  }

  return {
    health: { score, status: getHealthStatus(score), trend: netCashFlow >= 0 ? 'up' : 'down' },
    insights,
    cashOnHand,
    totalInflow,
    totalOutflow,
    netCashFlow,
    liquidityRatio: Math.round(liquidityRatio * 100) / 100,
    forecast,
    accountBalances,
  }
}

export interface AIRecommendation {
  category: string
  title: string
  description: string
  implementationSteps: string[]
  expectedImpact: {
    cashSaved?: number
    efficiencyImproved?: number
    riskReduced?: number
  }
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH'
  confidence: number
  source: 'ai' | 'rule-based'
}

export interface ScenarioAnalysis {
  scenario: string
  analysis: string
  timestamp: string
}

export async function getAIRecommendations(
  metrics: {
    netCashFlow: number
    receivablesDays: number
    payablesDays: number
    quickRatio: number
    cashConversionCycle: number
    operatingCashFlowRatio: number
  },
  risks: Array<{ type: string; severity: string; description: string }>,
  language: 'en' | 'tr' = 'en'
): Promise<AIRecommendation[]> {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/finance-robot-ai`
    const headers = {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'generate_recommendations',
        metrics,
        risks,
        language,
      }),
    })

    if (!response.ok) {
      console.error('AI recommendations failed:', response.status)
      return []
    }

    const data = await response.json()
    return data.recommendations.map((r: any) => ({ ...r, source: 'ai' as const }))
  } catch (error) {
    console.error('Error fetching AI recommendations:', error)
    return []
  }
}

export async function analyzeScenario(
  scenario: string,
  context?: {
    revenue?: number
    expenses?: number
    cashOnHand?: number
    customers?: number
    industry?: string
  }
): Promise<ScenarioAnalysis | null> {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/finance-robot-ai`
    const headers = {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'analyze_scenario',
        scenario,
        context,
      }),
    })

    if (!response.ok) {
      console.error('Scenario analysis failed:', response.status)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error analyzing scenario:', error)
    return null
  }
}

export async function generateFullReport(tenantId: string, formatCurrency: (n: number) => string): Promise<FinanceRobotReport> {
  const [invoices, expenses, customers, inventory, cashFlow] = await Promise.all([
    analyzeInvoices(tenantId, formatCurrency),
    analyzeExpenses(tenantId, formatCurrency),
    analyzeCustomers(tenantId, formatCurrency),
    analyzeInventory(tenantId, formatCurrency),
    analyzeCashFlow(tenantId, formatCurrency),
  ])

  const netProfit = invoices.confirmedRevenue - expenses.totalExpenses
  const profitMargin = invoices.confirmedRevenue > 0
    ? Math.round((netProfit / invoices.confirmedRevenue) * 100)
    : 0

  const moduleScores = [
    invoices.health.score,
    expenses.health.score,
    customers.health.score,
    inventory.health.score,
    cashFlow.health.score,
  ]
  const overallScore = Math.round(moduleScores.reduce((a, b) => a + b, 0) / moduleScores.length)

  const keyFindings: ModuleInsight[] = []
  const allInsights = [
    ...invoices.insights,
    ...expenses.insights,
    ...customers.insights,
    ...inventory.insights,
    ...cashFlow.insights,
  ]

  const dangerInsights = allInsights.filter(i => i.type === 'danger')
  const warningInsights = allInsights.filter(i => i.type === 'warning')
  const successInsights = allInsights.filter(i => i.type === 'success')

  keyFindings.push(...dangerInsights.slice(0, 3))
  keyFindings.push(...warningInsights.slice(0, 3))
  keyFindings.push(...successInsights.slice(0, 2))

  const recommendations: string[] = []

  if (invoices.overdueCount > 0) {
    recommendations.push(`Follow up on ${invoices.overdueCount} overdue invoices (${formatCurrency(invoices.overdueAmount)})`)
  }
  if (customers.atRiskCustomers > 0) {
    recommendations.push(`Re-engage ${customers.atRiskCustomers} at-risk customers to prevent churn`)
  }
  if (inventory.outOfStockCount > 0) {
    recommendations.push(`Restock ${inventory.outOfStockCount} out-of-stock products to avoid lost sales`)
  }
  if (cashFlow.netCashFlow < 0) {
    recommendations.push('Address negative cash flow by cutting expenses or accelerating collections')
  }
  if (profitMargin < 10 && profitMargin >= 0) {
    recommendations.push('Improve profit margin through pricing optimization or cost reduction')
  }
  if (profitMargin < 0) {
    recommendations.push('Critical: Business is operating at a loss. Immediate cost review needed')
  }
  if (expenses.monthOverMonth > 20) {
    recommendations.push('Investigate recent expense spike and implement budget controls')
  }

  return {
    invoices,
    expenses,
    customers,
    inventory,
    cashFlow,
    overall: {
      overallScore,
      overallStatus: getHealthStatus(overallScore),
      keyFindings,
      recommendations,
      profitMargin,
      netProfit,
    },
    generatedAt: new Date().toISOString(),
  }
}
