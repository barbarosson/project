'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Toaster } from '@/components/ui/sonner'
import {
  Scale, TrendingUp, TrendingDown, DollarSign,
  Package, Users, Zap, BarChart3, Loader2, Calendar
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { MetricCard } from '@/components/metric-card'

interface CostAnalysis {
  material_cost: number
  labor_cost: number
  overhead_cost: number
  total_cost: number
  product_name?: string
  order_number?: string
  completion_percent?: number
}

export default function CostPage() {
  const { tenantId, loading: tenantLoading } = useTenant()
  const { language } = useLanguage()
  const isTR = language === 'tr'

  const [costData, setCostData] = useState<CostAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCostData() {
      if (!tenantId) return

      try {
        const { data, error } = await supabase
          .from('production_cost_analytics')
          .select(`
            *,
            production_orders(product_name, order_number)
          `)
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error

        const mappedData = (data || []).map(item => ({
          material_cost: item.material_cost || 0,
          labor_cost: item.labor_cost || 0,
          overhead_cost: item.overhead_cost || 0,
          total_cost: item.total_production_cost || 0,
          product_name: item.production_orders?.product_name,
          order_number: item.production_orders?.order_number,
          completion_percent: item.completion_percent || 0,
        }))

        setCostData(mappedData)
      } catch (error) {
        console.error('Error fetching cost data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!tenantLoading && tenantId) {
      fetchCostData()
    }
  }, [tenantId, tenantLoading])

  const totalMaterialCost = costData.reduce((sum, item) => sum + item.material_cost, 0)
  const totalLaborCost = costData.reduce((sum, item) => sum + item.labor_cost, 0)
  const totalOverheadCost = costData.reduce((sum, item) => sum + item.overhead_cost, 0)
  const grandTotal = costData.reduce((sum, item) => sum + item.total_cost, 0)

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
            <Scale className="h-6 w-6 text-[#7DD3FC]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isTR ? 'Maliyet Analizi' : 'Cost Analysis'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isTR
                ? 'Üretim maliyetlerini ve kar marjlarını izleyin'
                : 'Monitor production costs and profit margins'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title={isTR ? 'Toplam Maliyet' : 'Total Cost'}
            value={`${grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`}
            icon={DollarSign}
            iconColor="bg-green-50"
          />
          <MetricCard
            title={isTR ? 'Hammadde Maliyeti' : 'Material Cost'}
            value={`${totalMaterialCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`}
            icon={Package}
            iconColor="bg-blue-50"
          />
          <MetricCard
            title={isTR ? 'İşçilik Maliyeti' : 'Labor Cost'}
            value={`${totalLaborCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`}
            icon={Users}
            iconColor="bg-purple-50"
          />
          <MetricCard
            title={isTR ? 'Genel Gider' : 'Overhead Cost'}
            value={`${totalOverheadCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`}
            icon={Zap}
            iconColor="bg-orange-50"
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">{isTR ? 'Genel Bakış' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="analysis">{isTR ? 'Detaylı Analiz' : 'Detailed Analysis'}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isTR ? 'Maliyet Dağılımı' : 'Cost Distribution'}</CardTitle>
                <CardDescription>
                  {isTR
                    ? 'Üretim maliyetlerinin kategori bazında dağılımı'
                    : 'Distribution of production costs by category'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">{isTR ? 'Hammadde' : 'Materials'}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {totalMaterialCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {grandTotal > 0 ? ((totalMaterialCost / grandTotal) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">{isTR ? 'İşçilik' : 'Labor'}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {totalLaborCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {grandTotal > 0 ? ((totalLaborCost / grandTotal) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-orange-600" />
                      <span className="font-medium">{isTR ? 'Genel Gider' : 'Overhead'}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {totalOverheadCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {grandTotal > 0 ? ((totalOverheadCost / grandTotal) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isTR ? 'Üretim Emri Bazında Maliyet' : 'Cost by Production Order'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">{isTR ? 'Ürün' : 'Product'}</TableHead>
                        <TableHead className="font-semibold text-right">{isTR ? 'Hammadde' : 'Material'}</TableHead>
                        <TableHead className="font-semibold text-right">{isTR ? 'İşçilik' : 'Labor'}</TableHead>
                        <TableHead className="font-semibold text-right">{isTR ? 'Genel Gider' : 'Overhead'}</TableHead>
                        <TableHead className="font-semibold text-right">{isTR ? 'Toplam' : 'Total'}</TableHead>
                        <TableHead className="font-semibold">{isTR ? 'İlerleme' : 'Progress'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                            {isTR ? 'Maliyet verisi bulunamadı' : 'No cost data found'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        costData.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <p className="font-medium">{item.product_name || '-'}</p>
                              <p className="text-xs text-muted-foreground font-mono">{item.order_number || '-'}</p>
                            </TableCell>
                            <TableCell className="text-right">
                              {item.material_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </TableCell>
                            <TableCell className="text-right">
                              {item.labor_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </TableCell>
                            <TableCell className="text-right">
                              {item.overhead_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {item.total_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {item.completion_percent?.toFixed(0) || 0}%
                              </Badge>
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
        </Tabs>
      </div>

      <Toaster />
    </DashboardLayout>
  )
}
