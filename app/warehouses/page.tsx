'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Toaster } from '@/components/ui/sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Warehouse, Plus, MoreVertical, Edit, Trash2, Loader2,
  ArrowRightLeft, ClipboardList, Package, MapPin, Sparkles, AlertTriangle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'
import { WarehouseStatsCards } from '@/components/warehouse/warehouse-stats-cards'
import { CreateWarehouseDialog } from '@/components/warehouse/create-warehouse-dialog'
import { EditWarehouseDialog } from '@/components/warehouse/edit-warehouse-dialog'
import { WarehouseTransferDialog } from '@/components/warehouse/warehouse-transfer-dialog'
import { WarehouseStockAdjustmentDialog } from '@/components/warehouse/warehouse-stock-adjustment-dialog'
import { WarehouseStockTable } from '@/components/warehouse/warehouse-stock-table'
import { WarehouseTransferHistory } from '@/components/warehouse/warehouse-transfer-history'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'

export default function WarehousesPage() {
  const { tenantId, loading: tenantLoading } = useTenant()
  const { language } = useLanguage()
  const isTR = language === 'tr'

  const [warehouses, setWarehouses] = useState<any[]>([])
  const [warehouseStockCounts, setWarehouseStockCounts] = useState<Record<string, { products: number; value: number }>>({})
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingWarehouse, setDeletingWarehouse] = useState<any>(null)
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [monthlyMovements, setMonthlyMovements] = useState({ inflow: 0, outflow: 0 })

  const fetchData = useCallback(async () => {
    if (!tenantId) return
    try {
      const { data: whData, error: whError } = await supabase
        .from('warehouses')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('is_main', { ascending: false })
        .order('name')

      if (whError) throw whError
      setWarehouses(whData || [])

      const { data: stockSummary } = await supabase
        .from('warehouse_inventory_summary')
        .select('warehouse_id, warehouse_quantity, stock_value, stock_status')
        .eq('tenant_id', tenantId)
        .gt('warehouse_quantity', 0)

      const counts: Record<string, { products: number; value: number }> = {}
      const lowItems: any[] = []

      for (const row of stockSummary || []) {
        if (!counts[row.warehouse_id]) {
          counts[row.warehouse_id] = { products: 0, value: 0 }
        }
        counts[row.warehouse_id].products++
        counts[row.warehouse_id].value += Number(row.stock_value || 0)

        if (row.stock_status === 'low_stock' || row.stock_status === 'out_of_stock') {
          lowItems.push(row)
        }
      }

      setWarehouseStockCounts(counts)
      setLowStockItems(lowItems)

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: movements } = await supabase
        .from('stock_movements')
        .select('movement_type, quantity')
        .eq('tenant_id', tenantId)
        .gte('created_at', thirtyDaysAgo.toISOString())

      let inflow = 0
      let outflow = 0
      for (const m of movements || []) {
        if (m.movement_type === 'in') inflow += Number(m.quantity)
        else outflow += Number(m.quantity)
      }
      setMonthlyMovements({ inflow, outflow })
    } catch (error) {
      console.error('Error fetching warehouses:', error)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    if (!tenantLoading && tenantId) fetchData()
  }, [tenantId, tenantLoading, fetchData])

  const totalValue = Object.values(warehouseStockCounts).reduce((sum, c) => sum + c.value, 0)
  const totalProducts = new Set(
    Object.keys(warehouseStockCounts)
  ).size

  const stats = {
    totalWarehouses: warehouses.filter(w => w.is_active).length,
    totalProducts: totalProducts,
    lowStockItems: lowStockItems.length,
    totalValue,
    monthlyInflow: monthlyMovements.inflow,
    monthlyOutflow: monthlyMovements.outflow,
  }

  async function confirmDelete() {
    if (!deletingWarehouse || !tenantId) return
    try {
      const { count } = await supabase
        .from('warehouse_stock')
        .select('*', { count: 'exact', head: true })
        .eq('warehouse_id', deletingWarehouse.id)
        .gt('quantity', 0)

      if (count && count > 0) {
        toast.error(isTR ? 'Bu depoda stok var, once transfer edin' : 'This warehouse has stock. Transfer it first.')
        setShowDeleteDialog(false)
        return
      }

      const { error } = await supabase
        .from('warehouses')
        .delete()
        .eq('id', deletingWarehouse.id)
        .eq('tenant_id', tenantId)

      if (error) throw error
      toast.success(isTR ? 'Depo silindi' : 'Warehouse deleted')
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Error')
    } finally {
      setShowDeleteDialog(false)
      setDeletingWarehouse(null)
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
              <Warehouse className="h-6 w-6 text-[#7DD3FC]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isTR ? 'Depo ve Stok Yonetimi' : 'Warehouse & Stock Control'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isTR
                  ? 'Coklu depo takibi, transfer yonetimi ve canli stok deger analizi'
                  : 'Multi-warehouse tracking, transfers, and real-time inventory valuation'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTransferDialog(true)}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              {isTR ? 'Transfer' : 'Transfer'}
            </Button>
            <Button variant="outline" onClick={() => setShowAdjustmentDialog(true)}>
              <ClipboardList className="h-4 w-4 mr-2" />
              {isTR ? 'Stok Ayarla' : 'Adjust Stock'}
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-[#00D4AA] hover:bg-[#00B894]">
              <Plus className="h-4 w-4 mr-2" />
              {isTR ? 'Yeni Depo' : 'New Warehouse'}
            </Button>
          </div>
        </div>

        <WarehouseStatsCards stats={stats} isTR={isTR} />

        {lowStockItems.length > 0 && (
          <Card className="border-l-4 border-l-[#7DD3FC] bg-gradient-to-r from-blue-50/50 to-white">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#7DD3FC]" />
                <CardTitle className="text-sm text-[#0A2540]">
                  {isTR ? 'MODULUS AI: Akilli Yeniden Siparis' : 'MODULUS AI: Smart Reorder'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {isTR
                  ? `Mevcut satis hizina gore, ${lowStockItems.length} urun kritik seviyeye yaklasiyor. Tedarikci teslimat suresi goz onune alindiginda, uretim gecikmelerini onlemek icin bugun siparis vermenizi oneriyoruz.`
                  : `Based on current sales velocity, ${lowStockItems.length} item(s) are approaching critical levels. Considering supplier lead times, we recommend placing orders today to avoid production delays.`}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {lowStockItems.slice(0, 5).map((item, i) => (
                  <Badge key={i} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                    {item.product_name}
                  </Badge>
                ))}
                {lowStockItems.length > 5 && (
                  <Badge variant="outline" className="text-muted-foreground">
                    +{lowStockItems.length - 5} {isTR ? 'daha' : 'more'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="warehouses" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="warehouses">{isTR ? 'Depolar' : 'Warehouses'}</TabsTrigger>
            <TabsTrigger value="stock">{isTR ? 'Stok Durumu' : 'Stock Levels'}</TabsTrigger>
            <TabsTrigger value="transfers">{isTR ? 'Transferler' : 'Transfers'}</TabsTrigger>
          </TabsList>

          <TabsContent value="warehouses" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {warehouses.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      {isTR ? 'Henuz depo eklenmedi' : 'No warehouses added yet'}
                    </div>
                  ) : (
                    warehouses.map(warehouse => {
                      const stockInfo = warehouseStockCounts[warehouse.id] || { products: 0, value: 0 }
                      return (
                        <Card key={warehouse.id} className={`relative overflow-hidden ${!warehouse.is_active ? 'opacity-60' : ''}`}>
                          {warehouse.is_main && (
                            <div className="absolute top-0 right-0 bg-[#7DD3FC] text-[#0A192F] text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                              {isTR ? 'ANA DEPO' : 'MAIN'}
                            </div>
                          )}
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-slate-100">
                                  <Warehouse className="h-5 w-5 text-[#0A2540]" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-[#0A2540]">{warehouse.name}</h3>
                                  {warehouse.code && (
                                    <span className="text-xs font-mono text-muted-foreground">{warehouse.code}</span>
                                  )}
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setEditingWarehouse(warehouse); setShowEditDialog(true) }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    {isTR ? 'Duzenle' : 'Edit'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => { setDeletingWarehouse(warehouse); setShowDeleteDialog(true) }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {isTR ? 'Sil' : 'Delete'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {warehouse.location && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                                <MapPin className="h-3 w-3" />
                                {warehouse.location}
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gray-50 rounded-lg p-2.5">
                                <p className="text-[10px] text-muted-foreground">{isTR ? 'Urun Cesidi' : 'Products'}</p>
                                <p className="text-lg font-bold">{stockInfo.products}</p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-2.5">
                                <p className="text-[10px] text-muted-foreground">{isTR ? 'Stok Degeri' : 'Stock Value'}</p>
                                <p className="text-lg font-bold">
                                  {stockInfo.value > 0
                                    ? Number(stockInfo.value).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                                    : '0'}
                                </p>
                              </div>
                            </div>

                            {warehouse.manager_name && (
                              <p className="text-xs text-muted-foreground mt-3">
                                {isTR ? 'Sorumlu:' : 'Manager:'} {warehouse.manager_name}
                              </p>
                            )}

                            {!warehouse.is_active && (
                              <Badge variant="outline" className="mt-2 text-[10px] border-red-200 text-red-600">
                                {isTR ? 'Pasif' : 'Inactive'}
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock" className="mt-4">
            <WarehouseStockTable tenantId={tenantId || ''} warehouses={warehouses} isTR={isTR} />
          </TabsContent>

          <TabsContent value="transfers" className="mt-4">
            <WarehouseTransferHistory tenantId={tenantId || ''} isTR={isTR} />
          </TabsContent>
        </Tabs>
      </div>

      <CreateWarehouseDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        tenantId={tenantId || ''}
        onSuccess={fetchData}
        isTR={isTR}
      />

      {editingWarehouse && (
        <EditWarehouseDialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open)
            if (!open) setEditingWarehouse(null)
          }}
          tenantId={tenantId || ''}
          warehouse={editingWarehouse}
          onSuccess={fetchData}
          isTR={isTR}
        />
      )}

      <WarehouseTransferDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        tenantId={tenantId || ''}
        warehouses={warehouses}
        onSuccess={fetchData}
        isTR={isTR}
      />

      <WarehouseStockAdjustmentDialog
        open={showAdjustmentDialog}
        onOpenChange={setShowAdjustmentDialog}
        tenantId={tenantId || ''}
        warehouses={warehouses}
        onSuccess={fetchData}
        isTR={isTR}
      />

      {deletingWarehouse && (
        <ConfirmDeleteDialog
          open={showDeleteDialog}
          onOpenChange={(open) => {
            setShowDeleteDialog(open)
            if (!open) setDeletingWarehouse(null)
          }}
          onConfirm={confirmDelete}
          title={isTR ? 'Depoyu Sil' : 'Delete Warehouse'}
          description={
            isTR
              ? `${deletingWarehouse.name} deposunu silmek istediginizden emin misiniz? Depoda stok varsa once transfer etmeniz gerekir.`
              : `Are you sure you want to delete warehouse "${deletingWarehouse.name}"? Stock must be transferred first if it has inventory.`
          }
        />
      )}

      <Toaster />
    </DashboardLayout>
  )
}
