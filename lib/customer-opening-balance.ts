import { supabase } from './supabase'

export async function createOpeningBalanceInvoice(
  tenantId: string,
  customerId: string,
  enteredBalance: number,
  language: 'tr' | 'en',
  /** true = içe aktarmada balance zaten insert ile set edildi, tekrar güncelleme (çift sayım olmasın) */
  skipBalanceUpdate = false
): Promise<{ ok: boolean; error?: string }> {
  try {
    const entered = Number(enteredBalance)
    if (Number.isNaN(entered)) return { ok: false, error: 'Invalid opening balance' }
    const systemBalance = 0
    const difference = entered - systemBalance
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
    // Devir = önceki dönemden kalan bakiye, gerçek tahsilat yok; banka hareketi olmadığı için unpaid
    const invoicePayload: Record<string, unknown> = {
      tenant_id: tenantId,
      customer_id: customerId,
      invoice_number: invoiceNumber,
      issue_date: today,
      due_date: today,
      subtotal: amount,
      amount,
      total: amount,
      total_vat: 0,
      tax_amount: 0,
      status: 'sent',
      paid_amount: 0,
      remaining_amount: amount,
      notes
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

    // Bakiye güncellemesi: devir faturalarında DB trigger (sync_customer_balance_on_devir_invoice)
    // INSERT sonrası customers.balance ve total_revenue'yu günceller. RLS'tan bağımsız, tek kaynak.
    // skipBalanceUpdate eski davranış için bırakıldı; artık trigger her zaman bakiyeyi günceller.
    return { ok: true }
  } catch (err: any) {
    console.error('Error creating opening balance invoice:', err)
    return { ok: false, error: err?.message || String(err) }
  }
}
