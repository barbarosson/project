'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { Package, FileText } from 'lucide-react'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { StockMovementSheet } from '@/components/stock-movement-sheet'
import { format } from 'date-fns'

interface ProductStock {
  id: string
  name: string
  sku: string
  category: string
  unit: string
  current_stock: number
  stock_quantity?: number
  purchase_price: number
  last_purchase_reason?: string
  last_purchase_at?: string
  last_purchase_quantity?: number
  last_purchase_unit_cost?: number
}

export default function StocksPage() {
  const { tenantId, loading: tenantLoading } = useTenant()
  const { t } = useLanguage()
  const [rows, setRows] = useState<ProductStock[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<ProductStock | null>(null)
  const [showMovementSheet, setShowMovementSheet] = useState(false)

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchData()
    }
  }, [tenantId, tenantLoading])

  async function fetchData() {
    if (!tenantId) return

    setLoading(true)
    try {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, category, unit, current_stock, stock_quantity, purchase_price')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('name')

      if (productsError) throw productsError

      const productList = products || []

      const { data: movements } = await supabase
        .from('stock_movements')
        .select('product_id, reason, created_at, quantity, unit_cost')
        .eq('tenant_id', tenantId)
        .eq('reference_type', 'purchase_invoice')
        .order('created_at', { ascending: false })

      const lastByProduct: Record<string, { reason: string; created_at: string; quantity: number; unit_cost: number }> = {}
      for (const m of movements || []) {
        if (m.product_id && !lastByProduct[m.product_id]) {
          lastByProduct[m.product_id] = {
            reason: m.reason || '',
            created_at: m.created_at,
            quantity: Number(m.quantity),
            unit_cost: Number(m.unit_cost || 0),
          }
        }
      }

      setRows(
        productList.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku || '-',
          category: p.category || '-',
          unit: p.unit || '-',
          current_stock: Number(p.current_stock ?? p.stock_quantity ?? 0),
          stock_quantity: p.stock_quantity,
          purchase_price: Number(p.purchase_price || 0),
          last_purchase_reason: lastByProduct[p.id]?.reason,
          last_purchase_at: lastByProduct[p.id]?.created_at,
          last_purchase_quantity: lastByProduct[p.id]?.quantity,
          last_purchase_unit_cost: lastByProduct[p.id]?.unit_cost,
        }))
      )
    } catch (error) {
      console.error('Error fetching stocks:', error)
    } finally {
      setLoading(false)
    }
  }

  const displayProduct = selectedProduct
    ? {
        id: selectedProduct.id,
        name: selectedProduct.name,
        sku: selectedProduct.sku,
        current_stock: selectedProduct.current_stock,
        stock_quantity: selectedProduct.stock_quantity,
      }
    : null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#0A2540] flex items-center gap-2">
            <Package className="h-7 w-7" />
            {t.inventory.stocksPageTitle}
          </h1>
          <p className="text-sm text-slate-600 mt-1">{t.inventory.stocksPageDescription}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.inventory.stocksPageTitle}</CardTitle>
            <CardDescription>{t.inventory.stocksPageDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">{t.inventory.loadingMovements}</div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.inventory.productName}</TableHead>
                      <TableHead>{t.inventory.sku}</TableHead>
                      <TableHead>{t.inventory.category}</TableHead>
                      <TableHead className="text-right">{t.inventory.currentStock}</TableHead>
                      <TableHead className="text-right">{t.inventory.unitCost}</TableHead>
                      <TableHead>{t.inventory.lastPurchase}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {t.inventory.noProductsYet}
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            setSelectedProduct(row)
                            setShowMovementSheet(true)
                          }}
                        >
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell>{row.sku}</TableCell>
                          <TableCell>{row.category}</TableCell>
                          <TableCell className="text-right">
                            {Number(row.current_stock ?? row.stock_quantity ?? 0).toFixed(0)} {t.inventory.units}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.last_purchase_unit_cost != null && row.last_purchase_unit_cost > 0
                              ? Number(row.last_purchase_unit_cost).toFixed(2)
                              : row.purchase_price > 0
                                ? Number(row.purchase_price).toFixed(2)
                                : '-'}
                          </TableCell>
                          <TableCell>
                            {row.last_purchase_at ? (
                              <span className="flex items-center gap-1 text-xs">
                                <FileText className="h-3.5 w-3.5" />
                                {row.last_purchase_reason || '-'} · {format(new Date(row.last_purchase_at), 'dd MMM yyyy')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {displayProduct && (
        <StockMovementSheet
          product={displayProduct}
          open={showMovementSheet}
          onOpenChange={setShowMovementSheet}
        />
      )}
    </DashboardLayout>
  )
}
