import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral' | 'warning'
  icon: LucideIcon
  iconColor?: string
  onClick?: () => void
  clickable?: boolean
}

export function MetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'bg-[#00D4AA]',
  onClick,
  clickable = false
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all",
        clickable && "cursor-pointer hover:scale-[1.02] hover:border-[#00D4AA]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold mt-2 text-gray-900">{value}</p>
            {change && (
              <p
                className={cn(
                  'text-sm mt-2 font-medium',
                  changeType === 'positive' && 'text-[#00D4AA]',
                  changeType === 'negative' && 'text-red-600',
                  changeType === 'neutral' && 'text-gray-500',
                  changeType === 'warning' && 'text-orange-600'
                )}
              >
                {change}
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-lg', iconColor)}>
            <Icon className="text-white" size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
