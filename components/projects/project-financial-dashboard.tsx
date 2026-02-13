'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  Package, Receipt, FileText, Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ProjectFinancialDashboardProps {
  projectId: string
  tenantId: string
  isTR: boolean
  currency?: string
}

interface FinancialData {
  budget: number
  total_revenue: number
  total_expenses: number
  total_material_cost: number
  total_labor_other: number
  total_cost: number
  net_profit: number
  budget_consumption_percent: number
}

export function ProjectFinancialDashboard({ projectId, tenantId, isTR, currency = 'TRY' }: ProjectFinancialDashboardProps) {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [projectId])

  async function loadData() {
    const { data: summary } = await supabase
      .from('project_financial_summary')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle()

    setData(summary)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!data) return null

  const fmt = (val: number) => Number(val).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const isOverBudget = Number(data.budget_consumption_percent) > 100
  const isWarning = Number(data.budget_consumption_percent) > 90

  const costBreakdown = [
    {
      label: isTR ? 'Giderler' : 'Expenses',
      value: Number(data.total_expenses),
      icon: Receipt,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: isTR ? 'Malzeme' : 'Materials',
      value: Number(data.total_material_cost),
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: isTR ? 'Iscilik & Diger' : 'Labor & Other',
      value: Number(data.total_labor_other),
      icon: DollarSign,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#0A192F]">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{isTR ? 'Butce' : 'Budget'}</p>
            <p className="text-2xl font-bold text-[#0A192F]">{fmt(Number(data.budget))}</p>
            <p className="text-xs text-muted-foreground">{currency}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{isTR ? 'Toplam Gelir' : 'Total Revenue'}</p>
            <p className="text-2xl font-bold text-green-600 flex items-center gap-1">
              <TrendingUp className="h-5 w-5" />
              {fmt(Number(data.total_revenue))}
            </p>
            <p className="text-xs text-muted-foreground">{currency}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-400">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{isTR ? 'Toplam Maliyet' : 'Total Cost'}</p>
            <p className="text-2xl font-bold text-red-600 flex items-center gap-1">
              <TrendingDown className="h-5 w-5" />
              {fmt(Number(data.total_cost))}
            </p>
            <p className="text-xs text-muted-foreground">{currency}</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${Number(data.net_profit) >= 0 ? 'border-l-emerald-500' : 'border-l-red-600'}`}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{isTR ? 'Net Kar/Zarar' : 'Net Profit/Loss'}</p>
            <p className={`text-2xl font-bold ${Number(data.net_profit) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {fmt(Number(data.net_profit))}
            </p>
            <p className="text-xs text-muted-foreground">{currency}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>{isTR ? 'Butce Kullanimi' : 'Budget Consumption'}</span>
            <span className={`text-lg font-bold ${isOverBudget ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-[#0A192F]'}`}>
              {Number(data.budget_consumption_percent).toFixed(1)}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress
            value={Math.min(Number(data.budget_consumption_percent), 100)}
            className={`h-4 ${isOverBudget ? '[&>div]:bg-red-500' : isWarning ? '[&>div]:bg-amber-500' : '[&>div]:bg-[#7DD3FC]'}`}
          />
          {isOverBudget && (
            <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <p className="text-xs text-red-700 font-medium">
                {isTR
                  ? `Butce %${(Number(data.budget_consumption_percent) - 100).toFixed(1)} asildi! Toplam maliyet: ${fmt(Number(data.total_cost))} ${currency}`
                  : `Budget exceeded by ${(Number(data.budget_consumption_percent) - 100).toFixed(1)}%! Total cost: ${fmt(Number(data.total_cost))} ${currency}`}
              </p>
            </div>
          )}
          {isWarning && !isOverBudget && (
            <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700 font-medium">
                {isTR ? 'Butce limitine yaklasiliyor!' : 'Approaching budget limit!'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {costBreakdown.map(item => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.bg}`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-lg font-bold">{fmt(item.value)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
