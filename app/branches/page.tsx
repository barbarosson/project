'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from '@/components/ui/sonner'
import { Building2, Plus, Loader2, Sparkles, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'
import { BranchStatsCards } from '@/components/branches/branch-stats-cards'
import { CreateBranchDialog } from '@/components/branches/create-branch-dialog'
import { EditBranchDialog } from '@/components/branches/edit-branch-dialog'
import { BranchComparisonCards } from '@/components/branches/branch-comparison-cards'
import { BranchPerformanceTable } from '@/components/branches/branch-performance-table'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'

export default function BranchesPage() {
  const { tenantId, loading: tenantLoading } = useTenant()
  const { language } = useLanguage()
  const isTR = language === 'tr'

  const [branches, setBranches] = useState<any[]>([])
  const [performance, setPerformance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingBranch, setEditingBranch] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingBranch, setDeletingBranch] = useState<any>(null)

  const fetchData = useCallback(async () => {
    if (!tenantId) return
    try {
      const { data: brData, error: brError } = await supabase
        .from('branches')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('is_headquarters', { ascending: false })
        .order('name')

      if (brError) throw brError
      setBranches(brData || [])

      const { data: perfData } = await supabase
        .from('branch_performance_summary')
        .select('*')
        .eq('tenant_id', tenantId)

      setPerformance(perfData || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    if (!tenantLoading && tenantId) fetchData()
  }, [tenantId, tenantLoading, fetchData])

  const totalRevenue = performance.reduce((sum, p) => sum + Number(p.revenue || 0), 0)
  const totalExpenses = performance.reduce((sum, p) => sum + Number(p.expenses || 0), 0)
  const totalProfit = totalRevenue - totalExpenses
  const totalInvoices = performance.reduce((sum, p) => sum + Number(p.invoice_count || 0), 0)
  const totalOrders = performance.reduce((sum, p) => sum + Number(p.order_count || 0), 0)

  const stats = {
    totalBranches: branches.filter(b => b.is_active).length,
    totalRevenue,
    totalExpenses,
    totalProfit,
    totalInvoices,
    totalOrders,
  }

  const underperforming = performance.filter(p => Number(p.profit) < 0)
  const bestBranch = performance.length > 0
    ? performance.reduce((best, curr) => Number(curr.profit) > Number(best.profit) ? curr : best, performance[0])
    : null

  async function confirmDelete() {
    if (!deletingBranch || !tenantId) return
    try {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', deletingBranch.id)
        .eq('tenant_id', tenantId)

      if (error) throw error
      toast.success(isTR ? 'Sube silindi' : 'Branch deleted')
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Error')
    } finally {
      setShowDeleteDialog(false)
      setDeletingBranch(null)
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
              <Building2 className="h-6 w-6 text-[#7DD3FC]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isTR ? 'Sube Yonetimi' : 'Branch Management'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isTR
                  ? 'Bolgesel performans takibi, kar merkezi analizi ve kaynak optimizasyonu'
                  : 'Regional performance tracking, profit center analysis, and resource optimization'}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-[#2ECC71] hover:bg-[#27AE60]">
            <Plus className="h-4 w-4 mr-2" />
            {isTR ? 'Yeni Sube' : 'New Branch'}
          </Button>
        </div>

        <BranchStatsCards stats={stats} isTR={isTR} />

        {branches.length >= 2 && bestBranch && (
          <Card className="border-l-4 border-l-[#7DD3FC] bg-gradient-to-r from-blue-50/50 to-white">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#7DD3FC]" />
                <CardTitle className="text-sm text-[#0D1B2A]">
                  {isTR ? 'MODULUS AI: Sube Denetcisi' : 'MODULUS AI: Branch Auditor'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {underperforming.length > 0 ? (
                  isTR
                    ? `Verimlilik Uyarisi: ${underperforming.map(u => u.branch_name).join(', ')} sube${underperforming.length > 1 ? 'leri' : 'si'} zarar ediyor. En basarili sube ${bestBranch.branch_name} (${Number(bestBranch.profit_margin_pct).toFixed(1)}% kar marji). Dusuk performansli subelerin gider yapilarini incelemenizi ve ${bestBranch.branch_name} sube modelini uygulamanizi oneriyoruz.`
                    : `Efficiency Alert: ${underperforming.map(u => u.branch_name).join(', ')} ${underperforming.length > 1 ? 'are' : 'is'} operating at a loss. Top performer is ${bestBranch.branch_name} with ${Number(bestBranch.profit_margin_pct).toFixed(1)}% profit margin. We recommend auditing expense structures in underperforming branches and applying ${bestBranch.branch_name}'s operational model.`
                ) : (
                  isTR
                    ? `Tum subeler pozitif kar marjinda. ${bestBranch.branch_name} en yuksek karlilik oranina sahip (${Number(bestBranch.profit_margin_pct).toFixed(1)}%). Basarili uygulamalari diger subelere yaymayi dusunun.`
                    : `All branches are operating profitably. ${bestBranch.branch_name} has the highest profit margin (${Number(bestBranch.profit_margin_pct).toFixed(1)}%). Consider scaling its best practices to other branches.`
                )}
              </p>
              {underperforming.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs text-amber-700">
                    {underperforming.length} {isTR ? 'sube zarar ediyor' : 'branch(es) operating at loss'}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="branches" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="branches">{isTR ? 'Subeler' : 'Branches'}</TabsTrigger>
            <TabsTrigger value="performance">{isTR ? 'Performans Tablosu' : 'Performance Table'}</TabsTrigger>
          </TabsList>

          <TabsContent value="branches" className="mt-4">
            <BranchComparisonCards
              branches={branches}
              performance={performance}
              onEdit={(b) => { setEditingBranch(b); setShowEditDialog(true) }}
              onDelete={(b) => { setDeletingBranch(b); setShowDeleteDialog(true) }}
              isTR={isTR}
            />
          </TabsContent>

          <TabsContent value="performance" className="mt-4">
            <BranchPerformanceTable performance={performance} isTR={isTR} />
          </TabsContent>
        </Tabs>
      </div>

      <CreateBranchDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        tenantId={tenantId || ''}
        onSuccess={fetchData}
        isTR={isTR}
      />

      {editingBranch && (
        <EditBranchDialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open)
            if (!open) setEditingBranch(null)
          }}
          tenantId={tenantId || ''}
          branch={editingBranch}
          onSuccess={fetchData}
          isTR={isTR}
        />
      )}

      {deletingBranch && (
        <ConfirmDeleteDialog
          open={showDeleteDialog}
          onOpenChange={(open) => {
            setShowDeleteDialog(open)
            if (!open) setDeletingBranch(null)
          }}
          onConfirm={confirmDelete}
          title={isTR ? 'Subeyi Sil' : 'Delete Branch'}
          description={
            isTR
              ? `${deletingBranch.name} subesini silmek istediginizden emin misiniz? Subeye bagli faturalar ve giderlerden sube bilgisi kaldirilacaktir.`
              : `Are you sure you want to delete "${deletingBranch.name}"? Branch reference will be removed from linked invoices and expenses.`
          }
        />
      )}

      <Toaster />
    </DashboardLayout>
  )
}
