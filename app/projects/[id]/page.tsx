'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from '@/components/ui/sonner'
import {
  ArrowLeft, Edit, FolderKanban, Calendar, User, Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { ProjectFinancialDashboard } from '@/components/projects/project-financial-dashboard'
import { MilestoneManager } from '@/components/projects/milestone-manager'
import { StockReservationPanel } from '@/components/projects/stock-reservation-panel'
import { ProjectTimeline } from '@/components/projects/project-timeline'
import { EditProjectDialog } from '@/components/projects/edit-project-dialog'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const { tenantId, loading: tenantLoading } = useTenant()
  const { language } = useLanguage()
  const isTR = language === 'tr'

  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)

  useEffect(() => {
    if (!tenantLoading && tenantId && projectId) fetchProject()
  }, [tenantId, tenantLoading, projectId])

  async function fetchProject() {
    const { data } = await supabase
      .from('projects')
      .select('*, customers(name, company_title)')
      .eq('id', projectId)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    setProject(data)
    setLoading(false)
  }

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      planning: 'bg-amber-100 text-amber-800',
      active: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return map[status] || 'bg-gray-100 text-gray-800'
  }

  function getStatusLabel(status: string) {
    if (isTR) {
      const map: Record<string, string> = {
        planning: 'Planlama', active: 'Aktif', on_hold: 'Beklemede',
        completed: 'Tamamlandi', cancelled: 'Iptal',
      }
      return map[status] || status
    }
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  function getPriorityBadge(priority: string) {
    const map: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    }
    return map[priority] || 'bg-gray-100 text-gray-700'
  }

  function getPriorityLabel(p: string) {
    if (isTR) {
      const map: Record<string, string> = { low: 'Dusuk', medium: 'Orta', high: 'Yuksek', critical: 'Kritik' }
      return map[p] || p
    }
    return p.charAt(0).toUpperCase() + p.slice(1)
  }

  if (loading || tenantLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center py-24">
          <p className="text-gray-500">{isTR ? 'Proje bulunamadi' : 'Project not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isTR ? 'Projelere Don' : 'Back to Projects'}
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/projects')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0A192F] to-[#1B3A5C]">
              <FolderKanban className="h-6 w-6 text-[#7DD3FC]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                <Badge className={getStatusBadge(project.status)}>{getStatusLabel(project.status)}</Badge>
                <Badge className={getPriorityBadge(project.priority)}>{getPriorityLabel(project.priority)}</Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                {project.code && <span className="font-mono">{project.code}</span>}
                {project.customers && (
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {project.customers.company_title || project.customers.name}
                  </span>
                )}
                {project.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(project.start_date).toLocaleDateString(isTR ? 'tr-TR' : 'en-US')}
                    {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString(isTR ? 'tr-TR' : 'en-US')}`}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            {isTR ? 'Duzenle' : 'Edit'}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Progress value={project.progress_percent} className="flex-1 h-3" />
          <span className="text-sm font-bold w-12 text-right">{project.progress_percent}%</span>
        </div>

        <Tabs defaultValue="financial" className="space-y-4">
          <TabsList>
            <TabsTrigger value="financial">{isTR ? 'Finansal Ozet' : 'Financial Summary'}</TabsTrigger>
            <TabsTrigger value="milestones">{isTR ? 'Kilometre Taslari' : 'Milestones'}</TabsTrigger>
            <TabsTrigger value="reservations">{isTR ? 'Stok Rezervasyon' : 'Stock Reservations'}</TabsTrigger>
            <TabsTrigger value="timeline">{isTR ? 'Zaman Cizelgesi' : 'Timeline'}</TabsTrigger>
          </TabsList>

          <TabsContent value="financial">
            <ProjectFinancialDashboard
              projectId={projectId}
              tenantId={tenantId || ''}
              isTR={isTR}
              currency={project.currency}
            />
          </TabsContent>

          <TabsContent value="milestones">
            <MilestoneManager
              projectId={projectId}
              tenantId={tenantId || ''}
              isTR={isTR}
            />
          </TabsContent>

          <TabsContent value="reservations">
            <StockReservationPanel
              projectId={projectId}
              tenantId={tenantId || ''}
              isTR={isTR}
            />
          </TabsContent>

          <TabsContent value="timeline">
            <ProjectTimeline
              projectId={projectId}
              tenantId={tenantId || ''}
              isTR={isTR}
            />
          </TabsContent>
        </Tabs>
      </div>

      <EditProjectDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        tenantId={tenantId || ''}
        project={project}
        onSuccess={fetchProject}
        isTR={isTR}
      />

      <Toaster />
    </DashboardLayout>
  )
}
