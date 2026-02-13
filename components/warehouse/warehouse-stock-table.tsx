'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Search, Package, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface WarehouseStockTableProps {
  tenantId: string
  warehouses: any[]
  isTR: boolean
}

export function WarehouseStockTable({ tenantId, warehouses, isTR }: WarehouseStockTableProps) {
  const [stockData, setStockData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWarehouse, setSelectedWarehouse] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchStock = useCallback(async () => {
    try {
      let query = supabase
        .from('warehouse_inventory_summary')
        .select('*')
        .eq('tenant_id', tenantId)

      if (selectedWarehouse !== 'all') {
        query = query.eq('warehouse_id', selectedWarehouse)
      }

      query = query.gt('warehouse_quantity', 0)

      const { data, error } = await query.order('product_name')

      if (error) throw error
      setStockData(data || [])
    } catch (error) {
      console.error('Error fetching warehouse stock:', error)
    } finally {
      setLoading(false)
    }
  }, [tenantId, selectedWarehouse])

  useEffect(() => {
    fetchStock()
  }, [fetchStock])

  const filteredData = stockData.filter(row => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      row.product_name?.toLowerCase().includes(q) ||
      row.sku?.toLowerCase().includes(q) ||
      row.warehouse_name?.toLowerCase().includes(q) ||
      row.category?.toLowerCase().includes(q)
    )
  })

  const totalValue = filteredData.reduce((sum, r) => sum + Number(r.stock_value || 0), 0)

  function getStockBadge(status: string) {
    const map: Record<string, string> = {
      in_stock: 'bg-green-100 text-green-800',
      low_stock: 'bg-amber-100 text-amber-800',
      out_of_stock: 'bg-red-100 text-red-800',
    }
    return map[status] || 'bg-gray-100 text-gray-800'
  }

  function getStockLabel(status: string) {
    if (isTR) {
      const map: Record<string, string> = { in_stock: 'Stokta', low_stock: 'Dusuk', out_of_stock: 'Tukenmis' }
      return map[status] || status
    }
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-[#7DD3FC]" />
            {isTR ? 'Depo Bazli Stok Durumu' : 'Warehouse Stock Levels'}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isTR ? 'Toplam Deger:' : 'Total Value:'}{' '}
            <span className="font-bold text-[#0D1B2A]">
              {totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger className="sm:w-[220px]">
              <SelectValue placeholder={isTR ? 'Depo filtrele' : 'Filter warehouse'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isTR ? 'Tum Depolar' : 'All Warehouses'}</SelectItem>
              {warehouses.filter(w => w.is_active).map(w => (
                <SelectItem key={w.id} value={w.id}>
                  {w.code ? `[${w.code}] ` : ''}{w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isTR ? 'Urun ara...' : 'Search products...'}
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
                <TableHead className="font-semibold">{isTR ? 'Urun' : 'Product'}</TableHead>
                <TableHead className="font-semibold">{isTR ? 'Depo' : 'Warehouse'}</TableHead>
                <TableHead className="font-semibold text-right">{isTR ? 'Stok' : 'Stock'}</TableHead>
                <TableHead className="font-semibold text-right">{isTR ? 'Rezerve' : 'Reserved'}</TableHead>
                <TableHead className="font-semibold text-right">{isTR ? 'Kullanilabilir' : 'Available'}</TableHead>
                <TableHead className="font-semibold text-right">{isTR ? 'Ort. Maliyet' : 'Avg Cost'}</TableHead>
                <TableHead className="font-semibold text-right">{isTR ? 'Deger' : 'Value'}</TableHead>
                <TableHead className="font-semibold">{isTR ? 'Durum' : 'Status'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                    {isTR ? 'Stok verisi bulunamadi' : 'No stock data found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row, idx) => {
                  const isLow = row.stock_status === 'low_stock'
                  return (
                    <TableRow key={`${row.warehouse_id}-${row.product_id}-${idx}`} className={isLow ? 'bg-amber-50/50' : ''}>
                      <TableCell>
                        <p className="font-medium text-sm">{row.product_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{row.sku}</p>
                        {row.category && <p className="text-[10px] text-muted-foreground">{row.category}</p>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{row.warehouse_name}</span>
                          {row.is_main && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0">{isTR ? 'Ana' : 'Main'}</Badge>
                          )}
                        </div>
                        {row.warehouse_location && (
                          <p className="text-[10px] text-muted-foreground">{row.warehouse_location}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">
                        {Number(row.warehouse_quantity).toLocaleString('tr-TR')} {row.unit}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {Number(row.reserved_quantity) > 0 ? Number(row.reserved_quantity).toLocaleString('tr-TR') : '-'}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {Number(row.available_quantity).toLocaleString('tr-TR')}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {Number(row.average_cost || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        {Number(row.stock_value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${getStockBadge(row.stock_status)}`}>
                          {isLow && <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />}
                          {getStockLabel(row.stock_status)}
                        </Badge>
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
  )
}
