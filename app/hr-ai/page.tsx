'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Search,
  UserPlus,
  Brain,
  Award,
  Eye,
  Pencil,
  UserMinus,
  MoreVertical,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { AddStaffDialog } from '@/components/add-staff-dialog'
import { EditStaffDialog, type StaffRecord } from '@/components/edit-staff-dialog'
import { StaffViewSheet } from '@/components/staff-view-sheet'
import { StaffExcelImportDialog } from '@/components/staff-excel-import-dialog'

interface Staff {
  id: string
  name: string
  last_name?: string | null
  email?: string | null
  phone?: string | null
  department?: string | null
  position?: string | null
  hire_date?: string | null
  salary?: number | null
  performance_score?: number
  burnout_risk?: 'low' | 'medium' | 'high'
  churn_risk?: 'low' | 'medium' | 'high'
  status?: 'active' | 'inactive' | 'on_leave'
  created_at?: string
  national_id?: string | null
  bank_name?: string | null
  bank_iban?: string | null
  bank_account_number?: string | null
}

interface StaffAIInsight {
  id: string
  staff_id: string
  insight_type: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
}

interface PayrollSummary {
  total_monthly_cost: number
  avg_salary: number
  highest_salary: number
  lowest_salary: number
}

export default function HRAIPage() {
  const { tenantId } = useTenant()
  const { t } = useLanguage()
  const [staff, setStaff] = useState<Staff[]>([])
  const [insights, setInsights] = useState<StaffAIInsight[]>([])
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [addStaffOpen, setAddStaffOpen] = useState(false)
  const [viewStaff, setViewStaff] = useState<Staff | null>(null)
  const [viewSheetOpen, setViewSheetOpen] = useState(false)
  const [editStaff, setEditStaff] = useState<Staff | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [staffToTerminate, setStaffToTerminate] = useState<Staff | null>(null)
  const [confirmTerminateOpen, setConfirmTerminateOpen] = useState(false)
  const [excelImportOpen, setExcelImportOpen] = useState(false)

  useEffect(() => {
    if (tenantId) {
      loadData()
    }
  }, [tenantId])

  async function loadData() {
    setLoading(true)
    try {
      const tenant = tenantId != null ? String(tenantId) : ''
      const [staffRes, insightsRes] = await Promise.all([
        supabase
          .from('staff')
          .select('*')
          .eq('tenant_id', tenant)
          .order('created_at', { ascending: false }),
        supabase
          .from('staff_ai_insights')
          .select('*')
          .eq('tenant_id', tenant)
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      if (staffRes.error) throw staffRes.error

      const staffData = staffRes.data || []
      setStaff(staffData)
      setInsights(insightsRes.error ? [] : (insightsRes.data || []))

      if (staffData.length > 0) {
        const salaries = staffData.map(s => s.salary).filter(s => s > 0)
        const totalSalary = salaries.reduce((sum, s) => sum + s, 0)
        setPayrollSummary({
          total_monthly_cost: totalSalary,
          avg_salary: salaries.length > 0 ? totalSalary / salaries.length : 0,
          highest_salary: salaries.length > 0 ? Math.max(...salaries, 0) : 0,
          lowest_salary: salaries.length > 0 ? Math.min(...salaries.filter(s => s > 0), 0) : 0
        })
      } else {
        setPayrollSummary(null)
      }
    } catch (error) {
      console.error('Error loading HR data:', error)
      toast.error(t.hr.loadError)
    } finally {
      setLoading(false)
    }
  }

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.position?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeStaff = staff.filter(s => s.status === 'active').length
  const highPerformers = staff.filter(s => s.performance_score >= 80).length
  const atRiskStaff = staff.filter(s => s.burnout_risk === 'high' || s.churn_risk === 'high').length
  const avgPerformance = staff.length > 0
    ? staff.reduce((sum, s) => sum + (s.performance_score || 0), 0) / staff.length
    : 0

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high':
        return <Badge variant="destructive">{t.hr.riskHigh}</Badge>
      case 'medium':
        return <Badge className="bg-amber-500">{t.hr.riskMedium}</Badge>
      case 'low':
        return <Badge className="bg-green-500">{t.hr.riskLow}</Badge>
      default:
        return <Badge variant="secondary">{t.hr.riskUnknown}</Badge>
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return t.hr.statusActive
      case 'inactive': return t.hr.statusInactive
      case 'on_leave': return t.hr.statusOnLeave
      default: return status
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <Award className="h-4 w-4" />
      case 'burnout':
        return <AlertTriangle className="h-4 w-4" />
      case 'churn':
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  const handleTerminateConfirm = async () => {
    if (!staffToTerminate || !tenantId) return
    try {
      const { error } = await supabase
        .from('staff')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', staffToTerminate.id)
        .eq('tenant_id', String(tenantId))
      if (error) throw error
      toast.success(t.hr.staffTerminatedSuccess)
      loadData()
      setConfirmTerminateOpen(false)
      setStaffToTerminate(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (t.hr.staffUpdateError as string))
    }
  }

  const staffToRecord = (s: Staff): StaffRecord => ({
    id: s.id,
    name: s.name,
    last_name: s.last_name,
    email: s.email,
    phone: s.phone,
    national_id: s.national_id,
    department: s.department,
    position: s.position,
    bank_name: s.bank_name,
    bank_iban: s.bank_iban,
    bank_account_number: s.bank_account_number,
    hire_date: s.hire_date,
    salary: s.salary,
    status: s.status,
  })

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0A2540]/5 overflow-x-hidden">
        <div className="space-y-6 p-3 lg:p-5 text-[#0A2540]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0A2540]">{t.hr.title}</h1>
              <p className="text-[#0A2540]/80 mt-1">
                {t.hr.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setExcelImportOpen(true)}
                className="border border-input bg-white hover:bg-gray-50 font-semibold text-contrast-body"
              >
                <Upload className="h-4 w-4 mr-2" />
                {t.hr.bulkImport}
              </Button>
              <Button
                onClick={() => setAddStaffOpen(true)}
                className="bg-[#00D4AA] hover:bg-[#00B894] font-semibold text-contrast-body"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {t.hr.addStaff}
              </Button>
            </div>
          </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.hr.totalStaff}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staff.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeStaff} {t.hr.active}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.hr.highPerformers}</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highPerformers}</div>
              <p className="text-xs text-muted-foreground">
                {t.hr.score80}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.hr.atRisk}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{atRiskStaff}</div>
              <p className="text-xs text-muted-foreground">
                {t.hr.burnoutChurnRisk}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.hr.avgPerformance}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgPerformance.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {t.hr.companyAverage}
              </p>
            </CardContent>
          </Card>
        </div>

        {payrollSummary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t.hr.payrollSummary}
              </CardTitle>
              <CardDescription>{t.hr.payrollOverview}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t.hr.totalMonthlyCost}</p>
                  <p className="text-2xl font-bold">
                    {payrollSummary.total_monthly_cost.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.hr.averageSalary}</p>
                  <p className="text-2xl font-bold">
                    {payrollSummary.avg_salary.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.hr.highestSalary}</p>
                  <p className="text-2xl font-bold">
                    {payrollSummary.highest_salary.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.hr.lowestSalary}</p>
                  <p className="text-2xl font-bold">
                    {payrollSummary.lowest_salary.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {insights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                {t.hr.aiInsights}
              </CardTitle>
              <CardDescription>{t.hr.aiInsightsDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.map(insight => (
                  <div
                    key={insight.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      insight.priority === 'critical' && "border-red-500 bg-red-50 dark:bg-red-950/20",
                      insight.priority === 'high' && "border-amber-500 bg-amber-50 dark:bg-amber-950/20",
                      insight.priority === 'medium' && "border-blue-500 bg-blue-50 dark:bg-blue-950/20",
                      insight.priority === 'low' && "border-gray-300"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.insight_type)}
                      <div className="flex-1">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                      </div>
                      <Badge variant={insight.priority === 'critical' ? 'destructive' : 'secondary'}>
                        {insight.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t.hr.staffDirectory}</CardTitle>
            <CardDescription>{t.hr.staffDirectoryDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.hr.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">{t.hr.loadingStaff}</div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? t.hr.noStaffMatch : t.hr.noStaffYet}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">{t.hr.name}</th>
                      <th className="text-left p-3">{t.hr.department}</th>
                      <th className="text-left p-3">{t.hr.position}</th>
                      <th className="text-left p-3">{t.hr.performance}</th>
                      <th className="text-left p-3">{t.hr.burnoutRisk}</th>
                      <th className="text-left p-3">{t.hr.churnRisk}</th>
                      <th className="text-left p-3">{t.hr.status}</th>
                      <th className="text-left p-3 w-[60px]">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map(member => (
                      <tr key={member.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                          </div>
                        </td>
                        <td className="p-3">{member.department || '-'}</td>
                        <td className="p-3">{member.position || '-'}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full",
                                  member.performance_score >= 80 && "bg-green-500",
                                  member.performance_score >= 60 && member.performance_score < 80 && "bg-blue-500",
                                  member.performance_score < 60 && "bg-amber-500"
                                )}
                                style={{ width: `${member.performance_score}%` }}
                              />
                            </div>
                            <span className="text-sm">{member.performance_score}%</span>
                          </div>
                        </td>
                        <td className="p-3">{getRiskBadge(member.burnout_risk)}</td>
                        <td className="p-3">{getRiskBadge(member.churn_risk)}</td>
                        <td className="p-3">
                          <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                            {getStatusLabel(member.status)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="bg-slate-100 hover:bg-slate-200 text-slate-800" aria-label={t.common.actions}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setViewStaff(member); setViewSheetOpen(true) }}>
                                <Eye className="h-4 w-4 mr-2" />
                                {t.hr.viewStaff}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setEditStaff(member); setEditDialogOpen(true) }}>
                                <Pencil className="h-4 w-4 mr-2" />
                                {t.hr.editStaff}
                              </DropdownMenuItem>
                              {member.status === 'active' && (
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => { setStaffToTerminate(member); setConfirmTerminateOpen(true) }}
                                >
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  {t.hr.terminate}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <AddStaffDialog
          open={addStaffOpen}
          onOpenChange={setAddStaffOpen}
          onSuccess={loadData}
        />
        <EditStaffDialog
          staff={editStaff ? staffToRecord(editStaff) : null}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => { loadData(); setEditStaff(null) }}
        />
        <StaffViewSheet
          staff={viewStaff ? staffToRecord(viewStaff) : null}
          open={viewSheetOpen}
          onOpenChange={setViewSheetOpen}
          getStatusLabel={getStatusLabel}
        />
        <AlertDialog open={confirmTerminateOpen} onOpenChange={setConfirmTerminateOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.hr.terminateConfirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>{t.hr.terminateConfirmDesc}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={handleTerminateConfirm} className="bg-red-600 hover:bg-red-700">
                {t.hr.terminate}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <StaffExcelImportDialog open={excelImportOpen} onOpenChange={setExcelImportOpen} onSuccess={loadData} />
        </div>
      </div>
    </DashboardLayout>
  )
}
