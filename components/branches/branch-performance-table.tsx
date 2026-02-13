'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart3, TrendingUp, TrendingDown, Award } from 'lucide-react'

interface BranchPerformanceTableProps {
  performance: any[]
  isTR: boolean
}

export function BranchPerformanceTable({ performance, isTR }: BranchPerformanceTableProps) {
  const sorted = [...performance].sort((a, b) => Number(b.profit) - Number(a.profit))
  const bestId = sorted.length > 0 && Number(sorted[0].profit) > 0 ? sorted[0].branch_id : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-500" />
          {isTR ? 'Sube Performans Karsilastirmasi' : 'Branch Performance Comparison'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">#</TableHead>
                <TableHead className="font-semibold">{isTR ? 'Sube' : 'Branch'}</TableHead>
                <TableHead className="font-semibold">{isTR ? 'Sehir' : 'City'}</TableHead>
                <TableHead className="font-semibold text-right">{isTR ? 'Gelir' : 'Revenue'}</TableHead>
                <TableHead className="font-semibold text-right">{isTR ? 'Gider' : 'Expenses'}</TableHead>
                <TableHead className="font-semibold text-right">{isTR ? 'Kar' : 'Profit'}</TableHead>
                <TableHead className="font-semibold text-right">{isTR ? 'Marj' : 'Margin'}</TableHead>
                <TableHead className="font-semibold text-center">{isTR ? 'Fatura' : 'Invoices'}</TableHead>
                <TableHead className="font-semibold text-center">{isTR ? 'Siparis' : 'Orders'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    {isTR ? 'Performans verisi yok' : 'No performance data'}
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((row, idx) => {
                  const profit = Number(row.profit)
                  const isBest = row.branch_id === bestId
                  return (
                    <TableRow key={row.branch_id} className={isBest ? 'bg-green-50/50' : ''}>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {isBest ? (
                          <Award className="h-4 w-4 text-emerald-500" />
                        ) : (
                          idx + 1
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{row.branch_name}</span>
                          {row.is_headquarters && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0">{isTR ? 'Merkez' : 'HQ'}</Badge>
                          )}
                        </div>
                        {row.branch_code && <span className="text-[10px] text-muted-foreground font-mono">{row.branch_code}</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.city || '-'}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold text-green-600 flex items-center justify-end gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {Number(row.revenue).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold text-red-500 flex items-center justify-end gap-1">
                          <TrendingDown className="h-3 w-3" />
                          {Number(row.expenses).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-bold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {profit >= 0 ? '+' : ''}{profit.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={`text-[10px] ${Number(row.profit_margin_pct) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {Number(row.profit_margin_pct).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">{Number(row.invoice_count)}</TableCell>
                      <TableCell className="text-center text-sm">{Number(row.order_count)}</TableCell>
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
