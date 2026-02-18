/**
 * Devir bakiyesi (açılış bakiyesi) sistemi – tek kaynak.
 * Devir faturası (DEV-xxx / IADE-DEV-xxx) oluşturur ve cari bakiyesini günceller.
 * Bakiye yalnızca bu fonksiyonla güncellenir; trigger kullanılmaz.
 */

import { supabase } from './supabase'

/**
 * @param skipBalanceUpdate true = bakiye zaten insert ile set edildi (import); sadece fatura oluştur, cari güncelleme.
 */
export async function createOpeningBalanceInvoice(
  tenantId: string,
  customerId: string,
  enteredBalance: number,
  language: 'tr' | 'en',
  skipBalanceUpdate = false
): Promise<{ ok: boolean; error?: string }> {
  const amount = Number(enteredBalance)
  if (Number.isNaN(amount) || amount === 0) return { ok: true }

  const isRefund = amount < 0
  const absAmount = Math.abs(amount)
  const today = new Date().toISOString().split('T')[0]
  const invoiceNumber = isRefund ? `IADE-DEV-${Date.now()}` : `DEV-${Date.now()}`
  const lineDesc = isRefund
    ? (language === 'tr' ? 'Devir bakiyesi (İade)' : 'Opening balance (Refund)')
    : (language === 'tr' ? 'Devir bakiyesi' : 'Opening balance')
  const notes = isRefund
    ? (language === 'tr' ? 'Devir Faturası (İade) - Açılış bakiyesi' : 'Opening balance invoice (Refund)')
    : (language === 'tr' ? 'Devir Faturası - Açılış bakiyesi' : 'Opening balance invoice')

  try {
    // 1) Devir faturası ekle (sent, ödenmemiş)
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        invoice_number: invoiceNumber,
        issue_date: today,
        due_date: today,
        subtotal: absAmount,
        amount: absAmount,
        total: absAmount,
        total_vat: 0,
        tax_amount: 0,
        status: 'sent',
        paid_amount: 0,
        remaining_amount: absAmount,
        invoice_type: isRefund ? 'devir_return' : 'devir',
        notes,
      })
      .select('id')
      .single()

    if (invErr) throw invErr
    if (!invoice?.id) throw new Error('Invoice not created')

    // 2) Kalem ekle
    const { error: lineErr } = await supabase.from('invoice_line_items').insert({
      tenant_id: tenantId,
      invoice_id: invoice.id,
      product_name: lineDesc,
      description: notes,
      quantity: 1,
      unit_price: absAmount,
      vat_rate: 0,
      line_total: absAmount,
      vat_amount: 0,
      total_with_vat: absAmount,
    })
    if (lineErr) throw lineErr

    if (skipBalanceUpdate) return { ok: true }

    // 3) Cari bakiye ve total_revenue güncelle (tek kaynak = bu fonksiyon)
    const balanceDelta = isRefund ? -absAmount : absAmount
    const { data: customer, error: fetchErr } = await supabase
      .from('customers')
      .select('balance, total_revenue')
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (fetchErr) throw fetchErr

    const currentBalance = Number(customer?.balance ?? 0)
    const currentRevenue = Number(customer?.total_revenue ?? 0)
    const newBalance = currentBalance + balanceDelta
    const newRevenue = Math.max(0, currentRevenue + (isRefund ? -absAmount : absAmount))

    const { data: updatedRow, error: updateErr } = await supabase
      .from('customers')
      .update({
        balance: newBalance,
        total_revenue: newRevenue,
      })
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .select('balance')
      .maybeSingle()

    if (updateErr) {
      console.error('Devir bakiye güncellemesi başarısız:', updateErr)
      throw updateErr
    }
    // RLS 0 satır güncellemiş olabilir; dönen satır yoksa veya bakiye hâlâ 0 ise hata say
    if (!updatedRow || Number(updatedRow.balance) !== newBalance) {
      const msg = 'Cari bakiyesi güncellenemedi. RLS politikasını veya tenant_id eşleşmesini kontrol edin.'
      console.error(msg, { customerId, tenantId, newBalance, updatedRow })
      throw new Error(msg)
    }

    return { ok: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('createOpeningBalanceInvoice error:', message)
    return { ok: false, error: message }
  }
}
