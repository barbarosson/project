'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Toaster } from '@/components/ui/sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FolderKanban, Plus, Search, MoreVertical, Eye, Edit,
  Trash2, Loader2, Calendar, User
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'
import { ProjectStatsCards } from '@/components/projects/project-stats-cards'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { EditProjectDialog } from '@/components/projects/edit-project-dialog'
import { ProjectDetailSheet } from '@/components/projects/project-detail-sheet'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'

interface Project {
  id: string
  name: string
  code: string
  status: string
  budget: number
  currency: string
  progress_percent: number
  priority: string
  start_date: string | null
  end_date: string | null
  manager_name: string
  client_id: string | null
  created_at: string
  customers?: { name: string; company_title: string } | null
}

const STATUS_FILTERS = ['all', 'planning', 'active', 'on_hold', 'completed', 'cancelled']

export default function ProjectsPage() {
  const router = useRouter()
  const { tenantId, loading: tenantLoading } = useTenant()
  const { language } = useLanguage()
  const isTR = language === 'tr'

  const [projects, setProjects] = useState<Project[]>([])
  const [financialSummaries, setFinancialSummaries] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [showDetailSheet, setShowDetailSheet] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)

  const fetchProjects = useCallback(async () => {
    if (!tenantId) return
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, customers(name, company_title)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])

      const { data: summaries } = await supabase
        .from('project_financial_summary')
        .select('*')
        .eq('tenant_id', tenantId)

      const summaryMap: Record<string, any> = {}
      ;(summaries || []).forEach(s => { summaryMap[s.project_id] = s })
      setFinancialSummaries(summaryMap)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    if (!tenantLoading && tenantId) fetchProjects()
  }, [tenantId, tenantLoading, fetchProjects])

  const stats = {
    total: projects.length,
    planning: projects.filter(p => p.status === 'planning').length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    overBudget: projects.filter(p => {
      const s = financialSummaries[p.id]
      return s && Number(s.budget_consumption_percent) > 100
    }).length,
    totalBudget: projects.reduce((sum, p) => sum + Number(p.budget || 0), 0),
  }

  const filteredProjects = projects
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.customers?.company_title?.toLowerCase().includes(q) ||
        p.customers?.name?.toLowerCase().includes(q) ||
        p.customers?.company_title?.toLowerCase().includes(q) ||
        p.manager_name?.toLowerCase().includes(q)
      )
    })

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
        all: 'Tumu', planning: 'Planlama', active: 'Aktif', on_hold: 'Beklemede',
        completed: 'Tamamlandi', cancelled: 'Iptal',
      }
      return map[status] || status
    }
    if (status === 'all') return 'All'
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  function getPriorityBadge(priority: string) {
    const map: Record<string, string> = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      critical: 'bg-red-100 text-red-600',
    }
    return map[priority] || ''
  }

  function getPriorityLabel(p: string) {
    if (isTR) {
      const map: Record<string, string> = { low: 'Dusuk', medium: 'Orta', high: 'Yuksek', critical: 'Kritik' }
      return map[p] || p
    }
    return p.charAt(0).toUpperCase() + p.slice(1)
  }

  async function confirmDelete() {
    if (!deletingProject || !tenantId) return
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', deletingProject.id)
        .eq('tenant_id', tenantId)
      if (error) throw error
      toast.success(isTR ? 'Proje silindi' : 'Project deleted')
      fetchProjects()
    } catch (error: any) {
      toast.error(error.message || 'Error')
    } finally {
      setShowDeleteDialog(false)
      setDeletingProject(null)
    }
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0A192F] to-[#1B3A5C]">
              <FolderKanban className="h-6 w-6 text-[#7DD3FC]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isTR ? 'Proje Yonetimi' : 'Project Management'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isTR
                  ? 'Fatura, stok, siparis ve giderlerle entegre proje takip sistemi'
                  : 'Project tracking integrated with invoices, inventory, orders & expenses'}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-[#00D4AA] hover:bg-[#00B894]">
            <Plus className="h-4 w-4 mr-2" />
            {isTR ? 'Yeni Proje' : 'New Project'}
          </Button>
        </div>

        <ProjectStatsCards stats={stats} isTR={isTR} />

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                {STATUS_FILTERS.map(s => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(s)}
                    className={statusFilter === s ? 'bg-[#0A2540]' : ''}
                  >
                    {getStatusLabel(s)}
                  </Button>
                ))}
              </div>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isTR ? 'Proje ara...' : 'Search projects...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">{isTR ? 'Proje' : 'Project'}</TableHead>
                    <TableHead className="font-semibold">{isTR ? 'Musteri' : 'Client'}</TableHead>
                    <TableHead className="font-semibold">{isTR ? 'Durum' : 'Status'}</TableHead>
                    <TableHead className="font-semibold text-right">{isTR ? 'Butce' : 'Budget'}</TableHead>
                    <TableHead className="font-semibold">{isTR ? 'Ilerleme' : 'Progress'}</TableHead>
                    <TableHead className="font-semibold">{isTR ? 'Oncelik' : 'Priority'}</TableHead>
                    <TableHead className="font-semibold">{isTR ? 'Tarih' : 'Date'}</TableHead>
                    <TableHead className="font-semibold">{isTR ? 'Islemler' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                        {isTR ? 'Proje bulunamadi' : 'No projects found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProjects.map(project => {
                      const summary = financialSummaries[project.id]
                      const isOverBudget = summary && Number(summary.budget_consumption_percent) > 100

                      return (
                        <TableRow key={project.id} className="cursor-pointer hover:bg-gray-50 transition-colors">
                          <TableCell>
                            <button
                              className="text-left"
                              onClick={() => router.push(`/projects/${project.id}`)}
                            >
                              <p className="font-medium text-[#0A2540] hover:underline">{project.name}</p>
                              {project.code && (
                                <p className="text-xs text-muted-foreground font-mono">{project.code}</p>
                              )}
                            </button>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {project.customers?.company_title || project.customers?.name || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(project.status)}>
                              {getStatusLabel(project.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <span className="font-semibold">
                                {Number(project.budget).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">{project.currency}</span>
                            </div>
                            {isOverBudget && (
                              <span className="text-[10px] text-red-600 font-medium">
                                {isTR ? 'Butce asildi' : 'Over budget'}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[100px]">
                              <Progress value={project.progress_percent} className="h-2 flex-1" />
                              <span className="text-xs font-medium w-8 text-right">{project.progress_percent}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${getPriorityBadge(project.priority)}`}>
                              {getPriorityLabel(project.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {project.start_date
                              ? new Date(project.start_date).toLocaleDateString(isTR ? 'tr-TR' : 'en-US')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {isTR ? 'Detay' : 'View Details'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedProjectId(project.id); setShowDetailSheet(true) }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {isTR ? 'Hizli Bakis' : 'Quick View'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setEditingProject(project); setShowEditDialog(true) }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  {isTR ? 'Duzenle' : 'Edit'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => { setDeletingProject(project); setShowDeleteDialog(true) }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {isTR ? 'Sil' : 'Delete'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        tenantId={tenantId || ''}
        onSuccess={fetchProjects}
        isTR={isTR}
      />

      {editingProject && (
        <EditProjectDialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open)
            if (!open) setEditingProject(null)
          }}
          tenantId={tenantId || ''}
          project={editingProject}
          onSuccess={fetchProjects}
          isTR={isTR}
        />
      )}

      <ProjectDetailSheet
        projectId={selectedProjectId}
        tenantId={tenantId || ''}
        open={showDetailSheet}
        onOpenChange={setShowDetailSheet}
        isTR={isTR}
      />

      {deletingProject && (
        <ConfirmDeleteDialog
          open={showDeleteDialog}
          onOpenChange={(open) => {
            setShowDeleteDialog(open)
            if (!open) setDeletingProject(null)
          }}
          onConfirm={confirmDelete}
          title={isTR ? 'Projeyi Sil' : 'Delete Project'}
          description={
            isTR
              ? `${deletingProject.name} projesini silmek istediginizden emin misiniz? Bagli kilometre taslari ve maliyet kayitlari da silinecektir.`
              : `Are you sure you want to delete project "${deletingProject.name}"? Related milestones and cost entries will also be deleted.`
          }
        />
      )}

      <Toaster />
    </DashboardLayout>
  )
}
