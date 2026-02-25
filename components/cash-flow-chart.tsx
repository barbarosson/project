'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
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

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        net: d.income - d.expenses
      })),
    [data]
  )

  const profitLabel = isTR ? 'Kar' : 'Profit'
  const lossLabel = isTR ? 'Zarar' : 'Loss'

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
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: number, name: string) => {
                  if (name === (isTR ? 'Kar / Zarar' : 'Profit / Loss')) {
                    const label = Number(value) >= 0 ? profitLabel : lossLabel
                    return [formatCurrency(Math.abs(Number(value))), label]
                  }
                  return [formatCurrency(value), name]
                }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.month ?? ''}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="income" name={t.dashboard.cashFlowIncome} fill="#00D4AA" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name={t.dashboard.cashFlowExpenses} fill="#E74C3C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="net" name={isTR ? 'Kar / Zarar' : 'Profit / Loss'} radius={[4, 4, 0, 0]} maxBarSize={24}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.net >= 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
