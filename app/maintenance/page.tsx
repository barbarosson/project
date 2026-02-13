'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Toaster } from '@/components/ui/sonner'
import {
  Activity, AlertTriangle, CheckCircle, Clock,
  Wrench, Calendar, TrendingUp, AlertCircle, Plus, Loader2
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useTenant } from '@/contexts/tenant-context'
import { MetricCard } from '@/components/metric-card'
import { supabase } from '@/lib/supabase'

interface MaintenanceWorkOrder {
  id: string
  wo_number: string
  equipment_id: string | null
  description: string
  priority: string
  status: string
  assigned_to_name: string | null
  estimated_hours: number
  actual_hours: number
  cost: number
  completed_at: string | null
  created_at: string
}

export default function MaintenancePage() {
  const { language } = useLanguage()
  const { tenantId, loading: tenantLoading } = useTenant()
  const isTR = language === 'tr'

  const [activeTab, setActiveTab] = useState('overview')
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWorkOrders() {
      if (!tenantId) return

      try {
        const { data, error } = await supabase
          .from('maintenance_work_orders')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        setWorkOrders(data || [])
      } catch (error) {
        console.error('Error fetching maintenance work orders:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!tenantLoading && tenantId) {
      fetchWorkOrders()
    }
  }, [tenantId, tenantLoading])

  const stats = {
    totalWorkOrders: workOrders.length,
    activeMaintenances: workOrders.filter(w => w.status === 'in_progress').length,
    scheduledMaintenances: workOrders.filter(w => w.status === 'scheduled').length,
    completedMaintenances: workOrders.filter(w => w.status === 'completed').length,
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

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return map[status] || 'bg-gray-100 text-gray-800'
  }

  function getStatusLabel(status: string) {
    if (isTR) {
      const map: Record<string, string> = {
        scheduled: 'Planlandı',
        in_progress: 'Devam Ediyor',
        completed: 'Tamamlandı',
        cancelled: 'İptal',
      }
      return map[status] || status
    }
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  function getPriorityBadge(priority: string) {
    const map: Record<string, string> = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      critical: 'bg-red-100 text-red-600',
    }
    return map[priority] || 'bg-gray-100 text-gray-800'
  }

  function getPriorityLabel(priority: string) {
    if (isTR) {
      const map: Record<string, string> = {
        low: 'Düşük',
        medium: 'Orta',
        high: 'Yüksek',
        critical: 'Kritik',
      }
      return map[priority] || priority
    }
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0A192F] to-[#1B3A5C]">
              <Activity className="h-6 w-6 text-[#7DD3FC]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isTR ? 'Bakım Yönetimi' : 'Maintenance Management'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isTR
                  ? 'Ekipman ve makine bakımlarını planlayın ve takip edin'
                  : 'Plan and track equipment and machinery maintenance'}
              </p>
            </div>
          </div>
          <Button className="bg-[#2ECC71] hover:bg-[#27AE60]">
            <Plus className="h-4 w-4 mr-2" />
            {isTR ? 'Yeni İş Emri' : 'New Work Order'}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title={isTR ? 'Toplam İş Emri' : 'Total Work Orders'}
            value={stats.totalWorkOrders.toString()}
            icon={Wrench}
            iconColor="bg-blue-50"
          />
          <MetricCard
            title={isTR ? 'Devam Eden' : 'Active'}
            value={stats.activeMaintenances.toString()}
            icon={Activity}
            iconColor="bg-green-50"
          />
          <MetricCard
            title={isTR ? 'Planlanmış' : 'Scheduled'}
            value={stats.scheduledMaintenances.toString()}
            icon={Calendar}
            iconColor="bg-purple-50"
          />
          <MetricCard
            title={isTR ? 'Tamamlanan' : 'Completed'}
            value={stats.completedMaintenances.toString()}
            icon={CheckCircle}
            iconColor="bg-green-50"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">{isTR ? 'Genel Bakış' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="scheduled">{isTR ? 'Planlanmış Bakımlar' : 'Scheduled'}</TabsTrigger>
            <TabsTrigger value="history">{isTR ? 'Bakım Geçmişi' : 'History'}</TabsTrigger>
            <TabsTrigger value="assets">{isTR ? 'Ekipmanlar' : 'Assets'}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{isTR ? 'Öncelikli Bakımlar' : 'Priority Maintenances'}</CardTitle>
                  <CardDescription>
                    {isTR ? 'Acil dikkat gerektiren bakımlar' : 'Maintenances requiring immediate attention'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {isTR ? 'CNC Torna - Yıllık Bakım' : 'CNC Lathe - Annual Service'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isTR ? '2 gün gecikmiş' : '2 days overdue'}
                        </p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">
                        {isTR ? 'Gecikmiş' : 'Overdue'}
                      </Badge>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {isTR ? 'Kompresör - Yağ Değişimi' : 'Compressor - Oil Change'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isTR ? 'Yarın planlandı' : 'Scheduled for tomorrow'}
                        </p>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">
                        {isTR ? 'Yaklaşıyor' : 'Due Soon'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{isTR ? 'Bakım İstatistikleri' : 'Maintenance Statistics'}</CardTitle>
                  <CardDescription>
                    {isTR ? 'Bu ayki performans özeti' : 'Performance summary for this month'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{isTR ? 'Tamamlanan' : 'Completed'}</span>
                      </div>
                      <span className="font-semibold">{stats.completedMaintenances}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{isTR ? 'Devam Eden' : 'In Progress'}</span>
                      </div>
                      <span className="font-semibold">{stats.activeMaintenances}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">{isTR ? 'Planlanmış' : 'Scheduled'}</span>
                      </div>
                      <span className="font-semibold">{stats.scheduledMaintenances}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm">{isTR ? 'Toplam İş Emri' : 'Total Work Orders'}</span>
                      </div>
                      <span className="font-semibold">{stats.totalWorkOrders}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{isTR ? 'Bu Haftanın Bakım Planı' : 'This Week\'s Maintenance Schedule'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50">
                        <Wrench className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {isTR ? 'Enjeksiyon Makinesi #3 - Periyodik Kontrol' : 'Injection Machine #3 - Periodic Check'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isTR ? 'Pazartesi, 14:00' : 'Monday, 2:00 PM'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{isTR ? 'Planlandı' : 'Scheduled'}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-50">
                        <Wrench className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {isTR ? 'Kazan - Güvenlik Kontrolü' : 'Boiler - Safety Inspection'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isTR ? 'Çarşamba, 09:00' : 'Wednesday, 9:00 AM'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{isTR ? 'Planlandı' : 'Scheduled'}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-50">
                        <Wrench className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {isTR ? 'Paketleme Hattı - Kalibrasyon' : 'Packaging Line - Calibration'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isTR ? 'Cuma, 16:00' : 'Friday, 4:00 PM'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{isTR ? 'Planlandı' : 'Scheduled'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isTR ? 'Tüm İş Emirleri' : 'All Work Orders'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">{isTR ? 'İş Emri No' : 'WO Number'}</TableHead>
                        <TableHead className="font-semibold">{isTR ? 'Açıklama' : 'Description'}</TableHead>
                        <TableHead className="font-semibold">{isTR ? 'Durum' : 'Status'}</TableHead>
                        <TableHead className="font-semibold">{isTR ? 'Öncelik' : 'Priority'}</TableHead>
                        <TableHead className="font-semibold">{isTR ? 'Atanan' : 'Assigned To'}</TableHead>
                        <TableHead className="font-semibold text-right">{isTR ? 'Süre (Saat)' : 'Hours'}</TableHead>
                        <TableHead className="font-semibold text-right">{isTR ? 'Maliyet' : 'Cost'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                            {isTR ? 'İş emri bulunamadı' : 'No work orders found'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        workOrders.map((wo) => (
                          <TableRow key={wo.id}>
                            <TableCell className="font-mono font-medium">{wo.wo_number}</TableCell>
                            <TableCell className="max-w-[300px] truncate">{wo.description}</TableCell>
                            <TableCell>
                              <Badge className={getStatusBadge(wo.status)}>
                                {getStatusLabel(wo.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPriorityBadge(wo.priority)}>
                                {getPriorityLabel(wo.priority)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{wo.assigned_to_name || '-'}</TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm">
                                {wo.actual_hours > 0 ? wo.actual_hours : wo.estimated_hours}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {wo.cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isTR ? 'Tamamlanan Bakımlar' : 'Completed Maintenance'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">{isTR ? 'İş Emri No' : 'WO Number'}</TableHead>
                        <TableHead className="font-semibold">{isTR ? 'Açıklama' : 'Description'}</TableHead>
                        <TableHead className="font-semibold">{isTR ? 'Tamamlanma Tarihi' : 'Completed Date'}</TableHead>
                        <TableHead className="font-semibold text-right">{isTR ? 'Maliyet' : 'Cost'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workOrders.filter(w => w.status === 'completed').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                            {isTR ? 'Tamamlanan bakım bulunamadı' : 'No completed maintenance found'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        workOrders
                          .filter(w => w.status === 'completed')
                          .map((wo) => (
                            <TableRow key={wo.id}>
                              <TableCell className="font-mono font-medium">{wo.wo_number}</TableCell>
                              <TableCell className="max-w-[300px] truncate">{wo.description}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {wo.completed_at
                                  ? new Date(wo.completed_at).toLocaleDateString(isTR ? 'tr-TR' : 'en-US')
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {wo.cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isTR ? 'Ekipman Durumu' : 'Equipment Status'}</CardTitle>
                <CardDescription>
                  {isTR ? 'Bakım gerektiren ekipmanlar' : 'Equipment requiring maintenance'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>{isTR ? 'Ekipman listesi bakım modülü ile entegre edilecek' : 'Equipment list will be integrated with maintenance module'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Toaster />
    </DashboardLayout>
  )
}
