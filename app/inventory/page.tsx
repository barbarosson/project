'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Package, TrendingUp, AlertTriangle, Plus, Minus, History, MoreVertical, Edit, Trash2, Upload, ShoppingCart, FileText, Link2 } from 'lucide-react'
import { StockMovementSheet } from '@/components/stock-movement-sheet'
import { QuickStockAdjustmentDialog } from '@/components/quick-stock-adjustment-dialog'
import { AddProductDialog } from '@/components/add-product-dialog'
import { EditProductDialog } from '@/components/edit-product-dialog'
import { BulkAddProductsDialog } from '@/components/bulk-add-products-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { Toaster } from '@/components/ui/sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'

interface Product {
  id: string
  name: string
  sku: string
  category: string
  unit: string
  current_stock: number
  critical_level: number
  purchase_price: number
  sale_price: number
  average_cost: number
  stock_status: string
  total_sold: number
  description: string
  status: string
}

interface AIInsight {
  lowStockCount: number
  criticalProducts: string[]
  daysUntilReorder: number
  totalValue: number
}

export default function InventoryPage() {
  const { tenantId, loading: tenantLoading } = useTenant()
  const { language, t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showMovementSheet, setShowMovementSheet] = useState(false)
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false)
  const [adjustmentProduct, setAdjustmentProduct] = useState<Product | null>(null)
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showBulkAddDialog, setShowBulkAddDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [linkedOrderCounts, setLinkedOrderCounts] = useState<Record<string, number>>({})
  const [pendingOrderCount, setPendingOrderCount] = useState(0)

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchProducts()
    }
  }, [tenantId, tenantLoading])

  async function fetchProducts() {
    if (!tenantId) return

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name')

      if (error) throw error

      setProducts(data || [])
      calculateAIInsights(data || [])
      fetchLinkedOrders(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchLinkedOrders(productsData: Product[]) {
    if (!tenantId || productsData.length === 0) return
    try {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id')
        .eq('tenant_id', tenantId)

      const counts: Record<string, number> = {}
      for (const item of orderItems || []) {
        if (item.product_id) {
          counts[item.product_id] = (counts[item.product_id] || 0) + 1
        }
      }
      setLinkedOrderCounts(counts)

      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['pending', 'confirmed', 'processing'])

      setPendingOrderCount(count || 0)
    } catch (err) {
      console.error('Error fetching linked orders:', err)
    }
  }

  function calculateAIInsights(productsData: Product[]) {
    const lowStockProducts = productsData.filter(
      p => p.stock_status === 'low_stock' || p.stock_status === 'out_of_stock'
    )

    const topSellers = productsData
      .filter(p => p.total_sold > 5)
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 3)

    const criticalLowStock = topSellers.filter(
      p => p.stock_status === 'low_stock' || p.stock_status === 'out_of_stock'
    )

    const totalValue = productsData.reduce(
      (sum, p) => sum + (Number(p.current_stock) * Number(p.sale_price)),
      0
    )

    const avgSalesSpeed = topSellers.length > 0
      ? topSellers.reduce((sum, p) => sum + p.total_sold, 0) / topSellers.length / 30
      : 0

    const daysUntilReorder = avgSalesSpeed > 0
      ? Math.floor(10 / avgSalesSpeed)
      : 7

    setAiInsight({
      lowStockCount: lowStockProducts.length,
      criticalProducts: criticalLowStock.map(p => p.name),
      daysUntilReorder: Math.min(daysUntilReorder, 14),
      totalValue
    })
  }

  function getStockStatusBadge(status: string) {
    switch (status) {
      case 'in_stock':
        return <Badge className="bg-green-500">{t.inventory.inStock}</Badge>
      case 'low_stock':
        return <Badge className="bg-amber-500">{t.inventory.lowStock}</Badge>
      case 'out_of_stock':
        return <Badge variant="destructive">{t.inventory.outOfStock}</Badge>
      default:
        return <Badge>{t.inventory.unknown}</Badge>
    }
  }

  function getRowClassName(product: Product) {
    if (product.stock_status === 'out_of_stock') {
      return 'bg-red-50 hover:bg-red-100'
    }
    if (product.stock_status === 'low_stock') {
      return 'bg-amber-50 hover:bg-amber-100'
    }
    return ''
  }

  function handleProductClick(product: Product) {
    setSelectedProduct(product)
    setShowMovementSheet(true)
  }

  function handleQuickAdjustment(product: Product) {
    setAdjustmentProduct(product)
    setShowAdjustmentDialog(true)
  }

  function handleAdjustmentComplete() {
    setShowAdjustmentDialog(false)
    setAdjustmentProduct(null)
    fetchProducts()
  }

  function handleEdit(product: Product) {
    setEditingProduct(product)
    setShowEditDialog(true)
  }

  function handleDelete(product: Product) {
    setDeletingProduct(product)
    setShowDeleteDialog(true)
  }

  async function confirmDelete() {
    if (!deletingProduct || !tenantId) return

    try {
      await supabase.from('inventory').delete().eq('product_id', deletingProduct.id).eq('tenant_id', tenantId)
      await supabase.from('stock_movements').delete().eq('product_id', deletingProduct.id).eq('tenant_id', tenantId)

      const { error } = await supabase.from('products').delete().eq('id', deletingProduct.id).eq('tenant_id', tenantId)

      if (error) throw error

      toast.success(t.toast.productDeleted)
      fetchProducts()
    } catch (error: any) {
      console.error('Error deleting product:', error)
      toast.error(error.message || t.inventory.failedToDeleteProduct)
    } finally {
      setShowDeleteDialog(false)
      setDeletingProduct(null)
    }
  }

  const topSellingProducts = [...products]
    .sort((a, b) => b.total_sold - a.total_sold)
    .slice(0, 5)
    .map(p => ({
      name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
      sold: Number(p.total_sold)
    }))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-[#475569] mt-1">
            {t.inventory.trackStockLevels}
          </p>
        </div>

        {aiInsight && aiInsight.criticalProducts.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-1" />
                <div className="flex-1">
                  <CardTitle className="text-amber-900">{t.inventory.aiStockAlert}</CardTitle>
                  <CardDescription className="text-amber-700 mt-2">
                    <strong>{aiInsight.criticalProducts.length}</strong> {t.inventory.bestSellingItemsLow}{' '}
                    <strong>{aiInsight.criticalProducts.join(', ')}</strong>.
                    {t.inventory.reorderWithinDays}{' '}
                    <strong>{aiInsight.daysUntilReorder}</strong> {t.inventory.daysToAvoidStockouts}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {pendingOrderCount > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <ShoppingCart className="h-5 w-5 text-blue-600 mt-1" />
                <div className="flex-1">
                  <CardTitle className="text-blue-900">
                    {language === 'tr'
                      ? `${pendingOrderCount} Aktif Siparis Stok Seviyelerini Etkiliyor`
                      : `${pendingOrderCount} Active Orders Affecting Stock`}
                  </CardTitle>
                  <CardDescription className="text-blue-700 mt-1">
                    {language === 'tr'
                      ? `${pendingOrderCount} adet aktif siparis stok seviyelerinizi etkileyebilir.`
                      : `${pendingOrderCount} active orders may affect your stock levels. Confirm or ship orders to auto-deduct stock.`}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() => window.location.href = '/orders'}
                >
                  <Link2 className="h-3.5 w-3.5 mr-1" />
                  {language === 'tr' ? 'Siparislere Git' : 'View Orders'}
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.inventory.totalProducts}</CardTitle>
              <Package className="h-4 w-4 text-[#475569]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-[#475569] mt-1">
                {products.filter(p => p.stock_status === 'in_stock').length} {t.common.inStock}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.inventory.lowStockAlertsCount}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aiInsight?.lowStockCount || 0}</div>
              <p className="text-xs text-[#475569] mt-1">
                {t.inventory.requiresAttention}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.inventory.inventoryValue}</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#475569]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${aiInsight?.totalValue.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-[#475569] mt-1">
                {t.inventory.totalStockValue}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.inventory.topFiveMostSold}</CardTitle>
            <CardDescription>{t.inventory.highestSalesVolume}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topSellingProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sold" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t.inventory.productInventory}</CardTitle>
                <CardDescription>
                  {t.inventory.clickProductForHistory}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowBulkAddDialog(true)} variant="outline" className="text-[#0A192F]">
                  <Upload className="h-4 w-4 mr-2" />
                  {t.inventory.bulkAdd}
                </Button>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t.inventory.addProduct}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading || tenantLoading ? (
              <div className="text-center py-8 text-[#475569]">{t.common.loading}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.inventory.productName}</TableHead>
                    <TableHead>{t.inventory.sku}</TableHead>
                    <TableHead>{t.inventory.category}</TableHead>
                    <TableHead className="text-right">{t.inventory.currentStock}</TableHead>
                    <TableHead className="text-right">Avg Cost</TableHead>
                    <TableHead className="text-right">{t.inventory.salePrice}</TableHead>
                    <TableHead className="text-center">{language === 'tr' ? 'Siparisler' : 'Orders'}</TableHead>
                    <TableHead>{t.common.status}</TableHead>
                    <TableHead className="text-right">{t.common.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow
                      key={product.id}
                      className={`cursor-pointer transition-colors ${getRowClassName(product)}`}
                    >
                      <TableCell
                        className="font-medium"
                        onClick={() => handleProductClick(product)}
                      >
                        {product.name}
                      </TableCell>
                      <TableCell onClick={() => handleProductClick(product)}>
                        {product.sku}
                      </TableCell>
                      <TableCell onClick={() => handleProductClick(product)}>
                        {product.category}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={() => handleProductClick(product)}
                      >
                        {Number(product.current_stock).toFixed(0)}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={() => handleProductClick(product)}
                      >
                        <span className="text-[#475569] text-sm">
                          ${Number(product.average_cost || 0).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={() => handleProductClick(product)}
                      >
                        ${Number(product.sale_price).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center" onClick={() => handleProductClick(product)}>
                        {linkedOrderCounts[product.id] ? (
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                            <ShoppingCart className="h-2.5 w-2.5 mr-0.5" />
                            {linkedOrderCounts[product.id]}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell onClick={() => handleProductClick(product)}>
                        {getStockStatusBadge(product.stock_status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdjustment(product)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {t.inventory.adjust}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleProductClick(product)}>
                                <History className="h-4 w-4 mr-2" />
                                {t.inventory.viewHistory}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(product)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t.common.edit}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(product)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t.common.delete}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedProduct && (
        <StockMovementSheet
          product={selectedProduct}
          open={showMovementSheet}
          onOpenChange={setShowMovementSheet}
        />
      )}

      {adjustmentProduct && (
        <QuickStockAdjustmentDialog
          product={adjustmentProduct}
          open={showAdjustmentDialog}
          onOpenChange={setShowAdjustmentDialog}
          onComplete={handleAdjustmentComplete}
        />
      )}

      <AddProductDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={fetchProducts}
      />

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false)
            setEditingProduct(null)
          }}
          onSuccess={fetchProducts}
        />
      )}

      <BulkAddProductsDialog
        isOpen={showBulkAddDialog}
        onClose={() => setShowBulkAddDialog(false)}
        onSuccess={fetchProducts}
      />

      {deletingProduct && (
        <ConfirmDeleteDialog
          open={showDeleteDialog}
          onOpenChange={(open) => {
            setShowDeleteDialog(open)
            if (!open) setDeletingProduct(null)
          }}
          onConfirm={confirmDelete}
          title={t.inventory.deleteProduct}
          description={t.inventory.confirmDeleteProduct.replace('{name}', deletingProduct.name)}
        />
      )}

      <Toaster />
    </DashboardLayout>
  )
}
