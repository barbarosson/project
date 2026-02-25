'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/hooks/use-currency'

interface CashFlowData {
  month: string
  income: number
  expenses: number
}

interface CashFlowChartProps {
  data: CashFlowData[]
  periodLabel?: string
}

export function CashFlowChart({ data, periodLabel }: CashFlowChartProps) {
  const { t, language } = useLanguage()
  const { formatCurrency } = useCurrency()
  const isTR = language === 'tr'

  const { totalNet, netLabel } = useMemo(() => {
    const totalIncome = data.reduce((s, d) => s + d.income, 0)
    const totalExpenses = data.reduce((s, d) => s + d.expenses, 0)
    const net = totalIncome - totalExpenses
    const label = isTR ? (net >= 0 ? 'Kar' : 'Zarar') : (net >= 0 ? 'Profit' : 'Loss')
    return { totalNet: net, netLabel: label }
  }, [data, isTR])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.dashboard.cashFlow}</CardTitle>
        <CardDescription>
          {periodLabel
            ? `${t.dashboard.cashFlowChartDescription} (${periodLabel})`
            : t.dashboard.cashFlowChartDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-end gap-4 text-sm font-medium">
            <span className={totalNet >= 0 ? 'text-green-600' : 'text-red-600'}>
              {netLabel}: {formatCurrency(Math.abs(totalNet))}
            </span>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload
                    const net = (p?.income ?? 0) - (p?.expenses ?? 0)
                    return (
                      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm text-sm">
                        <div className="font-medium text-gray-700 mb-2">{p?.month}</div>
                        <div className="text-[#00D4AA]">{t.dashboard.cashFlowIncome}: {formatCurrency(p?.income ?? 0)}</div>
                        <div className="text-[#E74C3C]">{t.dashboard.cashFlowExpenses}: {formatCurrency(p?.expenses ?? 0)}</div>
                        <div className={net >= 0 ? 'text-green-600 font-medium mt-1' : 'text-red-600 font-medium mt-1'}>
                          {isTR ? (net >= 0 ? 'Kar' : 'Zarar') : (net >= 0 ? 'Profit' : 'Loss')}: {formatCurrency(Math.abs(net))}
                        </div>
                      </div>
                    )
                  }}
                />
              <Legend wrapperStyle={{ paddingTop: '12px' }} />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#00D4AA"
                strokeWidth={3}
                dot={{ fill: '#00D4AA', r: 4 }}
                activeDot={{ r: 6 }}
                name={t.dashboard.cashFlowIncome}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#E74C3C"
                strokeWidth={3}
                dot={{ fill: '#E74C3C', r: 4 }}
                activeDot={{ r: 6 }}
                name={t.dashboard.cashFlowExpenses}
              />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
