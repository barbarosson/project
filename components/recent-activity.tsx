import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Activity {
  id: string
  type: 'payment' | 'customer' | 'inventory' | 'invoice'
  title: string
  description: string
  time: string
  status?: 'success' | 'warning' | 'info'
  link?: string
}

interface RecentActivityProps {
  activities: Activity[]
}

const activityColors = {
  payment: 'bg-[#2ECC71]',
  customer: 'bg-blue-500',
  inventory: 'bg-orange-500',
  invoice: 'bg-purple-500'
}

const statusColors = {
  success: 'bg-[#2ECC71]',
  warning: 'bg-orange-500',
  info: 'bg-blue-500'
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const router = useRouter()

  const handleActivityClick = (activity: Activity) => {
    if (activity.link) {
      router.push(activity.link)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest transactions and status changes</CardDescription>
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
                      {activity.status}
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
