'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MarketplaceStats } from '@/components/marketplace/marketplace-stats'
import { MarketplaceAccounts } from '@/components/marketplace/marketplace-accounts'
import { MarketplaceProducts } from '@/components/marketplace/marketplace-products'
import { MarketplaceOrders } from '@/components/marketplace/marketplace-orders'
import { MarketplaceSyncLogs } from '@/components/marketplace/marketplace-sync-logs'
import { useTenant } from '@/contexts/tenant-context'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { supabase } from '@/lib/supabase'
import {
  Store,
  Plug,
  Package,
  ShoppingCart,
  Activity
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Marketplace {
  id: number
  name: string
  code: string
  api_type: string
}

export default function MarketplacePage() {
  const { tenantId } = useTenant()
  const { user } = useAuth()
  const { language } = useLanguage()
  const isTR = language === 'tr'

  const [loading, setLoading] = useState(true)
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [syncLogs, setSyncLogs] = useState<any[]>([])

  const fetchData = useCallback(async () => {
    if (!tenantId) return

    try {
      const [mpRes, accRes, prodRes, orderRes, logRes] = await Promise.all([
        supabase.from('marketplaces').select('*').eq('is_active', true).order('name'),
        supabase
          .from('marketplace_accounts')
          .select('*, marketplaces(id, name, code, api_type)')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false }),
        supabase
          .from('marketplace_products')
          .select('*, marketplace_accounts(store_name, marketplaces(name, code))')
          .eq('tenant_id', tenantId)
          .order('updated_at', { ascending: false })
          .limit(200),
        supabase
          .from('marketplace_orders')
          .select('*, marketplace_accounts(store_name, marketplaces(name, code)), local_order_id')
          .eq('tenant_id', tenantId)
          .order('order_date', { ascending: false })
          .limit(200),
        supabase
          .from('marketplace_sync_logs')
          .select('*, marketplace_accounts(store_name, marketplaces(name, code))')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(100),
      ])

      if (mpRes.data) setMarketplaces(mpRes.data)
      if (accRes.data) setAccounts(accRes.data)
      if (prodRes.data) setProducts(prodRes.data)
      if (orderRes.data) setOrders(orderRes.data)
      if (logRes.data) setSyncLogs(logRes.data)
    } catch (err) {
      console.error('Error fetching marketplace data:', err)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const activeAccounts = accounts.filter(a => a.is_active)
  const pendingOrders = orders.filter(o => o.order_status === 'pending')
  const todayRevenue = orders
    .filter(o => {
      if (!o.order_date) return false
      const d = new Date(o.order_date)
      const now = new Date()
      return d.toDateString() === now.toDateString()
    })
    .reduce((sum, o) => sum + (o.total_amount || 0), 0)

  const syncErrors = syncLogs.filter(l => l.status === 'failed').length

  const stats = {
    connectedMarketplaces: activeAccounts.length,
    totalOrders: orders.length,
    pendingOrders: pendingOrders.length,
    totalProducts: products.length,
    syncErrors,
    todayRevenue,
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2ECC71]" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-teal-50 p-2.5 rounded-xl">
            <Store className="h-6 w-6 text-teal-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0A192F]">
              {isTR ? 'Pazaryeri Entegrasyonu' : 'Marketplace Integration'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isTR
                ? 'Tüm pazaryerlerinizi tek merkezden yönetin'
                : 'Manage all your marketplaces from one place'}
            </p>
          </div>
        </div>

        <MarketplaceStats stats={stats} />

        <Tabs defaultValue="accounts" className="space-y-4">
          <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
            <TabsTrigger value="accounts" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Plug className="h-4 w-4" />
              {isTR ? 'Hesaplar' : 'Accounts'}
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-5">{accounts.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Package className="h-4 w-4" />
              {isTR ? 'Ürünler' : 'Products'}
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-5">{products.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <ShoppingCart className="h-4 w-4" />
              {isTR ? 'Siparişler' : 'Orders'}
              {pendingOrders.length > 0 && (
                <Badge className="bg-amber-500 text-white ml-1 text-[10px] px-1.5 py-0 h-5">{pendingOrders.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sync-logs" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Activity className="h-4 w-4" />
              {isTR ? 'Senkron Geçmişi' : 'Sync Logs'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts">
            <MarketplaceAccounts
              accounts={accounts}
              marketplaces={marketplaces}
              tenantId={tenantId || ''}
              userId={user?.id || ''}
              onRefresh={fetchData}
            />
          </TabsContent>

          <TabsContent value="products">
            <MarketplaceProducts
              products={products}
              marketplaces={marketplaces}
              onRefresh={fetchData}
            />
          </TabsContent>

          <TabsContent value="orders">
            <MarketplaceOrders
              orders={orders}
              marketplaces={marketplaces}
              onRefresh={fetchData}
            />
          </TabsContent>

          <TabsContent value="sync-logs">
            <MarketplaceSyncLogs
              logs={syncLogs}
              marketplaces={marketplaces}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
