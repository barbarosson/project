'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Loader2, DollarSign, Package, Users, Zap, TrendingUp, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ProductionCostDashboardProps {
  productionOrderId: string
  tenantId: string
  isTR: boolean
}

export function ProductionCostDashboard({ productionOrderId, tenantId, isTR }: ProductionCostDashboardProps) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const { data, error } = await supabase
          .from('production_cost_analytics')
          .select('*')
          .eq('production_order_id', productionOrderId)
          .eq('tenant_id', tenantId)
          .maybeSingle()

        if (error) throw error
        setAnalytics(data)
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [productionOrderId, tenantId])

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {isTR ? 'Maliyet verisi bulunamadi' : 'No cost data available'}
      </div>
    )
  }

  const estimatedTotal = analytics.estimated_unit_cost * analytics.quantity_target
  const costEfficiency = estimatedTotal > 0
    ? Math.round((analytics.total_production_cost / estimatedTotal) * 100)
    : 0
  const isOverBudget = costEfficiency > 100
  const materialShare = analytics.total_production_cost > 0
    ? Math.round((analytics.total_material_cost / analytics.total_production_cost) * 100)
    : 0
  const laborShare = analytics.total_production_cost > 0
    ? Math.round((analytics.total_labor_cost / analytics.total_production_cost) * 100)
    : 0
  const overheadShare = analytics.total_production_cost > 0
    ? Math.round((analytics.total_overhead_cost / analytics.total_production_cost) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#7DD3FC]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {isTR ? 'Tahmini Toplam Maliyet' : 'Estimated Total Cost'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {estimatedTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">
              {Number(analytics.estimated_unit_cost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} x {analytics.quantity_target} {isTR ? 'adet' : 'units'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {isTR ? 'Gercek Toplam Maliyet' : 'Actual Total Cost'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {Number(analytics.total_production_cost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">TRY</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${isOverBudget ? 'border-l-red-500' : 'border-l-green-500'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {isTR ? 'Gercek Birim Maliyet' : 'Actual Unit Cost'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              {Number(analytics.actual_unit_cost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">
              {isTR ? 'Tahmini:' : 'Est:'} {Number(analytics.estimated_unit_cost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">{isTR ? 'Uretim Tamamlanma' : 'Completion'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-teal-600">{analytics.completion_percent}%</p>
            <p className="text-xs text-muted-foreground">
              {analytics.quantity_produced} / {analytics.quantity_target} {isTR ? 'adet' : 'units'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{isTR ? 'Maliyet Butcesi Kullanimi' : 'Cost Budget Consumption'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {Number(analytics.total_production_cost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} / {estimatedTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
            </span>
            <span className={`text-sm font-bold ${isOverBudget ? 'text-red-600' : 'text-[#0A2540]'}`}>
              {costEfficiency}%
            </span>
          </div>
          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget
                  ? 'bg-gradient-to-r from-red-400 to-red-600'
                  : costEfficiency > 90
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                    : 'bg-gradient-to-r from-[#1E40AF] to-[#7DD3FC]'
              }`}
              style={{ width: `${Math.min(costEfficiency, 100)}%` }}
            />
          </div>
          {isOverBudget && (
            <div className="flex items-center gap-2 mt-3 p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-700 font-medium">
                {isTR
                  ? `Maliyet tahminin %${(costEfficiency - 100).toFixed(0)} uzerinde!`
                  : `Cost is ${(costEfficiency - 100).toFixed(0)}% over estimate!`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
              <Package className="h-3 w-3 text-blue-500" />
              {isTR ? 'Malzeme Maliyeti' : 'Material Cost'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">
              {Number(analytics.total_material_cost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={materialShare} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground">{materialShare}%</span>
            </div>
            {Number(analytics.material_variance_percent) > 5 && (
              <Badge className="mt-2 bg-red-100 text-red-700 text-[10px]">
                +{Number(analytics.material_variance_percent).toFixed(1)}% {isTR ? 'sapma' : 'variance'}
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
              <Users className="h-3 w-3 text-green-500" />
              {isTR ? 'Iscilik Maliyeti' : 'Labor Cost'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">
              {Number(analytics.total_labor_cost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={laborShare} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground">{laborShare}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Number(analytics.total_labor_hours).toFixed(1)} {isTR ? 'saat' : 'hours'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
              <Zap className="h-3 w-3 text-amber-500" />
              {isTR ? 'Genel Giderler' : 'Overhead Cost'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">
              {Number(analytics.total_overhead_cost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={overheadShare} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground">{overheadShare}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
