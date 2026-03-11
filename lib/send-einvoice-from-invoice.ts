import { supabase } from './supabase'
import { sendInvoice, sendEArchive } from './nes-api'

export type SendEInvoiceResult = { success: boolean; error?: string }

/**
 * Send a sales invoice as e-invoice/e-archive directly (no navigation).
 * Uses edocument_settings to determine docType (efatura vs earsiv). Sends immediately (no draft).
 * On success, sets invoice status to 'sent'.
 */
export async function sendEInvoiceFromInvoiceId(
  tenantId: string,
  invoiceId: string,
  _options?: { sendAsDraft?: boolean }
): Promise<SendEInvoiceResult> {
  const sendAsDraft = false

  try {
    const { data: existing } = await supabase
      .from('edocuments')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('local_invoice_id', invoiceId)
      .eq('direction', 'outgoing')
      .neq('status', 'draft')
      .limit(1)
      .maybeSingle()

    if (existing) {
      return { success: false, error: 'Bu fatura zaten e-belge olarak gönderilmiş.' }
    }

    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .single()

    if (invError || !invoice) {
      return { success: false, error: 'Fatura bulunamadı.' }
    }

    const { data: lineItems } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('tenant_id', tenantId)

    const { data: settings } = await supabase
      .from('edocument_settings')
      .select('company_vkn, company_title, default_series, sender_alias, efatura_enabled, earsiv_enabled')
      .eq('tenant_id', tenantId)
      .maybeSingle()

    let customer: Record<string, unknown> | null = null
    if (invoice.customer_id) {
      const { data: c } = await supabase
        .from('customers')
        .select('*')
        .eq('id', invoice.customer_id)
        .eq('tenant_id', tenantId)
        .maybeSingle()
      customer = c
    }

    const docType =
      settings?.efatura_enabled && settings?.earsiv_enabled
        ? 'efatura'
        : settings?.earsiv_enabled
          ? 'earsiv'
          : 'efatura'

    const withholdingAmount = Number((invoice as { withholding_amount?: number | null }).withholding_amount ?? 0) || 0
    const effectiveInvoiceType = withholdingAmount > 0 ? 'TEVKIFAT' : 'SATIS'

    const { data: edoc, error: insertError } = await supabase
      .from('edocuments')
      .insert({
        tenant_id: tenantId,
        document_type: docType,
        direction: 'outgoing',
        invoice_number: invoice.invoice_number,
        status: 'draft',
        sender_vkn: settings?.company_vkn || '',
        sender_title: settings?.company_title || '',
        receiver_vkn: customer?.tax_number || '',
        receiver_title: customer?.company_title || customer?.name || '',
        issue_date: invoice.issue_date || new Date().toISOString().split('T')[0],
        invoice_type: effectiveInvoiceType,
        currency: 'TRY',
        subtotal: invoice.subtotal || 0,
        tax_total: invoice.tax_total || 0,
        grand_total: invoice.total || invoice.amount || 0,
        local_invoice_id: invoice.id,
      })
      .select()
      .single()

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    if (docType === 'efatura' && !settings?.sender_alias?.trim()) {
      return {
        success: false,
        error:
          'E-Fatura göndermek için Kurulum sekmesinde "Gönderici etiketi (SenderAlias)" alanını doldurup kaydedin.',
      }
    }

    const lineTotal = (item: Record<string, unknown>) =>
      Number(item.total_with_vat ?? item.amount ?? item.line_total ?? 0)
    const lines = (lineItems || []).map((item: Record<string, unknown>, idx: number) => ({
      LineNumber: idx + 1,
      Name: String(item.description ?? ''),
      Quantity: Number(item.quantity ?? 1),
      UnitCode: 'ADET',
      UnitPrice: Number(item.unit_price ?? 0),
      TaxRate: [0, 1, 10, 20].includes(Number(item.vat_rate)) ? Number(item.vat_rate) : 20,
      TaxAmount:
        (Number(item.quantity ?? 1) * Number(item.unit_price ?? 0) * (Number(item.vat_rate) || 20)) / 100,
      LineTotal: lineTotal(item),
    }))

    const taxInclusive = invoice.total || invoice.amount || (Number(invoice.subtotal ?? 0) + Number(invoice.tax_total ?? 0))
    const payableAmount = withholdingAmount > 0 ? Math.round((taxInclusive - withholdingAmount) * 100) / 100 : taxInclusive

    const nesInvoiceData = {
      InvoiceNumber: invoice.invoice_number,
      InvoiceId: invoice.invoice_number,
      IssueDate: invoice.issue_date || new Date().toISOString().split('T')[0],
      InvoiceType: effectiveInvoiceType,
      Currency: 'TRY',
      DefaultSeries: settings?.default_series || 'INV',
      SenderVkn: settings?.company_vkn || '',
      SenderTitle: settings?.company_title || '',
      ReceiverVkn: customer?.tax_number || '',
      ReceiverTitle: customer?.company_title || customer?.name || '',
      ReceiverAddress: customer?.address || '',
      ReceiverCity: customer?.city || '',
      ReceiverCountry: customer?.country || 'Türkiye',
      TaxExclusiveAmount: invoice.subtotal || 0,
      TaxAmount: invoice.tax_total || 0,
      TaxInclusiveAmount: taxInclusive,
      PayableAmount: payableAmount,
      ...(withholdingAmount > 0 && {
        WithholdingAmount: withholdingAmount,
        TevkifatAmount: withholdingAmount,
        WithholdingReasonCode:
          (lineItems as Array<{ withholding_reason_code?: string | null }>).find((l) => l.withholding_reason_code)?.withholding_reason_code || '9015',
      }),
      Notes: invoice.notes || '',
      Lines: lines,
    }

    if (docType === 'efatura') {
      await sendInvoice(tenantId, nesInvoiceData, edoc?.id, sendAsDraft, {
        ...(settings?.sender_alias && { sender_alias: settings.sender_alias }),
      })
    } else {
      await sendEArchive(tenantId, nesInvoiceData, edoc?.id)
    }

    await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}
