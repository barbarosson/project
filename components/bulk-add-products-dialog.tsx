'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useTenant } from '@/contexts/tenant-context'
import { Plus, Trash2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BulkAddProductsDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ProductRow {
  id: string
  name: string
  sku: string
  category: string
  unit: string
  purchase_price: string
  sale_price: string
  stock_quantity: string
}

export function BulkAddProductsDialog({ isOpen, onClose, onSuccess }: BulkAddProductsDialogProps) {
  const { tenantId } = useTenant()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<ProductRow[]>([
    {
      id: crypto.randomUUID(),
      name: '',
      sku: '',
      category: 'product',
      unit: 'piece',
      purchase_price: '',
      sale_price: '',
      stock_quantity: '0'
    }
  ])

  const addRow = () => {
    if (products.length >= 100) {
      toast.warning('Maximum 100 products can be added at once')
      return
    }
    setProducts([
      ...products,
      {
        id: crypto.randomUUID(),
        name: '',
        sku: '',
        category: 'product',
        unit: 'piece',
        purchase_price: '',
        sale_price: '',
        stock_quantity: '0'
      }
    ])
  }

  const removeRow = (id: string) => {
    if (products.length > 1) {
      setProducts(products.filter(p => p.id !== id))
    }
  }

  const updateRow = (id: string, field: keyof ProductRow, value: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validProducts = products.filter(p => p.name.trim() && p.sku.trim() && p.sale_price)

    if (validProducts.length === 0) {
      toast.error('Please fill in at least one product')
      return
    }

    if (validProducts.length > 100) {
      toast.error('Maximum 100 products can be added at once. Please reduce the number of items.')
      return
    }

    setLoading(true)

    try {
      if (!tenantId) {
        throw new Error('No tenant ID available. Please log in again.')
      }

      const BATCH_SIZE = 25
      let totalInserted = 0

      for (let i = 0; i < validProducts.length; i += BATCH_SIZE) {
        const batch = validProducts.slice(i, i + BATCH_SIZE)

        const productsToInsert = batch.map(p => ({
          name: p.name,
          sku: p.sku,
          category: p.category,
          unit: p.unit,
          purchase_price: parseFloat(p.purchase_price) || 0,
          sale_price: parseFloat(p.sale_price),
          description: '',
          status: 'active',
          tenant_id: tenantId,
        }))

        const { data: insertedProducts, error: productError } = await supabase
          .from('products')
          .insert(productsToInsert)
          .select()

        if (productError) throw productError

        const inventoryData = insertedProducts.map((product, index) => ({
          product_id: product.id,
          stock_quantity: parseInt(batch[index].stock_quantity) || 0,
          min_stock_level: 0,
          tenant_id: tenantId,
        }))

        const { error: inventoryError } = await supabase
          .from('inventory')
          .insert(inventoryData)

        if (inventoryError) throw inventoryError

        const stockMovements = insertedProducts.map((product, index) => {
          const qty = parseInt(batch[index].stock_quantity) || 0
          if (qty > 0) {
            return {
              product_id: product.id,
              movement_type: 'in',
              quantity: qty,
              unit_cost: parseFloat(batch[index].purchase_price) || 0,
              reason: 'Initial stock from bulk import',
              reference_type: 'initial_stock',
              notes: 'Bulk import initial stock',
              tenant_id: tenantId,
            }
          }
          return null
        }).filter(Boolean)

        if (stockMovements.length > 0) {
          await supabase.from('stock_movements').insert(stockMovements)
        }

        totalInserted += insertedProducts.length

        if (validProducts.length > BATCH_SIZE) {
          toast.info(`Progress: ${totalInserted}/${validProducts.length} products added...`)
        }
      }

      toast.success(`Successfully added ${totalInserted} products`)
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Error bulk adding products:', error)
      if (error.message?.includes('payload') || error.code === '413') {
        toast.error('Too much data. Please reduce the number of products and try again.')
      } else {
        toast.error(error.message || 'Failed to add products')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setProducts([
      {
        id: crypto.randomUUID(),
        name: '',
        sku: '',
        category: 'product',
        unit: 'piece',
        purchase_price: '',
        sale_price: '',
        stock_quantity: '0'
      }
    ])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Add Products</DialogTitle>
          <DialogDescription>
            Add multiple products at once (Maximum: 100 products)
            {products.length >= 80 && (
              <span className="text-amber-600 font-medium ml-2">
                ({products.length}/100 rows)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 text-sm font-medium mb-2">
              <div>Product Name *</div>
              <div>SKU *</div>
              <div>Category</div>
              <div>Unit</div>
              <div>Purchase</div>
              <div>Sale Price *</div>
              <div>Stock</div>
              <div></div>
            </div>

            {products.map((product) => (
              <div key={product.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2">
                <Input
                  value={product.name}
                  onChange={(e) => updateRow(product.id, 'name', e.target.value)}
                  placeholder="Product name"
                />
                <Input
                  value={product.sku}
                  onChange={(e) => updateRow(product.id, 'sku', e.target.value)}
                  placeholder="SKU"
                />
                <Select
                  value={product.category}
                  onValueChange={(value) => updateRow(product.id, 'category', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="raw_material">Raw Material</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={product.unit}
                  onValueChange={(value) => updateRow(product.id, 'unit', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piece">Pcs</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="meter">M</SelectItem>
                    <SelectItem value="liter">L</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  value={product.purchase_price}
                  onChange={(e) => updateRow(product.id, 'purchase_price', e.target.value)}
                  placeholder="0.00"
                />
                <Input
                  type="number"
                  step="0.01"
                  value={product.sale_price}
                  onChange={(e) => updateRow(product.id, 'sale_price', e.target.value)}
                  placeholder="0.00"
                />
                <Input
                  type="number"
                  value={product.stock_quantity}
                  onChange={(e) => updateRow(product.id, 'stock_quantity', e.target.value)}
                  placeholder="0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(product.id)}
                  disabled={products.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addRow} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : `Add ${products.filter(p => p.name && p.sku).length} Products`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
