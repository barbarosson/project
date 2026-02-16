import { supabase } from './supabase'

export type NotificationType =
  | 'invoice_overdue'
  | 'low_stock'
  | 'payment_received'
  | 'new_customer'
  | 'new_order'
  | 'stock_out'
  | 'system'

interface CreateNotificationParams {
  tenantId: string
  userId?: string
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: any
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        tenant_id: params.tenantId,
        user_id: params.userId || null,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
        metadata: params.metadata || null,
        is_read: false
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { data: null, error }
  }
}

export async function checkOverdueInvoices(tenantId: string) {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data: overdueInvoices, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, customer_id, due_date, amount')
      .eq('tenant_id', tenantId)
      .eq('status', 'sent')
      .lt('due_date', today)

    if (error) throw error

    for (const invoice of overdueInvoices || []) {
      const { data: customer } = await supabase
        .from('customers')
        .select('name')
        .eq('id', invoice.customer_id)
        .single()

      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('type', 'invoice_overdue')
        .eq('metadata->>invoice_id', invoice.id)
        .maybeSingle()

      if (!existingNotification) {
        await createNotification({
          tenantId,
          type: 'invoice_overdue',
          title: 'Overdue Invoice',
          message: `Invoice ${invoice.invoice_number} from ${customer?.name || 'customer'} is overdue`,
          link: `/invoices/${invoice.id}`,
          metadata: {
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            customer_name: customer?.name
          }
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error checking overdue invoices:', error)
    return { success: false, error }
  }
}

export async function checkLowStock(tenantId: string) {
  try {
    const { data: byStatus, error: errStatus } = await supabase
      .from('products')
      .select('id, name, current_stock, critical_level')
      .eq('tenant_id', tenantId)
      .eq('stock_status', 'low_stock')

    let lowStockProducts = (byStatus || []) as { id: string; name: string; current_stock?: number; critical_level?: number; stock_quantity?: number; min_stock_level?: number }[]

    if (errStatus || !lowStockProducts.length) {
      const { data: byLevel, error: errLevel } = await supabase
        .from('products')
        .select('id, name, stock_quantity, min_stock_level')
        .eq('tenant_id', tenantId)

      if (!errLevel && byLevel?.length) {
        const minLevel = byLevel.filter(
          (p: any) => p.min_stock_level != null && Number(p.stock_quantity) <= Number(p.min_stock_level) && Number(p.stock_quantity) > 0
        )
        lowStockProducts = minLevel.map((p: any) => ({ id: p.id, name: p.name, current_stock: p.stock_quantity, critical_level: p.min_stock_level }))
      }
    }

    for (const product of lowStockProducts) {
      const stock = product.current_stock ?? (product as any).stock_quantity
      const level = product.critical_level ?? (product as any).min_stock_level
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('type', 'low_stock')
        .eq('metadata->>product_id', product.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle()

      if (!existingNotification) {
        await createNotification({
          tenantId,
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${product.name} is running low (${stock} units remaining)`,
          link: '/inventory',
          metadata: {
            product_id: product.id,
            product_name: product.name,
            current_stock: stock,
            critical_level: level
          }
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error checking low stock:', error)
    return { success: false, error }
  }
}

export async function checkOutOfStock(tenantId: string) {
  try {
    const { data: byStatus, error: errStatus } = await supabase
      .from('products')
      .select('id, name, current_stock')
      .eq('tenant_id', tenantId)
      .eq('stock_status', 'out_of_stock')

    let outOfStockProducts = (byStatus || []) as { id: string; name: string; current_stock?: number; stock_quantity?: number }[]

    if (errStatus || !outOfStockProducts.length) {
      const { data: byQty, error: errQty } = await supabase
        .from('products')
        .select('id, name, stock_quantity')
        .eq('tenant_id', tenantId)
        .lte('stock_quantity', 0)

      if (!errQty && byQty?.length) {
        outOfStockProducts = byQty.map((p: any) => ({ id: p.id, name: p.name, current_stock: p.stock_quantity }))
      }
    }

    for (const product of outOfStockProducts) {
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('type', 'stock_out')
        .eq('metadata->>product_id', product.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle()

      if (!existingNotification) {
        await createNotification({
          tenantId,
          type: 'stock_out',
          title: 'Out of Stock',
          message: `${product.name} is out of stock`,
          link: '/inventory',
          metadata: {
            product_id: product.id,
            product_name: product.name
          }
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error checking out of stock:', error)
    return { success: false, error }
  }
}
