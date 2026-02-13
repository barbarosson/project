'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Clock,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Staff {
  id: string
  name: string
  email: string
  phone: string
  department: string
  position: string
  hire_date: string
  salary: number
  performance_score: number
  burnout_risk: 'low' | 'medium' | 'high'
  churn_risk: 'low' | 'medium' | 'high'
  status: 'active' | 'inactive' | 'on_leave'
  created_at: string
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

  useEffect(() => {
    if (tenantId) {
      loadData()
    }
  }, [tenantId])

  async function loadData() {
    setLoading(true)
    try {
      const [staffRes, insightsRes] = await Promise.all([
        supabase
          .from('staff')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false }),
        supabase
          .from('staff_ai_insights')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      if (staffRes.error) throw staffRes.error
      if (insightsRes.error) throw insightsRes.error

      const staffData = staffRes.data || []
      setStaff(staffData)
      setInsights(insightsRes.data || [])

      if (staffData.length > 0) {
        const salaries = staffData.map(s => s.salary).filter(s => s > 0)
        const totalSalary = salaries.reduce((sum, s) => sum + s, 0)
        setPayrollSummary({
          total_monthly_cost: totalSalary,
          avg_salary: salaries.length > 0 ? totalSalary / salaries.length : 0,
          highest_salary: Math.max(...salaries, 0),
          lowest_salary: Math.min(...salaries.filter(s => s > 0), 0)
        })
      }
    } catch (error) {
      console.error('Error loading HR data:', error)
      toast.error('Failed to load HR data')
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
        return <Badge variant="destructive">High</Badge>
      case 'medium':
        return <Badge className="bg-amber-500">Medium</Badge>
      case 'low':
        return <Badge className="bg-green-500">Low</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">HR AI</h1>
            <p className="text-muted-foreground mt-1">
              AI-powered human resources management and insights
            </p>
          </div>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staff.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeStaff} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Performers</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highPerformers}</div>
              <p className="text-xs text-muted-foreground">
                Score 80+
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{atRiskStaff}</div>
              <p className="text-xs text-muted-foreground">
                Burnout or churn risk
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgPerformance.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Company average
              </p>
            </CardContent>
          </Card>
        </div>

        {payrollSummary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payroll Summary
              </CardTitle>
              <CardDescription>Monthly payroll overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Monthly Cost</p>
                  <p className="text-2xl font-bold">
                    {payrollSummary.total_monthly_cost.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Salary</p>
                  <p className="text-2xl font-bold">
                    {payrollSummary.avg_salary.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Highest Salary</p>
                  <p className="text-2xl font-bold">
                    {payrollSummary.highest_salary.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lowest Salary</p>
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
                AI Insights
              </CardTitle>
              <CardDescription>Recent AI-generated insights about your team</CardDescription>
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
            <CardTitle>Staff Directory</CardTitle>
            <CardDescription>Manage your team members and track performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, department, or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading staff...</div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No staff found matching your search' : 'No staff members yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Department</th>
                      <th className="text-left p-3">Position</th>
                      <th className="text-left p-3">Performance</th>
                      <th className="text-left p-3">Burnout Risk</th>
                      <th className="text-left p-3">Churn Risk</th>
                      <th className="text-left p-3">Status</th>
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
                            {member.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
