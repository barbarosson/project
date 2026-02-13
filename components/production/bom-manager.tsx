'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, Trash2, Loader2, Package, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface BomManagerProps {
  productionOrderId: string
  tenantId: string
  isTR: boolean
  readOnly?: boolean
}

export function BomManager({ productionOrderId, tenantId, isTR, readOnly }: BomManagerProps) {
  const [items, setItems] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState({
    product_id: '',
    product_name: '',
    planned_quantity: '',
    unit_cost: '',
    unit: 'piece',
  })

  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('production_bom_items')
        .select('*, products:product_id(name, sku, current_stock, purchase_price)')
        .eq('production_order_id', productionOrderId)
        .order('created_at')

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error fetching BOM items:', error)
    } finally {
      setLoading(false)
    }
  }, [productionOrderId])

  useEffect(() => {
    fetchItems()
    supabase
      .from('products')
      .select('id, name, sku, current_stock, purchase_price, unit')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('name')
      .then(({ data }) => setProducts(data || []))
  }, [productionOrderId, tenantId, fetchItems])

  function handleProductSelect(productId: string) {
    if (productId === 'custom') {
      setNewItem({ ...newItem, product_id: '', product_name: '', unit_cost: '' })
      return
    }
    const product = products.find(p => p.id === productId)
    if (product) {
      setNewItem({
        ...newItem,
        product_id: productId,
        product_name: product.name,
        unit_cost: product.purchase_price ? String(product.purchase_price) : '',
        unit: product.unit || 'piece',
      })
    }
  }

  async function handleAdd() {
    if (!newItem.product_name.trim() || !newItem.planned_quantity) {
      toast.error(isTR ? 'Malzeme adi ve miktar zorunludur' : 'Material name and quantity are required')
      return
    }

    setAdding(true)
    try {
      const { error } = await supabase.from('production_bom_items').insert({
        production_order_id: productionOrderId,
        product_id: newItem.product_id || null,
        product_name: newItem.product_name,
        planned_quantity: Number(newItem.planned_quantity),
        unit_cost: Number(newItem.unit_cost) || 0,
        unit: newItem.unit,
      })

      if (error) throw error
      toast.success(isTR ? 'Malzeme eklendi' : 'Material added')
      setNewItem({ product_id: '', product_name: '', planned_quantity: '', unit_cost: '', unit: 'piece' })
      fetchItems()
    } catch (error: any) {
      toast.error(error.message || 'Error')
    } finally {
      setAdding(false)
    }
  }

  async function handleUpdateActual(itemId: string, actualQty: string) {
    try {
      const { error } = await supabase
        .from('production_bom_items')
        .update({ actual_quantity: Number(actualQty) || 0 })
        .eq('id', itemId)

      if (error) throw error
      fetchItems()
    } catch (error: any) {
      toast.error(error.message || 'Error')
    }
  }

  async function handleDelete(itemId: string) {
    try {
      const { error } = await supabase
        .from('production_bom_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      toast.success(isTR ? 'Malzeme silindi' : 'Material removed')
      fetchItems()
    } catch (error: any) {
      toast.error(error.message || 'Error')
    }
  }

  const totalPlannedCost = items.reduce((sum, i) => sum + (i.planned_quantity * i.unit_cost), 0)
  const totalActualCost = items.reduce((sum, i) => sum + (i.actual_quantity * i.unit_cost), 0)
  const variance = totalPlannedCost > 0
    ? ((totalActualCost - totalPlannedCost) / totalPlannedCost * 100)
    : 0

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">{isTR ? 'Planlanan Malzeme Maliyeti' : 'Planned Material Cost'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{totalPlannedCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">{isTR ? 'Gerceklesen Malzeme Maliyeti' : 'Actual Material Cost'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{totalActualCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">{isTR ? 'Sapma' : 'Variance'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${variance > 5 ? 'text-red-600' : variance < -5 ? 'text-green-600' : 'text-gray-900'}`}>
              {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {!readOnly && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-[#7DD3FC]" />
              {isTR ? 'Malzeme Ekle' : 'Add Material'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={newItem.product_id || 'custom'}
                onValueChange={handleProductSelect}
              >
                <SelectTrigger className="sm:w-[200px]">
                  <SelectValue placeholder={isTR ? 'Urun sec' : 'Select product'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">{isTR ? 'Manuel giris' : 'Manual entry'}</SelectItem>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.sku ? `[${p.sku}] ` : ''}{p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!newItem.product_id && (
                <Input
                  placeholder={isTR ? 'Malzeme adi' : 'Material name'}
                  value={newItem.product_name}
                  onChange={e => setNewItem({ ...newItem, product_name: e.target.value })}
                  className="sm:w-[160px]"
                />
              )}
              <Input
                type="number"
                placeholder={isTR ? 'Miktar' : 'Qty'}
                value={newItem.planned_quantity}
                onChange={e => setNewItem({ ...newItem, planned_quantity: e.target.value })}
                className="sm:w-[100px]"
                min={0}
              />
              <Input
                type="number"
                placeholder={isTR ? 'Birim Maliyet' : 'Unit Cost'}
                value={newItem.unit_cost}
                onChange={e => setNewItem({ ...newItem, unit_cost: e.target.value })}
                className="sm:w-[120px]"
                min={0}
                step={0.01}
              />
              <Button onClick={handleAdd} disabled={adding} size="sm" className="bg-[#00D4AA] hover:bg-[#00B894]">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">{isTR ? 'Malzeme' : 'Material'}</TableHead>
              <TableHead className="font-semibold text-right">{isTR ? 'Planlanan' : 'Planned'}</TableHead>
              <TableHead className="font-semibold text-right">{isTR ? 'Tuketilen' : 'Consumed'}</TableHead>
              <TableHead className="font-semibold text-right">{isTR ? 'Birim Maliyet' : 'Unit Cost'}</TableHead>
              <TableHead className="font-semibold text-right">{isTR ? 'Toplam' : 'Total'}</TableHead>
              <TableHead className="font-semibold">{isTR ? 'Kullanim' : 'Usage'}</TableHead>
              {!readOnly && <TableHead className="w-[60px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={readOnly ? 6 : 7} className="text-center py-8 text-gray-500">
                  {isTR ? 'Henuz malzeme eklenmedi (Recete bos)' : 'No materials added yet (BOM is empty)'}
                </TableCell>
              </TableRow>
            ) : (
              items.map(item => {
                const usagePercent = item.planned_quantity > 0
                  ? Math.round((item.actual_quantity / item.planned_quantity) * 100)
                  : 0
                const isOverConsumed = usagePercent > 100
                const stockAvailable = item.products?.current_stock || 0

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{item.product_name}</p>
                      {item.products?.sku && (
                        <p className="text-xs text-muted-foreground font-mono">{item.products.sku}</p>
                      )}
                      {item.product_id && (
                        <p className="text-[10px] text-muted-foreground">
                          {isTR ? 'Stok:' : 'Stock:'} {stockAvailable}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">{item.planned_quantity} {item.unit}</TableCell>
                    <TableCell className="text-right">
                      {readOnly ? (
                        <span className="text-sm">{item.actual_quantity} {item.unit}</span>
                      ) : (
                        <Input
                          type="number"
                          value={item.actual_quantity}
                          onChange={e => handleUpdateActual(item.id, e.target.value)}
                          className="w-20 h-8 text-right text-sm ml-auto"
                          min={0}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {Number(item.unit_cost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      {(item.actual_quantity * item.unit_cost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Progress
                          value={Math.min(usagePercent, 100)}
                          className={`h-2 flex-1 ${isOverConsumed ? '[&>div]:bg-red-500' : ''}`}
                        />
                        <span className={`text-xs font-medium w-10 text-right ${isOverConsumed ? 'text-red-600' : ''}`}>
                          {usagePercent}%
                        </span>
                        {isOverConsumed && <AlertTriangle className="h-3 w-3 text-red-500" />}
                      </div>
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {items.some(i => (i.actual_quantity / i.planned_quantity) > 1.04) && (
        <div className="bg-gradient-to-r from-red-50 to-white border-l-4 border-red-400 p-4 rounded-r-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-red-700 text-xs font-bold uppercase">
              {isTR ? 'Malzeme Kacagi Tespit Edildi' : 'Material Leakage Detected'}
            </span>
          </div>
          <p className="text-sm text-red-600">
            {isTR
              ? 'Malzeme tuketimi recetedeki (BOM) miktarin %4 uzerinde. Makine kalibrasyonunun veya hammadde kalitesinin kontrol edilmesi onerilir.'
              : 'Material consumption is 4%+ above the Recipe (BOM). Checking machine calibration or raw material quality is recommended.'}
          </p>
        </div>
      )}
    </div>
  )
}
