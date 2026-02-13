'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  current_stock: number
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
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && product) {
      fetchMovements()
    }
  }, [open, product])

  async function fetchMovements() {
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
          <SheetTitle>Stock Movement History</SheetTitle>
          <SheetDescription>
            {product.name} (SKU: {product.sku})
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">Current Stock</div>
            <div className="text-2xl font-bold mt-1">
              {Number(product.current_stock).toFixed(0)} units
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Movement History</h3>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : movements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No stock movements recorded yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="text-xs">
                        {format(new Date(movement.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {movement.movement_type === 'in' ? (
                          <Badge className="bg-green-500">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            In
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Out
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {movement.movement_type === 'in' ? '+' : '-'}
                        {Number(movement.quantity).toFixed(0)}
                      </TableCell>
                      <TableCell>
                        {movement.movement_type === 'in' && movement.unit_cost > 0 ? (
                          <span className="text-sm">
                            {Number(movement.unit_cost).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {movement.movement_type === 'in' && movement.unit_cost > 0 ? (
                          <span className="font-medium">
                            {(Number(movement.quantity) * Number(movement.unit_cost)).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{movement.reason}</div>
                        {movement.notes && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {movement.notes}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
