'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger
} from '@/components/ui/select'

interface Activity {
  id: string
  type: 'payment' | 'customer' | 'inventory' | 'invoice'
  title: string
  description: string
  time: string
  status?: 'success' | 'warning' | 'info'
  link?: string
}

const ACTIVITY_LIMIT_OPTIONS = [5, 10, 20, 50] as const

interface RecentActivityProps {
  activities: Activity[]
  limit?: number
  onLimitChange?: (n: number) => void
}

const activityColors = {
  payment: 'bg-[#00D4AA]',
  customer: 'bg-blue-500',
  inventory: 'bg-orange-500',
  invoice: 'bg-purple-500'
}

const statusColors = {
  success: 'bg-[#00D4AA]',
  warning: 'bg-orange-500',
  info: 'bg-blue-500'
}

export function RecentActivity({ activities, limit = 5, onLimitChange }: RecentActivityProps) {
  const router = useRouter()
  const { t } = useLanguage()

  const handleActivityClick = (activity: Activity) => {
    if (activity.link) {
      router.push(activity.link)
    }
  }

  const getStatusLabel = (status?: string) => {
    if (!status) return ''
    if (status === 'success') return t.common.success
    if (status === 'warning') return t.common.warning
    if (status === 'info') return t.common.info
    return status
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{t.dashboard.recentActivity}</CardTitle>
            <CardDescription>{t.dashboard.recentActivityDescription}</CardDescription>
          </div>
          {onLimitChange && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-muted-foreground whitespace-nowrap">{t.dashboard.showLastActivities}</span>
              <Select
                value={String(limit)}
                onValueChange={(v) => onLimitChange(Number(v))}
              >
                <SelectTrigger className="w-[72px] h-10 rounded-md text-sm font-medium bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 hover:text-gray-900 px-4 py-2 inline-flex items-center justify-center">
                  <span>...</span>
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900">
                  {ACTIVITY_LIMIT_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)} className="text-gray-900">
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              onClick={() => handleActivityClick(activity)}
              className={cn(
                'flex gap-4 pb-4',
                index !== activities.length - 1 && 'border-b border-gray-100',
                activity.link && 'cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded-lg transition-colors'
              )}
            >
              <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', activityColors[activity.type])} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                  </div>
                  {activity.status && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-white flex-shrink-0',
                        statusColors[activity.status]
                      )}
                    >
                      {getStatusLabel(activity.status)}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
