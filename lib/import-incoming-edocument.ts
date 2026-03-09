import { supabase } from '@/lib/supabase'
import { getInvoiceXml } from '@/lib/nes-api'
import { parseUblInvoiceLines } from '@/lib/parse-ubl-invoice'

function getContentString(raw: unknown): string {
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object' && 'content' in raw && typeof (raw as { content: unknown }).content === 'string') {
    return (raw as { content: string }).content
  }
  return ''
}

export type ImportIncomingResult =
  | { success: true; purchaseInvoiceId: string }
  | { success: false; alreadyImported: true; purchaseInvoiceId: string }
  | { success: false; error: string }

/**
 * Imports an incoming e-document into the system as a purchase invoice (alış faturası).
 * - Finds or creates the supplier (cari) by VKN/TCKN or title.
 * - Creates purchase_invoice and purchase_invoice_line_items from UBL XML.
 * - Links edocument to the new purchase invoice.
 */
export async function importIncomingEdocumentToPurchase(
  tenantId: string,
  edocumentId: string
): Promise<ImportIncomingResult> {
  const baseCols =
    'id, ettn, invoice_number, sender_vkn, sender_title, subtotal, tax_total, grand_total, issue_date, currency, direction'
  let result = await supabase
    .from('edocuments')
    .select(`${baseCols}, local_purchase_invoice_id`)
    .eq('id', edocumentId)
    .eq('tenant_id', tenantId)
    .single()

  if (result.error) {
    const msg = result.error.message ?? ''
    const missingCol = msg.includes('local_purchase_invoice_id') || result.error.code === '42703'
    if (missingCol) {
      result = await supabase
        .from('edocuments')
        .select(baseCols)
        .eq('id', edocumentId)
        .eq('tenant_id', tenantId)
        .single()
    }
  }

  const edoc = result.data as (typeof result.data) & { local_purchase_invoice_id?: string | null }
  if (result.error || !edoc) {
    return { success: false, error: result.error?.message || 'E-belge bulunamadı.' }
  }
  if (edoc.direction !== 'incoming') {
    return { success: false, error: 'Sadece gelen faturalar içe aktarılabilir.' }
  }
  if (edoc.local_purchase_invoice_id) {
    return {
      success: false,
      alreadyImported: true,
      purchaseInvoiceId: edoc.local_purchase_invoice_id,
    }
  }
  if (!edoc.ettn) {
    return { success: false, error: 'ETTN yok; fatura içeriği alınamıyor.' }
  }

  let xml = ''
  try {
    const raw = await getInvoiceXml(tenantId, edoc.ettn, 'incoming')
    xml = getContentString(raw)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { success: false, error: `XML alınamadı: ${msg}` }
  }
  if (!xml.trim()) {
    return { success: false, error: 'Fatura XML boş.' }
  }

  let lines = parseUblInvoiceLines(xml)
  if (lines.length === 0) {
    const subtotal = Number(edoc.subtotal ?? 0)
    const taxTotal = Number(edoc.tax_total ?? 0)
    const grandTotal = Number(edoc.grand_total ?? 0)
    lines = [
      {
        description: edoc.invoice_number ? `Fatura ${edoc.invoice_number}` : 'İçe aktarılan fatura',
        quantity: 1,
        unit_price: subtotal > 0 ? subtotal : grandTotal - taxTotal,
        tax_rate: subtotal > 0 ? (taxTotal / subtotal) * 100 : 18,
        tax_amount: taxTotal,
        total: grandTotal,
      },
    ]
  }

  const senderVkn = (edoc.sender_vkn ?? '').toString().trim()
  const senderTitle = (edoc.sender_title ?? '').toString().trim() || 'Bilinmeyen tedarikçi'

  let supplierId: string | null = null
  if (senderVkn) {
    const { data: byVkn } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('tax_number', senderVkn)
      .in('account_type', ['vendor', 'both'])
      .limit(1)
      .maybeSingle()
    supplierId = byVkn?.id ?? null
  }
  if (!supplierId && senderTitle) {
    const { data: byTitle } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .ilike('company_title', senderTitle)
      .in('account_type', ['vendor', 'both'])
      .limit(1)
      .maybeSingle()
    supplierId = byTitle?.id ?? null
  }
  if (!supplierId && senderTitle) {
    const { data: anyCari } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .or(`company_title.ilike.%${senderTitle.replace(/%/g, '')}%,name.ilike.%${senderTitle.replace(/%/g, '')}%`)
      .limit(1)
      .maybeSingle()
    supplierId = anyCari?.id ?? null
  }

  if (!supplierId) {
    const { data: newCustomer, error: insErr } = await supabase
      .from('customers')
      .insert({
        tenant_id: tenantId,
        company_title: senderTitle,
        name: senderTitle,
        account_type: 'vendor',
        tax_number: senderVkn || null,
        status: 'active',
      })
      .select('id')
      .single()
    if (insErr) {
      return { success: false, error: `Cari oluşturulamadı: ${insErr.message}` }
    }
    supplierId = newCustomer?.id ?? null
  }
  if (!supplierId) {
    return { success: false, error: 'Tedarikçi (cari) bulunamadı ve oluşturulamadı.' }
  }

  const invoiceNumber = (edoc.invoice_number ?? `E-${edoc.ettn.slice(0, 8)}`).trim()
  const issueDate = (edoc.issue_date ?? new Date().toISOString().split('T')[0]).toString()

  const subtotal = lines.reduce((s, l) => s + (l.quantity * l.unit_price), 0)
  const taxAmount = lines.reduce((s, l) => s + l.tax_amount, 0)
  const totalAmount = lines.reduce((s, l) => s + l.total, 0)

  const { data: newInv, error: invErr } = await supabase
    .from('purchase_invoices')
    .insert({
      tenant_id: tenantId,
      supplier_id: supplierId,
      invoice_number: invoiceNumber,
      invoice_date: issueDate,
      due_date: issueDate,
      subtotal: Math.round(subtotal * 100) / 100,
      tax_amount: Math.round(taxAmount * 100) / 100,
      total_amount: Math.round(totalAmount * 100) / 100,
      status: 'pending',
      invoice_type: 'purchase',
      edocument_id: edoc.id,
    })
    .select('id')
    .single()

  if (invErr) {
    if (invErr.code === '23505') {
      return { success: false, error: 'Bu fatura numarası zaten alış faturalarında mevcut.' }
    }
    return { success: false, error: `Alış faturası oluşturulamadı: ${invErr.message}` }
  }
  const purchaseInvoiceId = newInv?.id
  if (!purchaseInvoiceId) {
    return { success: false, error: 'Alış faturası kaydı oluşturuldu ancak id alınamadı.' }
  }

  for (const line of lines) {
    const lineTotal = line.quantity * line.unit_price
    const lineTax = line.tax_amount
    const lineTotalWithTax = lineTotal + lineTax
    await supabase.from('purchase_invoice_line_items').insert({
      tenant_id: tenantId,
      purchase_invoice_id: purchaseInvoiceId,
      description: line.description || 'Kalem',
      quantity: line.quantity,
      unit_price: Math.round(line.unit_price * 100) / 100,
      tax_rate: line.tax_rate,
      tax_amount: Math.round(lineTax * 100) / 100,
      total: Math.round(lineTotalWithTax * 100) / 100,
    })
  }

  const { error: updateErr } = await supabase
    .from('edocuments')
    .update({
      local_purchase_invoice_id: purchaseInvoiceId,
      transferred: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', edocumentId)
    .eq('tenant_id', tenantId)

  if (updateErr) {
    const msg = updateErr.message ?? ''
    const missingCol = msg.includes('local_purchase_invoice_id') || updateErr.code === '42703'
    if (!missingCol) {
      return { success: false, error: `E-belge güncellenemedi: ${updateErr.message}` }
    }
  }

  return { success: true, purchaseInvoiceId }
}
