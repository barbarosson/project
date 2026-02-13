'use client'

import { Bot, AlertTriangle, CheckCircle2, XCircle, Lightbulb, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { HealthGauge } from './health-gauge'
import { InsightCard } from './insight-card'
import type { OverallAnalysis, FinanceRobotReport } from '@/lib/finance-robot'

interface OverallDashboardProps {
  report: FinanceRobotReport
  formatCurrency: (n: number) => string
}

const statusLabels = {
  excellent: 'Excellent',
  good: 'Good',
  warning: 'Needs Attention',
  critical: 'Critical',
}

const statusColors = {
  excellent: 'bg-emerald-100 text-emerald-800',
  good: 'bg-sky-100 text-sky-800',
  warning: 'bg-amber-100 text-amber-800',
  critical: 'bg-red-100 text-red-800',
}

export function OverallDashboard({ report, formatCurrency }: OverallDashboardProps) {
  const { overall } = report

  const modules = [
    { name: 'Invoices', score: report.invoices.health.score, status: report.invoices.health.status },
    { name: 'Expenses', score: report.expenses.health.score, status: report.expenses.health.status },
    { name: 'Customers', score: report.customers.health.score, status: report.customers.health.status },
    { name: 'Inventory', score: report.inventory.health.score, status: report.inventory.health.status },
    { name: 'Cash Flow', score: report.cashFlow.health.score, status: report.cashFlow.health.status },
  ]

  const dangerCount = overall.keyFindings.filter(f => f.type === 'danger').length
  const warningCount = overall.keyFindings.filter(f => f.type === 'warning').length

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-br from-[#0D1B2A] via-[#132d46] to-[#1a3a5c] p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/20">
                <Bot className="text-[#B8E6FF]" size={32} />
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-white">Finance Robot</h2>
                <p className="text-sm text-[#B8E6FF]/80">AI-Powered Business Analysis</p>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <HealthGauge score={overall.overallScore} status={overall.overallStatus} size="lg" />
            </div>

            <div className="flex flex-col items-center lg:items-end gap-2 text-center lg:text-right">
              <Badge className={cn('text-sm px-3 py-1', statusColors[overall.overallStatus])}>
                {statusLabels[overall.overallStatus]}
              </Badge>
              <div className="flex items-center gap-4 mt-1">
                {dangerCount > 0 && (
                  <div className="flex items-center gap-1.5 text-red-300">
                    <XCircle size={14} />
                    <span className="text-xs font-medium">{dangerCount} Critical</span>
                  </div>
                )}
                {warningCount > 0 && (
                  <div className="flex items-center gap-1.5 text-amber-300">
                    <AlertTriangle size={14} />
                    <span className="text-xs font-medium">{warningCount} Warnings</span>
                  </div>
                )}
                {dangerCount === 0 && warningCount === 0 && (
                  <div className="flex items-center gap-1.5 text-emerald-300">
                    <CheckCircle2 size={14} />
                    <span className="text-xs font-medium">All Clear</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-white/50 mt-1">
                Net Profit: <span className={cn('font-bold', overall.netProfit >= 0 ? 'text-emerald-300' : 'text-red-300')}>{formatCurrency(overall.netProfit)}</span>
                <span className="mx-1.5">|</span>
                Margin: <span className={cn('font-bold', overall.profitMargin >= 10 ? 'text-emerald-300' : overall.profitMargin >= 0 ? 'text-amber-300' : 'text-red-300')}>{overall.profitMargin}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 mt-6">
            {modules.map((m) => (
              <div key={m.name} className="bg-white/5 backdrop-blur rounded-xl p-3 text-center ring-1 ring-white/10">
                <HealthGauge score={m.score} status={m.status} size="sm" />
                <p className="text-[11px] font-medium text-white/70 mt-1.5">{m.name}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {overall.keyFindings.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-[#0D1B2A]" />
                <CardTitle className="text-base">Key Findings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {overall.keyFindings.map((finding, i) => (
                <InsightCard key={i} insight={finding} />
              ))}
            </CardContent>
          </Card>
        )}

        {overall.recommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-500" />
                <CardTitle className="text-base">Recommendations</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {overall.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 shrink-0 rounded-full bg-[#0D1B2A] text-white flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
