'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  Users,
  DollarSign,
  Send,
  Bot,
  Lightbulb,
  Target,
  ShoppingCart
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'

interface Insight {
  id: string
  type: 'success' | 'warning' | 'info' | 'danger'
  icon: any
  title: string
  description: string
  action?: string
  metric?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Thread {
  id: string
  title: string
  updated_at: string
}

export default function AIInsightsPage() {
  const { tenantId, loading: tenantLoading } = useTenant()
  const { t } = useLanguage()
  const [insights, setInsights] = useState<Insight[]>([])
  const [cashFlowData, setCashFlowData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [threads, setThreads] = useState<Thread[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      generateInsights()
      generateCashFlowPrediction()
      loadThreads()
    }
  }, [tenantId, tenantLoading])

  useEffect(() => {
    if (currentThreadId && tenantId) {
      loadThreadHistory(currentThreadId)
    }
  }, [currentThreadId, tenantId])

  async function generateInsights() {
    if (!tenantId) return

    try {
      const insights: Insight[] = []

      const { data: products } = await supabase
        .from('products')
        .select('name, current_stock, critical_level, stock_status, total_sold')
        .eq('tenant_id', tenantId)

      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, total_revenue')
        .eq('tenant_id', tenantId)

      const { data: invoices } = await supabase
        .from('invoices')
        .select('total, status, created_at')
        .eq('tenant_id', tenantId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      const { data: proposals } = await supabase
        .from('proposals')
        .select('total, status')
        .eq('tenant_id', tenantId)

      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, expense_date, category')
        .eq('tenant_id', tenantId)
        .gte('expense_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      const { data: purchaseInvoices } = await supabase
        .from('purchase_invoices')
        .select('total_amount, invoice_date, status')
        .eq('tenant_id', tenantId)
        .gte('invoice_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (products) {
        const lowStockProducts = products.filter((p: any) => p.stock_status === 'low_stock')
        const outOfStockProducts = products.filter((p: any) => p.stock_status === 'out_of_stock')

        if (lowStockProducts.length > 0) {
          insights.push({
            id: '1',
            type: 'warning',
            icon: AlertTriangle,
            title: t.aiInsights.lowStockAlert,
            description: t.aiInsights.lowStockDescription.replace('{count}', lowStockProducts.length.toString()),
            action: 'View Inventory',
            metric: `${lowStockProducts.length} items`
          })
        }

        if (outOfStockProducts.length > 0) {
          insights.push({
            id: '2',
            type: 'danger',
            icon: Package,
            title: t.aiInsights.outOfStockCritical,
            description: t.aiInsights.outOfStockDescription.replace('{count}', outOfStockProducts.length.toString()),
            action: 'Restock Now',
            metric: `${outOfStockProducts.length} items`
          })
        }

        const topSellingProducts = products
          .sort((a: any, b: any) => Number(b.total_sold || 0) - Number(a.total_sold || 0))
          .slice(0, 3)

        if (topSellingProducts.length > 0 && topSellingProducts[0].total_sold > 0) {
          insights.push({
            id: '3',
            type: 'success',
            icon: TrendingUp,
            title: 'Best Performers',
            description: `${topSellingProducts[0].name} is your top-selling product with ${topSellingProducts[0].total_sold} units sold.`,
            metric: `${topSellingProducts[0].total_sold} units`
          })
        }
      }

      if (customers) {
        const topCustomers = customers
          .sort((a: any, b: any) => Number(b.total_revenue || 0) - Number(a.total_revenue || 0))
          .slice(0, 1)

        if (topCustomers.length > 0 && topCustomers[0].total_revenue > 0) {
          insights.push({
            id: '4',
            type: 'success',
            icon: Users,
            title: 'Top Customer',
            description: `${topCustomers[0].name} is your highest-value customer with $${Number(topCustomers[0].total_revenue).toFixed(2)} in revenue.`,
            metric: `$${Number(topCustomers[0].total_revenue).toFixed(2)}`
          })
        }
      }

      if (invoices) {
        const totalRevenue = invoices
          .filter((inv: any) => inv.status !== 'cancelled')
          .reduce((sum: any, inv: any) => sum + Number(inv.total), 0)

        const unpaidInvoices = invoices.filter((inv: any) => inv.status === 'pending')
        const unpaidAmount = unpaidInvoices.reduce((sum: any, inv: any) => sum + Number(inv.total), 0)

        if (unpaidAmount > 0) {
          insights.push({
            id: '5',
            type: 'warning',
            icon: DollarSign,
            title: 'Pending Payments',
            description: `You have $${unpaidAmount.toFixed(2)} in unpaid invoices from ${unpaidInvoices.length} customers.`,
            action: 'Follow Up',
            metric: `$${unpaidAmount.toFixed(2)}`
          })
        }

        if (totalRevenue > 0) {
          insights.push({
            id: '6',
            type: 'info',
            icon: TrendingUp,
            title: '30-Day Revenue',
            description: `Your total revenue for the last 30 days is $${totalRevenue.toFixed(2)}.`,
            metric: `$${totalRevenue.toFixed(2)}`
          })
        }
      }

      if (proposals) {
        const pendingProposals = proposals.filter((p: any) => p.status === 'sent')
        const pendingValue = pendingProposals.reduce((sum: any, p: any) => sum + Number(p.total), 0)

        if (pendingValue > 0) {
          insights.push({
            id: '7',
            type: 'info',
            icon: Target,
            title: 'Pipeline Opportunity',
            description: `You have $${pendingValue.toFixed(2)} in pending proposals waiting for customer response.`,
            metric: `$${pendingValue.toFixed(2)}`
          })
        }
      }

      if (expenses || purchaseInvoices) {
        const manualExpenseTotal = expenses?.reduce((sum: any, e: any) => sum + Number(e.amount), 0) || 0
        const purchaseExpenseTotal = purchaseInvoices
          ?.filter((pi: any) => pi.status === 'accepted')
          .reduce((sum: any, pi: any) => sum + Number(pi.total_amount), 0) || 0
        const totalExpenses = manualExpenseTotal + purchaseExpenseTotal

        if (totalExpenses > 0) {
          const totalRevenue = invoices
            ?.filter((inv: any) => inv.status !== 'cancelled')
            .reduce((sum: any, inv: any) => sum + Number(inv.total), 0) || 0

          const netProfit = totalRevenue - totalExpenses
          const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0'

          const daysInMonth = 30
          const dailyBurnRate = (totalExpenses / daysInMonth).toFixed(2)

          insights.push({
            id: '8',
            type: totalExpenses > totalRevenue * 0.7 ? 'warning' : 'info',
            icon: TrendingDown,
            title: 'Monthly Burn Rate',
            description: `Your daily burn rate is $${dailyBurnRate}. Total expenses for last 30 days: $${totalExpenses.toFixed(2)}.`,
            metric: `$${dailyBurnRate}/day`
          })

          if (netProfit < 0) {
            insights.push({
              id: '9',
              type: 'danger',
              icon: AlertTriangle,
              title: 'Negative Profit Margin',
              description: `Your expenses ($${totalExpenses.toFixed(2)}) exceed your revenue ($${totalRevenue.toFixed(2)}). Consider cost optimization.`,
              metric: `${profitMargin}%`
            })
          } else if (parseFloat(profitMargin) < 20) {
            insights.push({
              id: '9',
              type: 'warning',
              icon: AlertTriangle,
              title: 'Low Profit Margin',
              description: `Your profit margin is ${profitMargin}%. Consider increasing prices or reducing costs.`,
              metric: `${profitMargin}%`
            })
          } else {
            insights.push({
              id: '9',
              type: 'success',
              icon: TrendingUp,
              title: 'Healthy Profit Margin',
              description: `Your profit margin is ${profitMargin}%. Great job maintaining profitability!`,
              metric: `${profitMargin}%`
            })
          }
        }

        if (expenses && expenses.length > 0) {
          const categoryTotals: { [key: string]: number } = {}
          expenses.forEach((exp: any) => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + Number(exp.amount)
          })

          const topCategory = Object.entries(categoryTotals)
            .sort((a: any, b: any) => b[1] - a[1])[0]

          if (topCategory) {
            insights.push({
              id: '10',
              type: 'info',
              icon: ShoppingCart,
              title: 'Top Expense Category',
              description: `Most expenses in the last 30 days were in ${topCategory[0]} category: $${topCategory[1].toFixed(2)}.`,
              metric: `$${topCategory[1].toFixed(2)}`
            })
          }
        }
      }

      setInsights(insights)
    } catch (error) {
      console.error('Error generating insights:', error)
    } finally {
      setLoading(false)
    }
  }

  async function generateCashFlowPrediction() {
    if (!tenantId) return

    try {
      const months: any[] = []
      const now = new Date()

      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i)
        const monthStart = startOfMonth(monthDate)
        const monthEnd = endOfMonth(monthDate)

        const { data: invoices } = await supabase
          .from('invoices')
          .select('total, status')
          .eq('tenant_id', tenantId)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString())

        const revenue = invoices
          ?.filter((inv: any) => inv.status !== 'cancelled')
          .reduce((sum: any, inv: any) => sum + Number(inv.total), 0) || 0

        months.push({
          month: format(monthDate, 'MMM yyyy'),
          revenue: Math.round(revenue),
          predicted: i === 0 ? Math.round(revenue * 1.1) : null
        })
      }

      const lastMonthRevenue = months[months.length - 2]?.revenue || 0
      const currentMonthRevenue = months[months.length - 1]?.revenue || 0
      const avgGrowth = lastMonthRevenue > 0 ? (currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue : 0.1

      for (let i = 1; i <= 3; i++) {
        const futureMonth = subMonths(now, -i)
        const predictedRevenue = Math.round(currentMonthRevenue * Math.pow(1 + avgGrowth, i))
        months.push({
          month: format(futureMonth, 'MMM yyyy'),
          revenue: null,
          predicted: predictedRevenue
        })
      }

      setCashFlowData(months)
    } catch (error) {
      console.error('Error generating cash flow prediction:', error)
    }
  }

  async function loadThreads() {
    if (!tenantId) return

    try {
      const { data, error } = await supabase
        .from('ai_chat_threads')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setThreads(data || [])
    } catch (error) {
      console.error('Error loading threads:', error)
    }
  }

  async function loadThreadHistory(threadId: string) {
    if (!tenantId) return
    setLoadingHistory(true)

    try {
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('*')
        .eq('thread_id', threadId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const messages: ChatMessage[] = (data || [])
        .filter((msg: any) => msg.role !== 'function')
        .map((msg: any) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }))

      setChatMessages(messages)
    } catch (error) {
      console.error('Error loading thread history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  async function startNewConversation() {
    setCurrentThreadId(null)
    setChatMessages([])
  }

  async function handleSendMessage() {
    if (!userInput.trim() || !tenantId) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: userInput,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    const currentInput = userInput
    setUserInput('')
    setChatLoading(true)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

      console.log('[AI Chat] 🔄 Forcing fresh token refresh...')

      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError || !refreshData.session) {
        console.error('[AI Chat] ❌ Token refresh failed:', refreshError)
        throw new Error('Not authenticated. Please refresh the page and log in.')
      }

      const session = refreshData.session
      const accessToken = session.access_token

      console.log('[AI Chat] ✓ Fresh token obtained')
      console.log('[AI Chat] ✓ User ID:', session.user.id)
      console.log('[AI Chat] ✓ Token length:', accessToken.length)
      console.log('[AI Chat] ✓ Token preview (first 10 chars):', accessToken.substring(0, 10))
      console.log('[AI Chat] ✓ Token expiry:', new Date(session.expires_at! * 1000).toISOString())

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      console.log('[AI Chat] 📤 Sending request with headers:')
      console.log('[AI Chat]   Authorization: Bearer', accessToken.substring(0, 10) + '...')
      console.log('[AI Chat]   apikey:', anonKey ? 'Present (length: ' + anonKey.length + ')' : 'Missing')
      console.log('[AI Chat] 🚀 Request details:', {
        url: `${supabaseUrl}/functions/v1/ai-cfo-chat`,
        message: currentInput.substring(0, 50),
        thread_id: currentThreadId,
        tenant_id: tenantId,
      })

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-cfo-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          thread_id: currentThreadId,
          tenant_id: tenantId,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log('[AI Chat] Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[AI Chat] Error response:', errorText)

        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }

        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result = await response.json()
      console.log('[AI Chat] Success:', {
        hasMessage: !!result.message,
        thread_id: result.thread_id,
        messageLength: result.message?.length
      })

      if (!currentThreadId && result.thread_id) {
        setCurrentThreadId(result.thread_id)
        loadThreads()
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.message,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('[AI Chat] Full error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })

      let errorMsg: string
      if (error.name === 'AbortError') {
        errorMsg = /[çğıİöşüÇĞÖŞÜ]/.test(currentInput)
          ? 'İstek zaman aşımına uğradı (30 saniye). Sorgunuz çok karmaşık olabilir. Lütfen daha spesifik bir soru deneyin.'
          : 'Request timed out (30 seconds). Your query might be too complex. Please try a more specific question.'
      } else if (error.message.includes('RLS') || error.message.includes('permission')) {
        errorMsg = /[çğıİöşüÇĞÖŞÜ]/.test(currentInput)
          ? 'Veritabanı izin hatası. RLS politikaları optimize edildi, lütfen tekrar deneyin.'
          : 'Database permission error. RLS policies have been optimized, please try again.'
      } else if (error.message.includes('OpenAI') || error.message.includes('API key')) {
        errorMsg = /[çğıİöşüÇĞÖŞÜ]/.test(currentInput)
          ? 'AI servisi yapılandırılmamış. Lütfen OPENAI_API_KEY ayarını kontrol edin.'
          : 'AI service not configured. Please check OPENAI_API_KEY setting.'
      } else if (error.message.includes('timeout')) {
        errorMsg = /[çğıİöşüÇĞÖŞÜ]/.test(currentInput)
          ? 'Veritabanı sorgusu zaman aşımına uğradı. Lütfen tekrar deneyin.'
          : 'Database query timed out. Please try again.'
      } else {
        errorMsg = /[çğıİöşüÇĞÖŞÜ]/.test(currentInput)
          ? `Hata: ${error.message}. Detaylar için konsola bakın.`
          : `Error: ${error.message}. Check console for details.`
      }

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date()
      }])
    } finally {
      setChatLoading(false)
    }
  }

  function getInsightColor(type: string) {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-amber-200 bg-amber-50'
      case 'danger':
        return 'border-red-200 bg-red-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  function getInsightIconColor(type: string) {
    switch (type) {
      case 'success':
        return 'text-green-600'
      case 'warning':
        return 'text-amber-600'
      case 'danger':
        return 'text-red-600'
      case 'info':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0A192F]">
            MODULUS AI
          </h1>
          <p className="text-[#475569] mt-1">
            Real-time analysis and predictions powered by artificial intelligence
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#475569]">Loading insights...</div>
        ) : tenantLoading ? (
          <div className="text-center py-12 text-[#475569]">Loading insights...</div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {insights.map((insight) => {
                const Icon = insight.icon
                return (
                  <Card key={insight.id} className={getInsightColor(insight.type)}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-white ${getInsightIconColor(insight.type)}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-primary font-medium mb-1">{t.aiInsights.modulusAiSays}</div>
                          <h3 className="font-semibold text-sm mb-1">{insight.title}</h3>
                          <p className="text-sm text-[#475569] mb-2">
                            {insight.description}
                          </p>
                          {insight.metric && (
                            <div className="text-lg font-bold mb-2">{insight.metric}</div>
                          )}
                          {insight.action && (
                            <Button size="sm" variant="outline" className="mt-2">
                              {insight.action}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#0D1B2A]" />
                  <CardTitle>Predictive Cash Flow</CardTitle>
                </div>
                <CardDescription>
                  Historical data and AI-powered revenue predictions for the next 3 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cashFlowData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#0D1B2A"
                        fill="#0D1B2A"
                        fillOpacity={0.6}
                        name="Actual Revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="predicted"
                        stroke="#2ECC71"
                        fill="#2ECC71"
                        fillOpacity={0.3}
                        strokeDasharray="5 5"
                        name="Predicted Revenue"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-[#475569]">
                    No data available for prediction
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-12">
              <div className="md:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Conversations</CardTitle>
                    <Button
                      size="sm"
                      onClick={startNewConversation}
                      className="w-full mt-2"
                      variant="outline"
                    >
                      New Chat
                    </Button>
                  </CardHeader>
                  <CardContent className="p-2">
                    <div className="space-y-1">
                      {threads.map((thread) => (
                        <button
                          key={thread.id}
                          onClick={() => setCurrentThreadId(thread.id)}
                          className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                            currentThreadId === thread.id
                              ? 'bg-sky-100 text-[#0A192F]'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <div className="font-medium truncate">{thread.title}</div>
                          <div className="text-xs text-[#475569]">
                            {format(new Date(thread.updated_at), 'MMM d, HH:mm')}
                          </div>
                        </button>
                      ))}
                      {threads.length === 0 && (
                        <div className="text-sm text-[#475569] text-center py-4">
                          No conversations yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-9">
                <Card className="border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-[#0D1B2A]" />
                        <CardTitle className="text-[#0A192F]">AI CFO Assistant</CardTitle>
                      </div>
                      <Badge variant="outline" className="bg-white">
                        Context-Aware
                      </Badge>
                    </div>
                    <CardDescription className="text-sky-700">
                      Advanced AI with full database access and persistent memory
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingHistory ? (
                      <div className="bg-white rounded-lg p-4 mb-4 h-[500px] flex items-center justify-center">
                        <div className="text-[#475569]">Loading conversation...</div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white rounded-lg p-4 mb-4 h-[500px] overflow-y-auto space-y-4">
                          {chatMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                              <Sparkles className="h-12 w-12 text-sky-400 mb-4" />
                              <h3 className="font-semibold text-lg mb-2">Welcome to AI CFO Assistant</h3>
                              <p className="text-sm text-[#475569] max-w-md">
                                I have full access to your financial data and can answer complex questions.
                                Try asking:<br/>
                                <strong>What is my profit margin this month?</strong><br/>
                                <strong>Show me customers from Istanbul who haven't paid</strong><br/>
                                <strong>Bu ayki satışlarım nedir?</strong>
                              </p>
                            </div>
                          )}
                          {chatMessages.map((msg, index) => (
                            <div
                              key={index}
                              className={`flex gap-3 ${
                                msg.role === 'user' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              {msg.role === 'assistant' && (
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                                    <Bot className="h-5 w-5 text-[#0D1B2A]" />
                                  </div>
                                </div>
                              )}
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  msg.role === 'user'
                                    ? 'bg-[#0D1B2A] text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                <p className="text-xs opacity-70 mt-1">
                                  {format(msg.timestamp, 'HH:mm')}
                                </p>
                              </div>
                              {msg.role === 'user' && (
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-[#0D1B2A] flex items-center justify-center text-white text-sm font-medium">
                                    You
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          {chatLoading && (
                            <div className="flex gap-3 justify-start">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                                  <Bot className="h-5 w-5 text-[#0D1B2A] animate-pulse" />
                                </div>
                              </div>
                              <div className="bg-gray-100 rounded-lg p-3">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Ask me anything about your business... (Turkish & English supported)"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSendMessage()
                              }
                            }}
                            disabled={chatLoading}
                            className="min-h-[60px] resize-none"
                          />
                          <Button
                            onClick={handleSendMessage}
                            disabled={chatLoading || !userInput.trim()}
                            className="bg-[#0D1B2A] hover:bg-[#1a2d42] text-white self-end"
                            size="lg"
                          >
                            <Send className="h-5 w-5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
