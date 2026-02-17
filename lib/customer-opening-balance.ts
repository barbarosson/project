import { supabase } from './supabase'

export async function createOpeningBalanceInvoice(
  tenantId: string,
  customerId: string,
  enteredBalance: number,
  language: 'tr' | 'en'
): Promise<{ ok: boolean; error?: string }> {
  try {
    const systemBalance = 0
    const difference = enteredBalance - systemBalance
    if (difference === 0) return { ok: true }

    const isRefund = difference < 0
    const amount = Math.abs(difference)
    const today = new Date().toISOString().split('T')[0]
    const invoiceNumber = isRefund ? `IADE-DEV-${Date.now()}` : `DEV-${Date.now()}`
    const lineDescription = isRefund
      ? (language === 'tr' ? 'Devir bakiyesi (İade)' : 'Opening balance (Refund)')
      : (language === 'tr' ? 'Devir bakiyesi' : 'Opening balance')
    const notes = isRefund
      ? (language === 'tr' ? 'Devir Faturası (İade) - Açılış bakiyesi' : 'Opening balance invoice (Refund)')
      : (language === 'tr' ? 'Devir Faturası - Açılış bakiyesi' : 'Opening balance invoice')

    // Devir faturasında KDV kesinlikle 0 (total_vat: 0, tax_amount: 0)
    const invoicePayload: Record<string, unknown> = {
      tenant_id: tenantId,
      customer_id: customerId,
      invoice_number: invoiceNumber,
      issue_date: today,
      due_date: today,
      subtotal: amount,
      amount,
      total_vat: 0,
      tax_amount: 0,
      status: isRefund ? 'unpaid' : 'paid',
      notes
    }
    if (!isRefund) {
      invoicePayload.payment_date = today
      invoicePayload.paid_amount = amount
      invoicePayload.remaining_amount = 0
    }

    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert([invoicePayload])
      .select('id')
      .single()

    if (invError) throw invError
    if (!invoice?.id) throw new Error('Invoice not created')

    const { error: lineError } = await supabase.from('invoice_line_items').insert({
      tenant_id: tenantId,
      invoice_id: invoice.id,
      product_name: lineDescription,
      description: notes,
      quantity: 1,
      unit_price: amount,
      vat_rate: 0,
      line_total: amount,
      vat_amount: 0,
      total_with_vat: amount
    })
    if (lineError) throw lineError

    return { ok: true }
  } catch (err: any) {
    console.error('Error creating opening balance invoice:', err)
    return { ok: false, error: err?.message || String(err) }
  }
}
