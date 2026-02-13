'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Loader2, Calendar, DollarSign, TrendingUp, TrendingDown,
  FileText, Package, Receipt, ArrowRight, CheckCircle2,
  Clock, AlertTriangle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ProjectDetailSheetProps {
  projectId: string | null
  tenantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  isTR: boolean
}

interface ProjectData {
  project: any
  summary: any
  milestones: any[]
  invoices: any[]
  expenses: any[]
  stockMovements: any[]
  orders: any[]
}

export function ProjectDetailSheet({ projectId, tenantId, open, onOpenChange, isTR }: ProjectDetailSheetProps) {
  const [data, setData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && projectId) loadData()
  }, [open, projectId])

  async function loadData() {
    if (!projectId) return
    setLoading(true)

    const [projectRes, summaryRes, milestonesRes, invoicesRes, expensesRes, stockRes, ordersRes] = await Promise.all([
      supabase.from('projects').select('*, customers(name, company_title)').eq('id', projectId).maybeSingle(),
      supabase.from('project_financial_summary').select('*').eq('project_id', projectId).maybeSingle(),
      supabase.from('project_milestones').select('*').eq('project_id', projectId).order('order_index'),
      supabase.from('invoices').select('id, invoice_number, status, total, paid_amount, issue_date').eq('project_id', projectId),
      supabase.from('expenses').select('id, description, amount, category, expense_date').eq('project_id', projectId),
      supabase.from('stock_movements').select('id, product_id, movement_type, quantity, unit_cost, created_at, products(name)').eq('project_id', projectId),
      supabase.from('orders').select('id, order_number, status, total, created_at').eq('project_id', projectId),
    ])

    setData({
      project: projectRes.data,
      summary: summaryRes.data,
      milestones: milestonesRes.data || [],
      invoices: invoicesRes.data || [],
      expenses: expensesRes.data || [],
      stockMovements: stockRes.data || [],
      orders: ordersRes.data || [],
    })
    setLoading(false)
  }

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      planning: 'bg-amber-100 text-amber-800',
      active: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return map[status] || 'bg-gray-100 text-gray-800'
  }

  function getStatusLabel(status: string) {
    if (isTR) {
      const map: Record<string, string> = {
        planning: 'Planlama', active: 'Aktif', on_hold: 'Beklemede',
        completed: 'Tamamlandi', cancelled: 'Iptal',
      }
      return map[status] || status
    }
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  function getPriorityBadge(priority: string) {
    const map: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    }
    return map[priority] || 'bg-gray-100 text-gray-700'
  }

  function getPriorityLabel(priority: string) {
    if (isTR) {
      const map: Record<string, string> = { low: 'Dusuk', medium: 'Orta', high: 'Yuksek', critical: 'Kritik' }
      return map[priority] || priority
    }
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  const project = data?.project
  const summary = data?.summary

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isTR ? 'Proje Detayi' : 'Project Details'}</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : !project ? (
          <p className="text-center text-gray-500 py-12">{isTR ? 'Proje bulunamadi' : 'Project not found'}</p>
        ) : (
          <div className="space-y-6 mt-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold">{project.name}</h2>
                <Badge className={getStatusBadge(project.status)}>{getStatusLabel(project.status)}</Badge>
                <Badge className={getPriorityBadge(project.priority)}>{getPriorityLabel(project.priority)}</Badge>
              </div>
              {project.code && <p className="text-sm text-muted-foreground font-mono">{project.code}</p>}
              {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                {project.customers && (
                  <span>{isTR ? 'Musteri' : 'Client'}: <strong>{project.customers.company_title || project.customers.name}</strong></span>
                )}
                {project.manager_name && (
                  <span>{isTR ? 'Yonetici' : 'Manager'}: <strong>{project.manager_name}</strong></span>
                )}
                {project.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(project.start_date).toLocaleDateString(isTR ? 'tr-TR' : 'en-US')}
                    {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString(isTR ? 'tr-TR' : 'en-US')}`}
                  </span>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold mb-3">{isTR ? 'Ilerleme' : 'Progress'}</h3>
              <div className="flex items-center gap-3">
                <Progress value={project.progress_percent} className="flex-1 h-3" />
                <span className="text-sm font-bold w-12 text-right">{project.progress_percent}%</span>
              </div>
            </div>

            {summary && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3">{isTR ? 'Finansal Ozet' : 'Financial Summary'}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">{isTR ? 'Butce' : 'Budget'}</p>
                        <p className="text-lg font-bold text-[#0A2540]">
                          {Number(summary.budget).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">{isTR ? 'Gelir' : 'Revenue'}</p>
                        <p className="text-lg font-bold text-green-600">
                          {Number(summary.total_revenue).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">{isTR ? 'Maliyet' : 'Cost'}</p>
                        <p className="text-lg font-bold text-red-600">
                          {Number(summary.total_cost).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">{isTR ? 'Net Kar' : 'Net Profit'}</p>
                        <p className={`text-lg font-bold ${Number(summary.net_profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Number(summary.net_profit).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{isTR ? 'Butce Kullanimi' : 'Budget Consumption'}</span>
                      <span className={`font-semibold ${Number(summary.budget_consumption_percent) > 100 ? 'text-red-600' : 'text-[#0A2540]'}`}>
                        {Number(summary.budget_consumption_percent).toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(Number(summary.budget_consumption_percent), 100)}
                      className={`h-2 ${Number(summary.budget_consumption_percent) > 100 ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'}`}
                    />
                    {Number(summary.budget_consumption_percent) > 90 && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {isTR ? 'Butce limitine yaklasiliyor!' : 'Approaching budget limit!'}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {data && data.milestones.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3">{isTR ? 'Kilometre Taslari' : 'Milestones'}</h3>
                  <div className="space-y-2">
                    {data.milestones.map(m => (
                      <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg border bg-gray-50/50">
                        {m.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        ) : m.status === 'overdue' ? (
                          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.title}</p>
                          {m.due_date && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(m.due_date).toLocaleDateString(isTR ? 'tr-TR' : 'en-US')}
                            </p>
                          )}
                        </div>
                        {m.invoice_amount > 0 && (
                          <span className="text-xs font-medium text-blue-600">
                            {Number(m.invoice_amount).toLocaleString('tr-TR')} {project.currency}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {data && data.invoices.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {isTR ? 'Bagli Faturalar' : 'Linked Invoices'}
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-xs">{isTR ? 'Fatura No' : 'Invoice No'}</TableHead>
                          <TableHead className="text-xs">{isTR ? 'Durum' : 'Status'}</TableHead>
                          <TableHead className="text-xs text-right">{isTR ? 'Tutar' : 'Amount'}</TableHead>
                          <TableHead className="text-xs">{isTR ? 'Tarih' : 'Date'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.invoices.map(inv => (
                          <TableRow key={inv.id}>
                            <TableCell className="text-sm font-medium">{inv.invoice_number}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">{inv.status}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-right font-medium">
                              {Number(inv.total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {inv.issue_date && new Date(inv.issue_date).toLocaleDateString(isTR ? 'tr-TR' : 'en-US')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}

            {data && data.expenses.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    {isTR ? 'Bagli Giderler' : 'Linked Expenses'}
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-xs">{isTR ? 'Aciklama' : 'Description'}</TableHead>
                          <TableHead className="text-xs">{isTR ? 'Kategori' : 'Category'}</TableHead>
                          <TableHead className="text-xs text-right">{isTR ? 'Tutar' : 'Amount'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.expenses.map(exp => (
                          <TableRow key={exp.id}>
                            <TableCell className="text-sm">{exp.description}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{exp.category}</TableCell>
                            <TableCell className="text-sm text-right font-medium">
                              {Number(exp.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}

            {data && data.stockMovements.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {isTR ? 'Malzeme Hareketleri' : 'Material Movements'}
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-xs">{isTR ? 'Urun' : 'Product'}</TableHead>
                          <TableHead className="text-xs">{isTR ? 'Tur' : 'Type'}</TableHead>
                          <TableHead className="text-xs text-right">{isTR ? 'Miktar' : 'Qty'}</TableHead>
                          <TableHead className="text-xs text-right">{isTR ? 'Maliyet' : 'Cost'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.stockMovements.map(sm => (
                          <TableRow key={sm.id}>
                            <TableCell className="text-sm">{(sm as any).products?.name || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] ${sm.movement_type === 'out' ? 'text-red-600' : 'text-green-600'}`}>
                                {sm.movement_type === 'out' ? (isTR ? 'Cikis' : 'Out') : (isTR ? 'Giris' : 'In')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-right">{sm.quantity}</TableCell>
                            <TableCell className="text-sm text-right">
                              {Number(sm.quantity * (sm.unit_cost || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}

            {data && data.orders.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3">{isTR ? 'Bagli Siparisler' : 'Linked Orders'}</h3>
                  <div className="space-y-1.5">
                    {data.orders.map(o => (
                      <div key={o.id} className="flex items-center justify-between p-2 border rounded-lg bg-gray-50/50">
                        <span className="text-sm font-medium">{o.order_number}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{o.status}</Badge>
                          <span className="text-sm font-medium">{Number(o.total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
