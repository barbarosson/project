'use client'

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
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const { t } = useLanguage()
  const { formatCurrency } = useCurrency()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.dashboard.cashFlow}</CardTitle>
        <CardDescription>{t.dashboard.cashFlowChartDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
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
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '20px'
                }}
              />
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
      </CardContent>
    </Card>
  )
}
