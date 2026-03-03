'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'

interface Product {
  id: string
  name: string
  sku: string
  current_stock: number
  stock_quantity?: number
}

interface StockMovement {
  id: string
  movement_type: string
  quantity: number
  unit_cost: number
  reason: string
  reference_type: string
  notes: string
  created_at: string
}

interface StockMovementSheetProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StockMovementSheet({ product, open, onOpenChange }: StockMovementSheetProps) {
  const { tenantId } = useTenant()
  const { t } = useLanguage()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [displayedStock, setDisplayedStock] = useState<number | null>(null)

  useEffect(() => {
    if (open && product) {
      setDisplayedStock(Number(product.current_stock ?? product.stock_quantity ?? 0))
      fetchMovements()
      if (tenantId) {
        supabase
          .from('products')
          .select('current_stock, stock_quantity')
          .eq('id', product.id)
          .eq('tenant_id', tenantId)
          .single()
          .then(({ data }) => {
            if (data) setDisplayedStock(Number(data.current_stock ?? data.stock_quantity ?? 0))
          })
      }
    }
  }, [open, product?.id, tenantId])

  async function fetchMovements() {
    if (!product) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setMovements(data || [])
    } catch (error) {
      console.error('Error fetching stock movements:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="min-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t.inventory.stockMovementHistory}</SheetTitle>
          <SheetDescription>
            {product.name} ({t.inventory.sku}: {product.sku})
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">{t.inventory.currentStock}</div>
            <div className="text-2xl font-bold mt-1">
              {displayedStock !== null ? Number(displayedStock).toFixed(0) : (Number(product.current_stock ?? product.stock_quantity ?? 0).toFixed(0))} {t.inventory.units}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">{t.inventory.movementHistory}</h3>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">{t.inventory.loadingMovements}</div>
            ) : movements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t.inventory.noStockMovementsYet}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.common.date}</TableHead>
                    <TableHead>{t.common.type}</TableHead>
                    <TableHead>{t.common.quantity}</TableHead>
                    <TableHead>{t.inventory.unitCost}</TableHead>
                    <TableHead>{t.inventory.totalCost}</TableHead>
                    <TableHead>{t.inventory.reason}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => {
                    const isInMovement = movement.movement_type === 'in' || movement.movement_type === 'purchase'
                    return (
                      <TableRow key={movement.id}>
                        <TableCell className="text-xs">
                          {format(new Date(movement.created_at), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          {isInMovement ? (
                            <Badge className="bg-green-500">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {t.inventory.movementIn}
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              {t.inventory.movementOut}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {isInMovement ? '+' : '-'}
                          {Number(movement.quantity).toFixed(0)}
                        </TableCell>
                        <TableCell>
                          {isInMovement && Number(movement.unit_cost) > 0 ? (
                            <span className="text-sm">
                              {Number(movement.unit_cost).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isInMovement && Number(movement.unit_cost) > 0 ? (
                            <span className="font-medium">
                              {(Number(movement.quantity) * Number(movement.unit_cost)).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>{movement.reason || '-'}</div>
                          {movement.notes && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {movement.notes}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
