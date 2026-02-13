'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useTenant } from '@/hooks/use-tenant'
import { useCurrency } from '@/hooks/use-currency'
import { useLanguage } from '@/contexts/language-context'
import {
  Bot, RefreshCw, FileText, Wallet, Users, Package, Banknote,
  BarChart3, MessageSquare,
} from 'lucide-react'
import { generateFullReport, type FinanceRobotReport } from '@/lib/finance-robot'
import { OverallDashboard } from '@/components/finance-robot/overall-dashboard'
import { ModulePanel } from '@/components/finance-robot/module-panel'
import { RobotChat } from '@/components/finance-robot/robot-chat'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function FinanceRobotPage() {
  const { tenantId, loading: tenantLoading } = useTenant()
  const { formatCurrency } = useCurrency()
  const { language } = useLanguage()
  const [report, setReport] = useState<FinanceRobotReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['invoices', 'cashFlow']))
  const [activeTab, setActiveTab] = useState('chat')

  const tr = language === 'tr'

  const loadReport = useCallback(async () => {
    if (!tenantId) return
    try {
      const data = await generateFullReport(tenantId, formatCurrency)
      setReport(data)
    } catch (err) {
      console.error('Finance Robot error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [tenantId, formatCurrency])

  useEffect(() => {
    if (tenantId && !tenantLoading) {
      loadReport()
    }
  }, [tenantId, tenantLoading, loadReport])

  const handleRefresh = () => {
    setRefreshing(true)
    loadReport()
  }

  const toggleModule = (key: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const financialContext = useMemo(() => {
    if (!report) return undefined
    return {
      overallScore: report.overall.overallScore,
      netProfit: report.overall.netProfit,
      profitMargin: report.overall.profitMargin,
      cashOnHand: report.cashFlow.cashOnHand,
      netCashFlow: report.cashFlow.netCashFlow,
      totalRevenue: report.invoices.totalRevenue,
      totalExpenses: report.expenses.totalExpenses,
      overdueInvoices: report.invoices.overdueCount,
      lowStockProducts: report.inventory.lowStockCount,
      activeCustomers: report.customers.activeCustomers,
      atRiskCustomers: report.customers.atRiskCustomers,
      liquidityRatio: report.cashFlow.liquidityRatio,
      recommendations: report.overall.recommendations,
    }
  }, [report])

  if (loading || tenantLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0D1B2A] to-[#1a3a5c] flex items-center justify-center animate-pulse">
              <Bot className="text-[#B8E6FF]" size={36} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              {tr ? 'Finans Robotu Analiz Ediyor...' : 'Finance Robot Analyzing...'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {tr ? 'Tum moduller taranıyor' : 'Scanning all modules'}
            </p>
          </div>
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    )
  }

  if (!report) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Bot className="text-gray-300" size={48} />
          <p className="text-gray-500">{tr ? 'Rapor yuklenerken hata olustu' : 'Failed to load report'}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2" size={16} />
            {tr ? 'Tekrar Dene' : 'Retry'}
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const forecastData = report.cashFlow.forecast.map(f => ({
    month: f.month,
    inflow: f.predicted_in,
    outflow: f.predicted_out,
    balance: f.predicted_balance,
  }))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0D1B2A] to-[#1a3a5c]">
              <Bot className="text-[#B8E6FF]" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {tr ? 'Finans Robotu' : 'Finance Robot'}
              </h1>
              <p className="text-sm text-gray-500">
                {tr ? 'Yapay zeka destekli finansal analiz ve danismanlik' : 'AI-powered financial analysis and advisory'}
              </p>
            </div>
          </div>
          {activeTab === 'dashboard' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing
                ? (tr ? 'Analiz ediliyor...' : 'Analyzing...')
                : (tr ? 'Yenile' : 'Refresh')
              }
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare size={15} />
              {tr ? 'AI Chat' : 'AI Chat'}
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 size={15} />
              {tr ? 'Analiz Paneli' : 'Dashboard'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-4">
            {tenantId && (
              <RobotChat
                tenantId={tenantId}
                language={language as 'en' | 'tr'}
                financialContext={financialContext}
              />
            )}
          </TabsContent>

          <TabsContent value="dashboard" className="mt-4 space-y-6">
            <OverallDashboard report={report} formatCurrency={formatCurrency} />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-[#0D1B2A]" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {tr ? 'Modul Analizleri' : 'Module Analysis'}
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ModulePanel
                  title={tr ? 'Faturalar' : 'Invoices'}
                  icon={FileText}
                  health={report.invoices.health}
                  insights={report.invoices.insights}
                  expanded={expandedModules.has('invoices')}
                  onToggle={() => toggleModule('invoices')}
                  metrics={[
                    { label: tr ? 'Toplam Gelir' : 'Total Revenue', value: formatCurrency(report.invoices.totalRevenue) },
                    { label: tr ? 'Vadesi Gecmis' : 'Overdue', value: formatCurrency(report.invoices.overdueAmount), subtext: `${report.invoices.overdueCount} ${tr ? 'fatura' : 'invoices'}` },
                    { label: tr ? 'Ort. Tahsilat' : 'Avg Collection', value: `${report.invoices.avgCollectionDays}d` },
                    { label: tr ? 'Zamaninda Odeme' : 'On-Time Rate', value: `${report.invoices.paidOnTimeRate}%` },
                    { label: tr ? 'Onaylanan' : 'Confirmed', value: formatCurrency(report.invoices.confirmedRevenue) },
                    { label: tr ? 'Taslak' : 'Draft', value: formatCurrency(report.invoices.draftRevenue) },
                  ]}
                />

                <ModulePanel
                  title={tr ? 'Giderler' : 'Expenses'}
                  icon={Wallet}
                  health={report.expenses.health}
                  insights={report.expenses.insights}
                  expanded={expandedModules.has('expenses')}
                  onToggle={() => toggleModule('expenses')}
                  metrics={[
                    { label: tr ? 'Toplam Gider' : 'Total Expenses', value: formatCurrency(report.expenses.totalExpenses) },
                    { label: tr ? 'Gunluk Harcama' : 'Daily Burn', value: formatCurrency(Math.round(report.expenses.dailyBurnRate)) },
                    { label: tr ? 'Ay/Ay' : 'Month/Month', value: `${report.expenses.monthOverMonth > 0 ? '+' : ''}${report.expenses.monthOverMonth}%` },
                    { label: tr ? 'Odenmemis' : 'Unpaid', value: formatCurrency(report.expenses.unpaidExpenses) },
                    { label: tr ? 'En Cok' : 'Top Category', value: report.expenses.topCategory },
                    { label: tr ? 'Kategori' : 'Categories', value: String(report.expenses.byCategory.length) },
                  ]}
                />

                <ModulePanel
                  title={tr ? 'Musteriler' : 'Customers'}
                  icon={Users}
                  health={report.customers.health}
                  insights={report.customers.insights}
                  expanded={expandedModules.has('customers')}
                  onToggle={() => toggleModule('customers')}
                  metrics={[
                    { label: tr ? 'Toplam' : 'Total', value: String(report.customers.totalCustomers) },
                    { label: tr ? 'Aktif' : 'Active', value: String(report.customers.activeCustomers) },
                    { label: tr ? 'Risk Altinda' : 'At Risk', value: String(report.customers.atRiskCustomers) },
                    { label: tr ? 'Ort. Gelir' : 'Avg Revenue', value: formatCurrency(Math.round(report.customers.avgRevenuePerCustomer)) },
                    { label: tr ? 'Kayip Riski' : 'Churn Risk', value: `${report.customers.churnRisk}%` },
                    { label: tr ? 'En Iyi' : 'Top Customer', value: report.customers.topCustomers[0]?.name || '-' },
                  ]}
                />

                <ModulePanel
                  title={tr ? 'Envanter' : 'Inventory'}
                  icon={Package}
                  health={report.inventory.health}
                  insights={report.inventory.insights}
                  expanded={expandedModules.has('inventory')}
                  onToggle={() => toggleModule('inventory')}
                  metrics={[
                    { label: tr ? 'Toplam Urun' : 'Products', value: String(report.inventory.totalProducts) },
                    { label: tr ? 'Dusuk Stok' : 'Low Stock', value: String(report.inventory.lowStockCount) },
                    { label: tr ? 'Stoksuz' : 'Out of Stock', value: String(report.inventory.outOfStockCount) },
                    { label: tr ? 'Envanter Degeri' : 'Inventory Value', value: formatCurrency(report.inventory.totalValue) },
                    { label: tr ? 'Devir Hizi' : 'Turnover', value: String(report.inventory.turnoverRate) },
                    { label: tr ? 'Olii Stok' : 'Dead Stock', value: String(report.inventory.deadStock) },
                  ]}
                />
              </div>
            </div>

            <ModulePanel
              title={tr ? 'Nakit Akisi' : 'Cash Flow'}
              icon={Banknote}
              health={report.cashFlow.health}
              insights={report.cashFlow.insights}
              expanded={expandedModules.has('cashFlow')}
              onToggle={() => toggleModule('cashFlow')}
              metrics={[
                { label: tr ? 'Eldeki Nakit' : 'Cash on Hand', value: formatCurrency(report.cashFlow.cashOnHand) },
                { label: tr ? 'Giris (30g)' : 'Inflow (30d)', value: formatCurrency(report.cashFlow.totalInflow) },
                { label: tr ? 'Cikis (30g)' : 'Outflow (30d)', value: formatCurrency(report.cashFlow.totalOutflow) },
                { label: tr ? 'Net Akis' : 'Net Flow', value: formatCurrency(report.cashFlow.netCashFlow) },
                { label: tr ? 'Likidite' : 'Liquidity', value: String(report.cashFlow.liquidityRatio) },
                { label: tr ? 'Hesaplar' : 'Accounts', value: String(report.cashFlow.accountBalances.length) },
              ]}
            />

            {forecastData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Banknote size={18} className="text-[#0D1B2A]" />
                    <CardTitle className="text-base">
                      {tr ? '3 Aylik Nakit Akisi Tahmini' : '3-Month Cash Flow Forecast'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2ECC71" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2ECC71" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E74C3C" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#E74C3C" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0D1B2A" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#0D1B2A" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Area type="monotone" dataKey="inflow" stroke="#2ECC71" fill="url(#colorInflow)" strokeWidth={2} name={tr ? 'Giris' : 'Inflow'} />
                        <Area type="monotone" dataKey="outflow" stroke="#E74C3C" fill="url(#colorOutflow)" strokeWidth={2} name={tr ? 'Cikis' : 'Outflow'} />
                        <Area type="monotone" dataKey="balance" stroke="#0D1B2A" fill="url(#colorBalance)" strokeWidth={2} name={tr ? 'Bakiye' : 'Balance'} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#2ECC71]" />
                      <span className="text-xs text-gray-600">{tr ? 'Tahmini Giris' : 'Predicted Inflow'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#E74C3C]" />
                      <span className="text-xs text-gray-600">{tr ? 'Tahmini Cikis' : 'Predicted Outflow'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#0D1B2A]" />
                      <span className="text-xs text-gray-600">{tr ? 'Tahmini Bakiye' : 'Predicted Balance'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-center py-4">
              <p className="text-xs text-gray-400">
                {tr ? 'Rapor olusturulma: ' : 'Report generated: '}{new Date(report.generatedAt).toLocaleString(tr ? 'tr-TR' : 'en-US')}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
