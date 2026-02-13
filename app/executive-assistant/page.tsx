'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExecStatsCards } from '@/components/executive-assistant/exec-stats-cards'
import { ObligationsPanel } from '@/components/executive-assistant/obligations-panel'
import { MeetingsPanel } from '@/components/executive-assistant/meetings-panel'
import { RemindersPanel } from '@/components/executive-assistant/reminders-panel'
import { useTenant } from '@/contexts/tenant-context'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { supabase } from '@/lib/supabase'
import {
  BriefcaseBusiness,
  ClipboardCheck,
  Calendar,
  Bell
} from 'lucide-react'

interface ObligationType {
  id: number
  name: string
  category: string
  default_reminder_days: number
}

export default function ExecutiveAssistantPage() {
  const { tenantId, loading: tenantLoading } = useTenant()
  const { user } = useAuth()
  const { language } = useLanguage()
  const isTR = language === 'tr'

  const [obligations, setObligations] = useState<any[]>([])
  const [meetings, setMeetings] = useState<any[]>([])
  const [reminders, setReminders] = useState<any[]>([])
  const [obligationTypes, setObligationTypes] = useState<ObligationType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!tenantId || !user) return

    try {
      const [oblRes, meetRes, remRes, typesRes] = await Promise.all([
        supabase.from('executive_obligations').select('*').eq('tenant_id', tenantId).order('due_date', { ascending: true }),
        supabase.from('executive_meetings').select('*').eq('tenant_id', tenantId).order('start_time', { ascending: true }),
        supabase.from('executive_reminders').select('*').eq('tenant_id', tenantId).order('remind_at', { ascending: true }),
        supabase.from('obligation_types').select('*').order('id'),
      ])

      if (oblRes.data) setObligations(oblRes.data)
      if (meetRes.data) setMeetings(meetRes.data)
      if (remRes.data) setReminders(remRes.data)
      if (typesRes.data) setObligationTypes(typesRes.data)
    } catch (err) {
      console.error('Error loading executive assistant data:', err)
    } finally {
      setLoading(false)
    }
  }, [tenantId, user])

  useEffect(() => {
    if (!tenantLoading && tenantId && user) {
      fetchData()
    }
  }, [tenantId, tenantLoading, user, fetchData])

  const now = new Date()
  const stats = {
    totalObligations: obligations.length,
    pendingObligations: obligations.filter(o => o.status === 'pending' || o.status === 'in_progress').length,
    overdueObligations: obligations.filter(o => o.status !== 'completed' && new Date(o.due_date) < now).length,
    completedObligations: obligations.filter(o => o.status === 'completed').length,
    upcomingMeetings: meetings.filter(m => m.status === 'scheduled' && new Date(m.start_time) >= now).length,
    activeReminders: reminders.filter(r => !r.is_dismissed).length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-3 rounded-2xl shadow-lg shadow-sky-200/50">
            <BriefcaseBusiness className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0A192F]">
              {isTR ? 'Yönetici Asistanı' : 'Executive Assistant'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isTR
                ? 'Yasal yükümlülükler, toplantılar ve hatırlatmalarınızı yönetin'
                : 'Manage your legal obligations, meetings, and reminders'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <ExecStatsCards stats={stats} />

            <Tabs defaultValue="obligations" className="w-full">
              <TabsList className="bg-muted/50 p-1 h-auto">
                <TabsTrigger value="obligations" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2.5">
                  <ClipboardCheck className="h-4 w-4" />
                  <span>{isTR ? 'Yükümlülükler' : 'Obligations'}</span>
                  {stats.overdueObligations > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {stats.overdueObligations}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="meetings" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2.5">
                  <Calendar className="h-4 w-4" />
                  <span>{isTR ? 'Toplantılar' : 'Meetings'}</span>
                  {stats.upcomingMeetings > 0 && (
                    <span className="bg-sky-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {stats.upcomingMeetings}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="reminders" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2.5">
                  <Bell className="h-4 w-4" />
                  <span>{isTR ? 'Hatırlatmalar' : 'Reminders'}</span>
                  {stats.activeReminders > 0 && (
                    <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {stats.activeReminders}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="obligations" className="mt-4">
                <ObligationsPanel
                  obligations={obligations}
                  obligationTypes={obligationTypes}
                  tenantId={tenantId!}
                  userId={user!.id}
                  onRefresh={fetchData}
                />
              </TabsContent>

              <TabsContent value="meetings" className="mt-4">
                <MeetingsPanel
                  meetings={meetings}
                  tenantId={tenantId!}
                  userId={user!.id}
                  onRefresh={fetchData}
                />
              </TabsContent>

              <TabsContent value="reminders" className="mt-4">
                <RemindersPanel
                  reminders={reminders}
                  tenantId={tenantId!}
                  userId={user!.id}
                  onRefresh={fetchData}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
