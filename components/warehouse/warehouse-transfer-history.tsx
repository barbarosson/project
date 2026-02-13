'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, ArrowRightLeft, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface WarehouseTransferHistoryProps {
  tenantId: string
  isTR: boolean
}

export function WarehouseTransferHistory({ tenantId, isTR }: WarehouseTransferHistoryProps) {
  const [transfers, setTransfers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTransfers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('warehouse_transfers')
        .select(`
          *,
          from_warehouse:from_warehouse_id(name, code),
          to_warehouse:to_warehouse_id(name, code),
          products:product_id(name, sku)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setTransfers(data || [])
    } catch (error) {
      console.error('Error fetching transfers:', error)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchTransfers()
  }, [fetchTransfers])

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800',
      in_transit: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return map[status] || 'bg-gray-100 text-gray-800'
  }

  function getStatusLabel(status: string) {
    if (isTR) {
      const map: Record<string, string> = {
        pending: 'Beklemede', in_transit: 'Yolda', completed: 'Tamamlandi', cancelled: 'Iptal',
      }
      return map[status] || status
    }
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-[#7DD3FC]" />
          {isTR ? 'Transfer Gecmisi' : 'Transfer History'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">{isTR ? 'Transfer No' : 'Transfer #'}</TableHead>
                <TableHead className="font-semibold">{isTR ? 'Urun' : 'Product'}</TableHead>
                <TableHead className="font-semibold">{isTR ? 'Guzergah' : 'Route'}</TableHead>
                <TableHead className="font-semibold text-right">{isTR ? 'Miktar' : 'Qty'}</TableHead>
                <TableHead className="font-semibold">{isTR ? 'Durum' : 'Status'}</TableHead>
                <TableHead className="font-semibold">{isTR ? 'Tarih' : 'Date'}</TableHead>
                <TableHead className="font-semibold">{isTR ? 'Islem Yapan' : 'By'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    {isTR ? 'Henuz transfer yapilmamis' : 'No transfers yet'}
                  </TableCell>
                </TableRow>
              ) : (
                transfers.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-sm">{t.transfer_number}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{t.products?.name || '-'}</p>
                      {t.products?.sku && <p className="text-[10px] text-muted-foreground">{t.products.sku}</p>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="font-medium">{t.from_warehouse?.code || t.from_warehouse?.name}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{t.to_warehouse?.code || t.to_warehouse?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm">
                      {Number(t.quantity).toLocaleString('tr-TR')}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${getStatusBadge(t.status)}`}>
                        {getStatusLabel(t.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString(isTR ? 'tr-TR' : 'en-US')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.initiated_by || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
