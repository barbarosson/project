import { supabase } from './supabase'

export interface InvoiceLineItem {
  product_id: string
  quantity: number
  unit_price: number
}

export interface StockSyncResult {
  success: boolean
  movements?: any[]
  error?: string
}

export async function syncStockMovementsForInvoice(
  invoiceId: string,
  tenantId: string,
  lineItems: InvoiceLineItem[],
  status: string
): Promise<StockSyncResult> {
  try {
    if (status !== 'paid' && status !== 'partially_paid') {
      return {
        success: true,
        movements: []
      }
    }

    const { data: existingMovements, error: fetchError } = await supabase
      .from('stock_movements')
      .select('id, product_id, quantity')
      .eq('tenant_id', tenantId)
      .eq('reference_type', 'invoice')
      .eq('reference_id', invoiceId)

    if (fetchError) throw fetchError

    const existingProductMap = new Map<string, any>(
      existingMovements?.map((m: any) => [m.product_id, m]) || []
    )

    const movementsToInsert: any[] = []
    const movementsToUpdate: any[] = []
    const productIdsToRemove: string[] = []

    for (const item of lineItems) {
      const existing = existingProductMap.get(item.product_id)

      if (!existing) {
        movementsToInsert.push({
          tenant_id: tenantId,
          product_id: item.product_id,
          movement_type: 'out',
          quantity: item.quantity,
          unit_cost: 0,
          reason: `Invoice ${invoiceId}`,
          reference_type: 'invoice',
          reference_id: invoiceId,
          notes: `Auto-generated from invoice update`
        })
      } else if (existing.quantity !== item.quantity) {
        movementsToUpdate.push({
          id: existing.id,
          quantity: item.quantity
        })
      }

      existingProductMap.delete(item.product_id)
    }

    for (const productId of Array.from(existingProductMap.keys())) {
      productIdsToRemove.push(productId)
    }

    if (movementsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('stock_movements')
        .insert(movementsToInsert)

      if (insertError) throw insertError
    }

    for (const movement of movementsToUpdate) {
      const { error: updateError } = await supabase
        .from('stock_movements')
        .update({ quantity: movement.quantity })
        .eq('id', movement.id)

      if (updateError) throw updateError
    }

    if (productIdsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('stock_movements')
        .delete()
        .eq('reference_id', invoiceId)
        .eq('reference_type', 'invoice')
        .in('product_id', productIdsToRemove)

      if (deleteError) throw deleteError
    }

    return {
      success: true,
      movements: [...movementsToInsert, ...movementsToUpdate]
    }
  } catch (error: any) {
    console.error('Stock sync error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function recalculateProductStock(
  productId: string,
  tenantId: string
): Promise<number> {
  try {
    const { data: movements, error } = await supabase
      .from('stock_movements')
      .select('movement_type, quantity')
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)

    if (error) throw error

    let totalStock = 0
    for (const movement of movements || []) {
      if (movement.movement_type === 'in' || movement.movement_type === 'adjustment_in') {
        totalStock += Number(movement.quantity)
      } else if (movement.movement_type === 'out' || movement.movement_type === 'adjustment_out') {
        totalStock -= Number(movement.quantity)
      }
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ stock_quantity: totalStock })
      .eq('id', productId)
      .eq('tenant_id', tenantId)

    if (updateError) throw updateError

    return totalStock
  } catch (error) {
    console.error('Error recalculating stock:', error)
    throw error
  }
}
