import { supabase } from './supabase'

export interface CreateOrderParams {
  tenantId: string
  customerId?: string
  projectId?: string
  source: 'manual' | 'marketplace' | 'import'
  sourceId?: string
  marketplaceAccountId?: string
  currency?: string
  shippingAddress?: Record<string, unknown>
  billingAddress?: Record<string, unknown>
  notes?: string
  items: {
    productId?: string
    productName: string
    sku?: string
    quantity: number
    unitPrice: number
    taxRate?: number
    discount?: number
  }[]
}

export interface IntegrationResult {
  success: boolean
  data?: any
  error?: string
}

async function generateOrderNumber(tenantId: string): Promise<string> {
  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  const seq = (count || 0) + 1
  const prefix = `ORD-${new Date().getFullYear()}`
  return `${prefix}-${String(seq).padStart(5, '0')}`
}

export async function createOrder(params: CreateOrderParams): Promise<IntegrationResult> {
  try {
    const orderNumber = await generateOrderNumber(params.tenantId)

    let subtotal = 0
    let taxTotal = 0
    const processedItems = params.items.map(item => {
      const taxRate = item.taxRate ?? 18
      const lineTotal = item.quantity * item.unitPrice - (item.discount || 0)
      const taxAmount = lineTotal * (taxRate / 100)
      subtotal += lineTotal
      taxTotal += taxAmount
      return {
        ...item,
        taxRate,
        taxAmount,
        total: lineTotal + taxAmount,
      }
    })

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: params.tenantId,
        order_number: orderNumber,
        source: params.source,
        source_id: params.sourceId || null,
        customer_id: params.customerId || null,
        project_id: params.projectId || null,
        marketplace_account_id: params.marketplaceAccountId || null,
        currency: params.currency || 'TRY',
        subtotal,
        tax_total: taxTotal,
        total: subtotal + taxTotal,
        shipping_address: params.shippingAddress || null,
        billing_address: params.billingAddress || null,
        notes: params.notes || null,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError) throw orderError

    const orderItems = processedItems.map(item => ({
      tenant_id: params.tenantId,
      order_id: order.id,
      product_id: item.productId || null,
      product_name: item.productName,
      sku: item.sku || null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      tax_rate: item.taxRate,
      tax_amount: item.taxAmount,
      discount: item.discount || 0,
      total: item.total,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    return { success: true, data: order }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createInvoiceFromOrder(
  orderId: string,
  tenantId: string
): Promise<IntegrationResult> {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single()

    if (orderError) throw orderError
    if (!order) throw new Error('Order not found')
    if (order.invoice_id) throw new Error('Invoice already exists for this order')

    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    const seq = (count || 0) + 1
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        invoice_number: invoiceNumber,
        customer_id: order.customer_id,
        order_id: orderId,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        subtotal: order.subtotal,
        total_vat: order.tax_total,
        amount: order.total,
        total: order.total,
        paid_amount: 0,
        remaining_amount: order.total,
        status: 'draft',
        notes: `Auto-created from order ${order.order_number}`,
      })
      .select()
      .single()

    if (invError) throw invError

    if (order.order_items?.length > 0) {
      const lineItems = order.order_items.map((item: any) => ({
        tenant_id: tenantId,
        invoice_id: invoice.id,
        product_id: item.product_id,
        description: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        total: item.total,
      }))

      await supabase.from('invoice_line_items').insert(lineItems)
    }

    await supabase
      .from('orders')
      .update({ invoice_id: invoice.id, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('tenant_id', tenantId)

    return { success: true, data: invoice }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateOrderStatus(
  orderId: string,
  tenantId: string,
  newStatus: string
): Promise<IntegrationResult> {
  try {
    const timestampFields: Record<string, string> = {
      confirmed: 'confirmed_at',
      shipped: 'shipped_at',
      delivered: 'delivered_at',
      cancelled: 'cancelled_at',
    }

    const updateData: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    const tsField = timestampFields[newStatus]
    if (tsField) {
      updateData[tsField] = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error

    if (newStatus === 'confirmed' || newStatus === 'shipped') {
      await syncStockForOrder(orderId, tenantId, 'deduct')
    }

    if (newStatus === 'cancelled') {
      await syncStockForOrder(orderId, tenantId, 'restore')
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function syncStockForOrder(
  orderId: string,
  tenantId: string,
  action: 'deduct' | 'restore'
): Promise<IntegrationResult> {
  try {
    const { data: existingMovements } = await supabase
      .from('stock_movements')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('reference_type', 'order')
      .eq('reference_id', orderId)

    if (action === 'deduct' && existingMovements && existingMovements.length > 0) {
      return { success: true, data: { message: 'Stock already deducted' } }
    }

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity, unit_price, product_name')
      .eq('order_id', orderId)
      .eq('tenant_id', tenantId)

    if (itemsError) throw itemsError

    const productItems = (items || []).filter(i => i.product_id)

    if (action === 'deduct') {
      const movements = productItems.map(item => ({
        tenant_id: tenantId,
        product_id: item.product_id,
        movement_type: 'out',
        quantity: item.quantity,
        unit_cost: item.unit_price,
        reason: `Order shipment`,
        reference_type: 'order',
        reference_id: orderId,
        notes: `Stock deducted for ${item.product_name}`,
      }))

      if (movements.length > 0) {
        const { error } = await supabase.from('stock_movements').insert(movements)
        if (error) throw error

        for (const item of productItems) {
          const { data: product } = await supabase
            .from('products')
            .select('current_stock')
            .eq('id', item.product_id)
            .eq('tenant_id', tenantId)
            .maybeSingle()

          if (product) {
            await supabase
              .from('products')
              .update({
                current_stock: Math.max(0, (product.current_stock || 0) - item.quantity),
                total_sold: supabase.rpc ? undefined : undefined,
              })
              .eq('id', item.product_id)
              .eq('tenant_id', tenantId)
          }
        }
      }
    } else if (action === 'restore') {
      const { data: movements } = await supabase
        .from('stock_movements')
        .select('id, product_id, quantity')
        .eq('tenant_id', tenantId)
        .eq('reference_type', 'order')
        .eq('reference_id', orderId)

      if (movements && movements.length > 0) {
        for (const mov of movements) {
          const { data: product } = await supabase
            .from('products')
            .select('current_stock')
            .eq('id', mov.product_id)
            .eq('tenant_id', tenantId)
            .maybeSingle()

          if (product) {
            await supabase
              .from('products')
              .update({ current_stock: (product.current_stock || 0) + mov.quantity })
              .eq('id', mov.product_id)
              .eq('tenant_id', tenantId)
          }
        }

        await supabase
          .from('stock_movements')
          .delete()
          .eq('tenant_id', tenantId)
          .eq('reference_type', 'order')
          .eq('reference_id', orderId)
      }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createOrderFromMarketplace(
  marketplaceOrderId: string,
  tenantId: string
): Promise<IntegrationResult> {
  try {
    const { data: mpOrder, error: mpError } = await supabase
      .from('marketplace_orders')
      .select('*, marketplace_order_items(*), marketplace_accounts(store_name, marketplaces(name, code))')
      .eq('id', marketplaceOrderId)
      .eq('tenant_id', tenantId)
      .single()

    if (mpError) throw mpError
    if (!mpOrder) throw new Error('Marketplace order not found')
    if (mpOrder.local_order_id) throw new Error('Order already created for this marketplace order')

    let customerId: string | undefined

    if (mpOrder.customer_email) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('email', mpOrder.customer_email)
        .maybeSingle()

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            tenant_id: tenantId,
            name: mpOrder.customer_name || 'Marketplace Customer',
            email: mpOrder.customer_email,
            phone: mpOrder.customer_phone || '',
            customer_type: 'individual',
            source: 'marketplace',
          })
          .select('id')
          .single()

        if (newCustomer) customerId = newCustomer.id
      }
    }

    const items = (mpOrder.marketplace_order_items || []).map((item: any) => ({
      productName: item.product_name || 'Marketplace Item',
      sku: item.marketplace_product_id || '',
      quantity: item.quantity || 1,
      unitPrice: item.unit_price || 0,
      taxRate: item.tax ? (item.tax / (item.unit_price * item.quantity) * 100) : 18,
      discount: item.discount || 0,
    }))

    if (items.length === 0) {
      items.push({
        productName: `Marketplace Order ${mpOrder.marketplace_order_id}`,
        sku: '',
        quantity: 1,
        unitPrice: mpOrder.total_amount || 0,
        taxRate: 18,
        discount: 0,
      })
    }

    const mpName = mpOrder.marketplace_accounts?.marketplaces?.name || 'Marketplace'

    const result = await createOrder({
      tenantId,
      customerId,
      source: 'marketplace',
      sourceId: mpOrder.marketplace_order_id,
      marketplaceAccountId: mpOrder.account_id,
      currency: mpOrder.currency || 'TRY',
      shippingAddress: mpOrder.shipping_address,
      notes: `${mpName} - ${mpOrder.marketplace_order_id}`,
      items,
    })

    if (result.success && result.data) {
      await supabase
        .from('marketplace_orders')
        .update({ local_order_id: result.data.id })
        .eq('id', marketplaceOrderId)
        .eq('tenant_id', tenantId)
    }

    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getOrderLinkedData(orderId: string, tenantId: string) {
  const [orderRes, invoiceRes, edocRes, stockRes] = await Promise.all([
    supabase
      .from('orders')
      .select('*, order_items(*), customers(name, company_title, email)')
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single(),
    supabase
      .from('invoices')
      .select('id, invoice_number, status, amount, paid_amount')
      .eq('order_id', orderId)
      .eq('tenant_id', tenantId),
    supabase
      .from('edocuments')
      .select('id, document_type, status, grand_total, ettn')
      .eq('order_id', orderId)
      .eq('tenant_id', tenantId),
    supabase
      .from('stock_movements')
      .select('id, product_id, movement_type, quantity, created_at')
      .eq('reference_type', 'order')
      .eq('reference_id', orderId)
      .eq('tenant_id', tenantId),
  ])

  return {
    order: orderRes.data,
    invoices: invoiceRes.data || [],
    edocuments: edocRes.data || [],
    stockMovements: stockRes.data || [],
  }
}

export async function getModuleStats(tenantId: string) {
  const [ordersRes, invoicesRes, productsRes, edocsRes, mpOrdersRes] = await Promise.all([
    supabase
      .from('orders')
      .select('status', { count: 'exact' })
      .eq('tenant_id', tenantId),
    supabase
      .from('invoices')
      .select('status, amount, paid_amount')
      .eq('tenant_id', tenantId),
    supabase
      .from('products')
      .select('current_stock, critical_level, stock_status')
      .eq('tenant_id', tenantId),
    supabase
      .from('edocuments')
      .select('status, direction')
      .eq('tenant_id', tenantId),
    supabase
      .from('marketplace_orders')
      .select('local_order_id, status')
      .eq('tenant_id', tenantId),
  ])

  const orders = ordersRes.data || []
  const invoices = invoicesRes.data || []
  const products = productsRes.data || []
  const edocs = edocsRes.data || []
  const mpOrders = mpOrdersRes.data || []

  return {
    orders: {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing' || o.status === 'confirmed').length,
      completed: orders.filter(o => o.status === 'completed' || o.status === 'delivered').length,
    },
    invoices: {
      total: invoices.length,
      unpaid: invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length,
      totalRevenue: invoices.reduce((s, i) => s + (i.paid_amount || 0), 0),
    },
    inventory: {
      total: products.length,
      lowStock: products.filter(p => p.stock_status === 'low_stock').length,
      outOfStock: products.filter(p => p.stock_status === 'out_of_stock').length,
    },
    edocuments: {
      total: edocs.length,
      pending: edocs.filter(d => d.status === 'draft' || d.status === 'queued').length,
    },
    marketplace: {
      totalOrders: mpOrders.length,
      unlinked: mpOrders.filter(m => !m.local_order_id).length,
    },
  }
}
