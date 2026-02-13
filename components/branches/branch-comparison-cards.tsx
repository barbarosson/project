'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Building2, MapPin, MoreVertical, Edit, Trash2,
  TrendingUp, TrendingDown, FileText, ShoppingCart, FolderKanban, Award
} from 'lucide-react'

interface BranchComparisonCardsProps {
  branches: any[]
  performance: any[]
  onEdit: (branch: any) => void
  onDelete: (branch: any) => void
  isTR: boolean
}

export function BranchComparisonCards({ branches, performance, onEdit, onDelete, isTR }: BranchComparisonCardsProps) {
  const maxRevenue = Math.max(...performance.map(p => Number(p.revenue) || 1), 1)

  function getPerformanceData(branchId: string) {
    return performance.find(p => p.branch_id === branchId) || {
      revenue: 0,
      expenses: 0,
      profit: 0,
      profit_margin_pct: 0,
      invoice_count: 0,
      order_count: 0,
      expense_count: 0,
      project_count: 0,
    }
  }

  const bestBranchId = performance.length > 0
    ? performance.reduce((best, curr) =>
        Number(curr.profit) > Number(best.profit) ? curr : best, performance[0]
      ).branch_id
    : null

  if (branches.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        {isTR ? 'Henuz sube eklenmedi' : 'No branches added yet'}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {branches.map(branch => {
        const perf = getPerformanceData(branch.id)
        const profit = Number(perf.profit)
        const revenue = Number(perf.revenue)
        const expenses = Number(perf.expenses)
        const revenuePercent = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0
        const isBest = branch.id === bestBranchId && profit > 0

        return (
          <Card key={branch.id} className={`relative overflow-hidden transition-all hover:shadow-lg ${!branch.is_active ? 'opacity-60' : ''}`}>
            {isBest && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2ECC71] to-[#27AE60]" />
            )}

            {branch.is_headquarters && (
              <div className="absolute top-3 right-12 bg-[#0D1B2A] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                {isTR ? 'MERKEZ' : 'HQ'}
              </div>
            )}

            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isBest ? 'bg-gradient-to-br from-green-50 to-emerald-100' : 'bg-slate-100'}`}>
                    {isBest ? (
                      <Award className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Building2 className="h-5 w-5 text-[#0D1B2A]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0D1B2A] text-lg">{branch.name}</h3>
                    <div className="flex items-center gap-2">
                      {branch.code && <span className="text-xs font-mono text-muted-foreground">{branch.code}</span>}
                      {branch.city && (
                        <span className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5 mr-0.5" />{branch.city}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(branch)}>
                      <Edit className="h-4 w-4 mr-2" />{isTR ? 'Duzenle' : 'Edit'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(branch)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />{isTR ? 'Sil' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {isTR ? 'Gelir' : 'Revenue'}
                </span>
                <span className="text-sm font-bold text-green-600">
                  {revenue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} TRY
                </span>
              </div>
              <Progress value={revenuePercent} className="h-2 mb-4" />

              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> {isTR ? 'Gider' : 'Expenses'}
                </span>
                <span className="text-sm font-bold text-red-500">
                  {expenses.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} TRY
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full mb-4">
                <div
                  className="bg-red-400 h-full rounded-full transition-all"
                  style={{ width: `${revenue > 0 ? Math.min((expenses / revenue) * 100, 100) : 0}%` }}
                />
              </div>

              <div className={`rounded-lg p-3 mb-4 ${profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{isTR ? 'Net Kar' : 'Net Profit'}</span>
                  <span className={`text-lg font-bold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {profit >= 0 ? '+' : ''}{profit.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} TRY
                  </span>
                </div>
                {Number(perf.profit_margin_pct) !== 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {isTR ? 'Kar Marji' : 'Margin'}: {Number(perf.profit_margin_pct).toFixed(1)}%
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center bg-gray-50 rounded-lg p-2">
                  <FileText className="h-3.5 w-3.5 mx-auto text-blue-500 mb-1" />
                  <p className="text-sm font-bold">{Number(perf.invoice_count)}</p>
                  <p className="text-[9px] text-muted-foreground">{isTR ? 'Fatura' : 'Invoices'}</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-2">
                  <ShoppingCart className="h-3.5 w-3.5 mx-auto text-teal-500 mb-1" />
                  <p className="text-sm font-bold">{Number(perf.order_count)}</p>
                  <p className="text-[9px] text-muted-foreground">{isTR ? 'Siparis' : 'Orders'}</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-2">
                  <FolderKanban className="h-3.5 w-3.5 mx-auto text-orange-500 mb-1" />
                  <p className="text-sm font-bold">{Number(perf.project_count)}</p>
                  <p className="text-[9px] text-muted-foreground">{isTR ? 'Proje' : 'Projects'}</p>
                </div>
              </div>

              {branch.manager_name && (
                <p className="text-xs text-muted-foreground mt-3">
                  {isTR ? 'Mudur:' : 'Manager:'} {branch.manager_name}
                </p>
              )}

              {!branch.is_active && (
                <Badge variant="outline" className="mt-2 text-[10px] border-red-200 text-red-600">
                  {isTR ? 'Pasif' : 'Inactive'}
                </Badge>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
