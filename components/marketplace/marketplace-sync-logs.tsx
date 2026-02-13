'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Activity, CheckCircle2, XCircle, Clock, AlertTriangle
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { format } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'

interface SyncLog {
  id: string
  account_id: string
  tenant_id: string
  sync_type: string
  status: string
  total_records: number
  processed_records: number
  failed_records: number
  error_message: string | null
  started_at: string
  completed_at: string | null
  created_at: string
  marketplace_accounts?: {
    store_name: string
    marketplaces?: { name: string; code: string }
  }
}

interface Marketplace {
  id: number
  name: string
  code: string
}

interface MarketplaceSyncLogsProps {
  logs: SyncLog[]
  marketplaces: Marketplace[]
}

const SYNC_TYPE_LABELS: Record<string, { tr: string; en: string }> = {
  products: { tr: 'Ürün', en: 'Products' },
  orders: { tr: 'Sipariş', en: 'Orders' },
  stock: { tr: 'Stok', en: 'Stock' },
  prices: { tr: 'Fiyat', en: 'Prices' },
  full: { tr: 'Tam', en: 'Full' },
}

export function MarketplaceSyncLogs({ logs, marketplaces }: MarketplaceSyncLogsProps) {
  const { language } = useLanguage()
  const isTR = language === 'tr'
  const locale = isTR ? tr : enUS
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = logs.filter(l => {
    if (typeFilter !== 'all' && l.sync_type !== typeFilter) return false
    return true
  })

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case 'partial': return <AlertTriangle className="h-4 w-4 text-amber-500" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-emerald-100 text-emerald-700',
      failed: 'bg-red-100 text-red-700',
      running: 'bg-blue-100 text-blue-700',
      partial: 'bg-amber-100 text-amber-700',
    }
    const labels: Record<string, { tr: string; en: string }> = {
      completed: { tr: 'Tamamlandı', en: 'Completed' },
      failed: { tr: 'Başarısız', en: 'Failed' },
      running: { tr: 'Çalışıyor', en: 'Running' },
      partial: { tr: 'Kısmi', en: 'Partial' },
    }
    return (
      <Badge className={`${colors[status] || 'bg-gray-100 text-gray-700'} text-[10px] border-0`}>
        {isTR ? (labels[status]?.tr || status) : (labels[status]?.en || status)}
      </Badge>
    )
  }

  const duration = (start: string, end: string | null) => {
    if (!end) return '-'
    const ms = new Date(end).getTime() - new Date(start).getTime()
    if (ms < 1000) return `${ms}ms`
    const secs = Math.floor(ms / 1000)
    if (secs < 60) return `${secs}s`
    return `${Math.floor(secs / 60)}m ${secs % 60}s`
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold text-[#0A192F]">
            {isTR ? 'Senkronizasyon Geçmişi' : 'Sync History'}
          </CardTitle>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isTR ? 'Tüm İşlemler' : 'All Types'}</SelectItem>
              <SelectItem value="products">{isTR ? 'Ürün' : 'Products'}</SelectItem>
              <SelectItem value="orders">{isTR ? 'Sipariş' : 'Orders'}</SelectItem>
              <SelectItem value="stock">{isTR ? 'Stok' : 'Stock'}</SelectItem>
              <SelectItem value="prices">{isTR ? 'Fiyat' : 'Prices'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-muted/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="font-medium text-[#0A192F] mb-1">
              {isTR ? 'Henüz senkronizasyon kaydı yok' : 'No sync logs yet'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isTR
                ? 'Senkronizasyon işlemleri burada gösterilecek'
                : 'Sync operations will be shown here'}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>{isTR ? 'Tarih' : 'Date'}</TableHead>
                    <TableHead>{isTR ? 'Pazaryeri' : 'Marketplace'}</TableHead>
                    <TableHead>{isTR ? 'İşlem Tipi' : 'Type'}</TableHead>
                    <TableHead>{isTR ? 'Durum' : 'Status'}</TableHead>
                    <TableHead>{isTR ? 'Kayıtlar' : 'Records'}</TableHead>
                    <TableHead>{isTR ? 'Süre' : 'Duration'}</TableHead>
                    <TableHead>{isTR ? 'Hata' : 'Error'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log) => {
                    const mpName = log.marketplace_accounts?.marketplaces?.name || '-'
                    const typeLabel = SYNC_TYPE_LABELS[log.sync_type]
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.started_at || log.created_at), 'dd MMM HH:mm:ss', { locale })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium">{mpName}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {isTR ? (typeLabel?.tr || log.sync_type) : (typeLabel?.en || log.sync_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {statusIcon(log.status)}
                            {statusBadge(log.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <span className="text-emerald-600">{log.processed_records}</span>
                            <span className="text-muted-foreground">/{log.total_records}</span>
                            {log.failed_records > 0 && (
                              <span className="text-red-500 ml-1">({log.failed_records} {isTR ? 'hata' : 'err'})</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {duration(log.started_at || log.created_at, log.completed_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {log.error_message ? (
                            <span className="text-xs text-red-500 truncate max-w-[200px] block" title={log.error_message}>
                              {log.error_message}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
