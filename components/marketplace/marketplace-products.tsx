'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import {
  Package, Search, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle,
  ExternalLink, ArrowUpDown, Filter
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'

interface MarketplaceProduct {
  id: string
  account_id: string
  tenant_id: string
  local_product_id: string | null
  marketplace_product_id: string
  product_name: string
  sku: string
  barcode: string
  marketplace_price: number
  marketplace_stock: number
  local_stock: number
  sync_status: string
  last_sync_at: string | null
  marketplace_url: string
  marketplace_category: string
  is_active: boolean
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

interface MarketplaceProductsProps {
  products: MarketplaceProduct[]
  marketplaces: Marketplace[]
  onRefresh: () => void
}

const SYNC_STATUS_CONFIG: Record<string, { color: string; label: { tr: string; en: string } }> = {
  synced: { color: 'bg-emerald-100 text-emerald-700', label: { tr: 'Senkron', en: 'Synced' } },
  pending: { color: 'bg-amber-100 text-amber-700', label: { tr: 'Bekliyor', en: 'Pending' } },
  failed: { color: 'bg-red-100 text-red-700', label: { tr: 'Hata', en: 'Failed' } },
  conflict: { color: 'bg-orange-100 text-orange-700', label: { tr: 'Çakışma', en: 'Conflict' } },
}

const MARKETPLACE_COLORS: Record<string, string> = {
  trendyol: 'bg-orange-500',
  hepsiburada: 'bg-orange-600',
  amazon: 'bg-yellow-500',
  n11: 'bg-green-600',
  pazarama: 'bg-blue-500',
  ciceksepeti: 'bg-pink-500',
  akakce: 'bg-red-500',
  cimri: 'bg-cyan-600',
  idefix: 'bg-purple-500',
  teknosa: 'bg-red-600',
}

export function MarketplaceProducts({ products, marketplaces, onRefresh }: MarketplaceProductsProps) {
  const { language } = useLanguage()
  const isTR = language === 'tr'
  const locale = isTR ? tr : enUS

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [marketplaceFilter, setMarketplaceFilter] = useState('all')
  const [sortField, setSortField] = useState<'name' | 'price' | 'stock'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const toggleActive = async (id: string, current: boolean) => {
    await supabase
      .from('marketplace_products')
      .update({ is_active: !current, updated_at: new Date().toISOString() })
      .eq('id', id)
    onRefresh()
  }

  const toggleSort = (field: 'name' | 'price' | 'stock') => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const syncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      case 'failed': return <XCircle className="h-3.5 w-3.5 text-red-500" />
      case 'pending': return <Clock className="h-3.5 w-3.5 text-amber-500" />
      case 'conflict': return <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
      default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  const filtered = products
    .filter(p => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !p.product_name?.toLowerCase().includes(q) &&
          !p.sku?.toLowerCase().includes(q) &&
          !p.barcode?.toLowerCase().includes(q)
        ) return false
      }
      if (statusFilter !== 'all' && p.sync_status !== statusFilter) return false
      if (marketplaceFilter !== 'all') {
        const mpCode = p.marketplace_accounts?.marketplaces?.code
        if (mpCode !== marketplaceFilter) return false
      }
      return true
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortField === 'name') return (a.product_name || '').localeCompare(b.product_name || '') * dir
      if (sortField === 'price') return ((a.marketplace_price || 0) - (b.marketplace_price || 0)) * dir
      if (sortField === 'stock') return ((a.marketplace_stock || 0) - (b.marketplace_stock || 0)) * dir
      return 0
    })

  const stockConflictCount = products.filter(p => p.marketplace_stock !== p.local_stock).length
  const failedCount = products.filter(p => p.sync_status === 'failed').length

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-[#0A192F]">
              {isTR ? 'Pazaryeri Ürünleri' : 'Marketplace Products'}
            </CardTitle>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-muted-foreground">
                {products.length} {isTR ? 'ürün' : 'products'}
              </span>
              {stockConflictCount > 0 && (
                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 text-[10px]">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {stockConflictCount} {isTR ? 'stok uyumsuz' : 'stock mismatch'}
                </Badge>
              )}
              {failedCount > 0 && (
                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-[10px]">
                  <XCircle className="h-3 w-3 mr-1" />
                  {failedCount} {isTR ? 'hatalı' : 'failed'}
                </Badge>
              )}
            </div>
          </div>
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            {isTR ? 'Yenile' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isTR ? 'Ürün adı, SKU veya barkod...' : 'Product name, SKU or barcode...'}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isTR ? 'Tüm Durumlar' : 'All Status'}</SelectItem>
              <SelectItem value="synced">{isTR ? 'Senkron' : 'Synced'}</SelectItem>
              <SelectItem value="pending">{isTR ? 'Bekliyor' : 'Pending'}</SelectItem>
              <SelectItem value="failed">{isTR ? 'Hatalı' : 'Failed'}</SelectItem>
              <SelectItem value="conflict">{isTR ? 'Çakışma' : 'Conflict'}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={marketplaceFilter} onValueChange={setMarketplaceFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isTR ? 'Tüm Pazaryerleri' : 'All Marketplaces'}</SelectItem>
              {marketplaces.map(m => (
                <SelectItem key={m.id} value={m.code}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-muted/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="font-medium text-[#0A192F] mb-1">
              {isTR ? 'Ürün bulunamadı' : 'No products found'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isTR
                ? 'Pazaryeri hesaplarınız bağlandığında ürünler burada listelenecek'
                : 'Products will be listed here once your marketplace accounts are connected'}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[280px]">
                      <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('name')}>
                        {isTR ? 'Ürün' : 'Product'}
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>{isTR ? 'Pazaryeri' : 'Marketplace'}</TableHead>
                    <TableHead>
                      <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('price')}>
                        {isTR ? 'Fiyat' : 'Price'}
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('stock')}>
                        {isTR ? 'Stok' : 'Stock'}
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>{isTR ? 'Durum' : 'Status'}</TableHead>
                    <TableHead>{isTR ? 'Son Senkron' : 'Last Sync'}</TableHead>
                    <TableHead className="text-center">{isTR ? 'Aktif' : 'Active'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((product) => {
                    const mpCode = product.marketplace_accounts?.marketplaces?.code || ''
                    const mpName = product.marketplace_accounts?.marketplaces?.name || ''
                    const color = MARKETPLACE_COLORS[mpCode] || 'bg-gray-500'
                    const statusConf = SYNC_STATUS_CONFIG[product.sync_status] || SYNC_STATUS_CONFIG.pending
                    const stockMismatch = product.marketplace_stock !== product.local_stock

                    return (
                      <TableRow key={product.id} className={!product.is_active ? 'opacity-50' : ''}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-[#0A192F] text-sm truncate max-w-[250px]">
                              {product.product_name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {product.sku && (
                                <span className="text-[10px] text-muted-foreground">
                                  SKU: {product.sku}
                                </span>
                              )}
                              {product.barcode && (
                                <span className="text-[10px] text-muted-foreground">
                                  | {product.barcode}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`${color} w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-[9px]`}>
                              {mpName.charAt(0)}
                            </div>
                            <div>
                              <span className="text-xs font-medium">{mpName}</span>
                              {product.marketplace_accounts?.store_name && (
                                <p className="text-[10px] text-muted-foreground">{product.marketplace_accounts.store_name}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-sm">
                            {product.marketplace_price?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium ${stockMismatch ? 'text-orange-600' : ''}`}>
                              {product.marketplace_stock}
                            </span>
                            {stockMismatch && (
                              <span className="text-[10px] text-muted-foreground">
                                {isTR ? 'Lokal' : 'Local'}: {product.local_stock}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {syncStatusIcon(product.sync_status)}
                            <Badge className={`${statusConf.color} text-[10px] border-0`}>
                              {isTR ? statusConf.label.tr : statusConf.label.en}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.last_sync_at ? (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(product.last_sync_at), 'dd MMM HH:mm', { locale })}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={product.is_active}
                              onCheckedChange={() => toggleActive(product.id, product.is_active)}
                            />
                            {product.marketplace_url && (
                              <a
                                href={product.marketplace_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-[#0A192F] transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
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
