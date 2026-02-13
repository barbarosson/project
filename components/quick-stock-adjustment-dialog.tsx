'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Plus, Minus } from 'lucide-react'
import { useTenant } from '@/contexts/tenant-context'

interface Product {
  id: string
  name: string
  current_stock: number
  critical_level: number
  purchase_price?: number
}

interface QuickStockAdjustmentDialogProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

export function QuickStockAdjustmentDialog({
  product,
  open,
  onOpenChange,
  onComplete
}: QuickStockAdjustmentDialogProps) {
  const { tenantId } = useTenant()
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState(product.purchase_price?.toString() || '')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!quantity || Number(quantity) <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the adjustment')
      return
    }

    setLoading(true)

    try {
      const adjustmentAmount = Number(quantity)
      const newStock = adjustmentType === 'add'
        ? Number(product.current_stock) + adjustmentAmount
        : Number(product.current_stock) - adjustmentAmount

      if (newStock < 0) {
        toast.error('Adjustment would result in negative stock')
        setLoading(false)
        return
      }

      let stockStatus = 'in_stock'
      if (newStock === 0) {
        stockStatus = 'out_of_stock'
      } else if (newStock <= Number(product.critical_level)) {
        stockStatus = 'low_stock'
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({
          current_stock: newStock,
          stock_status: stockStatus
        })
        .eq('id', product.id)

      if (updateError) throw updateError

      if (!tenantId) throw new Error('No tenant ID available')

      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: product.id,
          movement_type: adjustmentType === 'add' ? 'in' : 'out',
          quantity: adjustmentAmount,
          unit_cost: adjustmentType === 'add' && unitCost ? Number(unitCost) : 0,
          reason: reason,
          reference_type: 'adjustment',
          notes: notes || null,
          tenant_id: tenantId
        })

      if (movementError) throw movementError

      toast.success('Stock adjusted successfully')
      setQuantity('')
      setReason('')
      setNotes('')
      onComplete()
    } catch (error: any) {
      console.error('Error adjusting stock:', error)
      toast.error(error.message || 'Failed to adjust stock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Stock Adjustment</DialogTitle>
          <DialogDescription>
            Adjust inventory for {product.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">Current Stock</div>
            <div className="text-xl font-bold mt-1">
              {Number(product.current_stock).toFixed(0)} units
            </div>
          </div>

          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={adjustmentType === 'add' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setAdjustmentType('add')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Stock
              </Button>
              <Button
                type="button"
                variant={adjustmentType === 'subtract' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setAdjustmentType('subtract')}
              >
                <Minus className="h-4 w-4 mr-2" />
                Subtract Stock
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
            />
          </div>

          {adjustmentType === 'add' && (
            <div className="space-y-2">
              <Label htmlFor="unitCost">Unit Cost (Purchase Price)</Label>
              <Input
                id="unitCost"
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="Enter cost per unit"
              />
              {quantity && unitCost && (
                <p className="text-xs text-muted-foreground">
                  Total cost: {(Number(quantity) * Number(unitCost)).toFixed(2)}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Damaged goods, Stock count correction"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          {quantity && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-900">
                New stock will be:{' '}
                <span className="font-bold">
                  {adjustmentType === 'add'
                    ? Number(product.current_stock) + Number(quantity)
                    : Number(product.current_stock) - Number(quantity)
                  } units
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing...' : 'Confirm Adjustment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
