'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Toaster } from '@/components/ui/sonner'
import {
  Shield, CheckCircle2, XCircle, AlertCircle, Clock,
  TrendingUp, Target, Award, Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { MetricCard } from '@/components/metric-card'

interface QualityCheck {
  id: string
  production_order_id: string
  check_type: string
  result: string
  checked_by: string | null
  checked_at: string
  defect_count: number
  notes: string | null
  production_orders?: {
    product_name: string
    order_number: string
  }
}

export default function QualityPage() {
  const { tenantId, loading: tenantLoading } = useTenant()
  const { language } = useLanguage()
  const isTR = language === 'tr'

  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQualityData() {
      if (!tenantId) return

      try {
        const { data, error } = await supabase
          .from('production_quality_checks')
          .select(`
            id,
            production_order_id,
            check_type,
            result,
            checked_by,
            checked_at,
            defect_count,
            notes,
            production_orders!inner(
              product_name,
              order_number,
              tenant_id
            )
          `)
          .eq('production_orders.tenant_id', tenantId)
          .order('checked_at', { ascending: false })
          .limit(50)

        if (error) throw error
        setQualityChecks(data || [])
      } catch (error) {
        console.error('Error fetching quality data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!tenantLoading && tenantId) {
      fetchQualityData()
    }
  }, [tenantId, tenantLoading])

  const totalChecks = qualityChecks.length
  const passedChecks = qualityChecks.filter(q => q.result === 'passed').length
  const failedChecks = qualityChecks.filter(q => q.result === 'failed').length
  const conditionalChecks = qualityChecks.filter(q => q.result === 'conditional').length

  const totalDefects = qualityChecks.reduce((sum, q) => sum + (q.defect_count || 0), 0)

  const passRate = totalChecks > 0
    ? ((passedChecks / totalChecks) * 100).toFixed(1)
    : 0

  function getStatusBadge(result: string) {
    const map: Record<string, { class: string; icon: any }> = {
      passed: { class: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      failed: { class: 'bg-red-100 text-red-800', icon: XCircle },
      conditional: { class: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    }
    return map[result] || { class: 'bg-gray-100 text-gray-800', icon: AlertCircle }
  }

  function getStatusLabel(result: string) {
    if (isTR) {
      const map: Record<string, string> = {
        passed: 'Başarılı',
        failed: 'Başarısız',
        conditional: 'Koşullu',
      }
      return map[result] || result
    }
    return result.charAt(0).toUpperCase() + result.slice(1)
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
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0A192F] to-[#1B3A5C]">
            <Shield className="h-6 w-6 text-[#7DD3FC]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isTR ? 'Kalite Kontrol' : 'Quality Control'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isTR
                ? 'Üretim kalite kontrol sonuçlarını izleyin'
                : 'Monitor production quality control results'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title={isTR ? 'Toplam Kontrol' : 'Total Checks'}
            value={totalChecks.toString()}
            icon={Target}
            iconColor="bg-blue-50"
          />
          <MetricCard
            title={isTR ? 'Başarılı' : 'Passed'}
            value={passedChecks.toString()}
            icon={CheckCircle2}
            iconColor="bg-green-50"
          />
          <MetricCard
            title={isTR ? 'Başarısız' : 'Failed'}
            value={failedChecks.toString()}
            icon={XCircle}
            iconColor="bg-red-50"
          />
          <MetricCard
            title={isTR ? 'Başarı Oranı' : 'Pass Rate'}
            value={`${passRate}%`}
            icon={Award}
            iconColor="bg-purple-50"
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">{isTR ? 'Genel Bakış' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="checks">{isTR ? 'Kalite Kontrolleri' : 'Quality Checks'}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {isTR ? 'Toplam Kontrol' : 'Total Checks'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalChecks.toLocaleString('tr-TR')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isTR ? 'kalite kontrolü' : 'quality checks'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {isTR ? 'Başarı Oranı' : 'Pass Rate'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {passRate}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isTR ? `${passedChecks} başarılı` : `${passedChecks} passed`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {isTR ? 'Toplam Hata' : 'Total Defects'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {totalDefects.toLocaleString('tr-TR')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isTR ? 'hatalı ürün' : 'defective items'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{isTR ? 'Durum Dağılımı' : 'Status Distribution'}</CardTitle>
                <CardDescription>
                  {isTR ? 'Kalite kontrol sonuçlarının dağılımı' : 'Distribution of quality control results'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-medium">{isTR ? 'Başarılı' : 'Passed'}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{passedChecks}</p>
                      <p className="text-xs text-muted-foreground">
                        {totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="font-medium">{isTR ? 'Başarısız' : 'Failed'}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{failedChecks}</p>
                      <p className="text-xs text-muted-foreground">
                        {totalChecks > 0 ? ((failedChecks / totalChecks) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium">{isTR ? 'Koşullu' : 'Conditional'}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{conditionalChecks}</p>
                      <p className="text-xs text-muted-foreground">
                        {totalChecks > 0 ? ((conditionalChecks / totalChecks) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isTR ? 'Kalite Kontrol Kayıtları' : 'Quality Check Records'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">{isTR ? 'Ürün' : 'Product'}</TableHead>
                        <TableHead className="font-semibold">{isTR ? 'Kontrol Tipi' : 'Check Type'}</TableHead>
                        <TableHead className="font-semibold">{isTR ? 'Sonuç' : 'Result'}</TableHead>
                        <TableHead className="font-semibold text-right">{isTR ? 'Hata Sayısı' : 'Defects'}</TableHead>
                        <TableHead className="font-semibold">{isTR ? 'Kontrol Eden' : 'Inspector'}</TableHead>
                        <TableHead className="font-semibold">{isTR ? 'Tarih' : 'Date'}</TableHead>
                        <TableHead className="font-semibold">{isTR ? 'Not' : 'Notes'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {qualityChecks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                            {isTR ? 'Kalite kontrol kaydı bulunamadı' : 'No quality check records found'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        qualityChecks.map((check) => {
                          const statusInfo = getStatusBadge(check.result)
                          const StatusIcon = statusInfo.icon
                          return (
                            <TableRow key={check.id}>
                              <TableCell>
                                <p className="font-medium">{check.production_orders?.product_name || '-'}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {check.production_orders?.order_number || '-'}
                                </p>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm">{check.check_type || '-'}</p>
                              </TableCell>
                              <TableCell>
                                <Badge className={statusInfo.class}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {getStatusLabel(check.result)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={check.defect_count > 0 ? 'text-red-600 font-medium' : ''}>
                                  {check.defect_count.toLocaleString('tr-TR')}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm">
                                {check.checked_by || '-'}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(check.checked_at).toLocaleDateString(isTR ? 'tr-TR' : 'en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                {check.notes || '-'}
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
          </TabsContent>
        </Tabs>
      </div>

      <Toaster />
    </DashboardLayout>
  )
}
