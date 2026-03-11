import { supabase } from './supabase'

export type CopyInvoiceResult =
  | { success: true; newInvoiceId: string }
  | { success: false; error: string }

/**
 * Faturayı kopyalar: aynı müşteri, satırlar ve tutarlar; güncel tarih, yeni fatura no, taslak.
 * Müşteri bakiyesi güncellenmez (taslak).
 */
export async function copyInvoice(
  tenantId: string,
  sourceInvoiceId: string
): Promise<CopyInvoiceResult> {
  try {
    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', sourceInvoiceId)
      .eq('tenant_id', tenantId)
      .single()

    if (invErr || !inv) {
      return { success: false, error: 'Fatura bulunamadı.' }
    }

    const { data: lines, error: linesErr } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', sourceInvoiceId)
      .eq('tenant_id', tenantId)
      .order('created_at')

    if (linesErr) {
      return { success: false, error: linesErr.message }
    }

    const today = new Date().toISOString().slice(0, 10)
    const issueDate = new Date(inv.issue_date)
    const dueDate = new Date(inv.due_date)
    const daysDiff = Math.round((dueDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24))
    const newDue = new Date()
    newDue.setDate(newDue.getDate() + Math.max(0, daysDiff))
    const dueDateStr = newDue.toISOString().slice(0, 10)

    const newInvoiceNumber = `INV-${Date.now().toString().slice(-8)}`

    const { data: newInv, error: insertInvErr } = await supabase
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        customer_id: inv.customer_id,
        invoice_number: newInvoiceNumber,
        amount: inv.amount ?? inv.total ?? 0,
        total: inv.total ?? inv.amount ?? 0,
        subtotal: inv.subtotal ?? 0,
        total_vat: inv.total_vat ?? 0,
        withholding_amount: inv.withholding_amount ?? 0,
        status: 'draft',
        invoice_type: inv.invoice_type ?? 'sale',
        currency: inv.currency ?? 'TRY',
        issue_date: today,
        due_date: dueDateStr,
        notes: inv.notes ?? '',
        project_id: inv.project_id ?? null,
        staff_id: inv.staff_id ?? null,
      })
      .select('id')
      .single()

    if (insertInvErr || !newInv) {
      return { success: false, error: insertInvErr?.message ?? 'Fatura oluşturulamadı.' }
    }

    if (lines && lines.length > 0) {
      const lineRows = lines.map((line: Record<string, unknown>) => ({
        tenant_id: tenantId,
        invoice_id: newInv.id,
        product_id: line.product_id ?? null,
        product_name: line.product_name ?? '',
        description: line.description ?? '',
        quantity: Number(line.quantity ?? 1),
        unit_price: Number(line.unit_price ?? 0),
        vat_rate: Number(line.vat_rate ?? 20),
        line_total: Number(line.line_total ?? 0),
        vat_amount: Number(line.vat_amount ?? 0),
        total_with_vat: Number(line.total_with_vat ?? line.amount ?? 0),
        discount: Number(line.discount ?? 0),
        discount_type: line.discount_type ?? 'percent',
        otv: Number(line.otv ?? 0),
        otv_type: line.otv_type ?? 'percent',
        oiv: Number(line.oiv ?? 0),
        oiv_type: line.oiv_type ?? 'percent',
        accommodation_tax: Number(line.accommodation_tax ?? 0),
        export_code: line.export_code ?? null,
        withholding_reason_code: line.withholding_reason_code ?? null,
      }))

      const { error: insertLinesErr } = await supabase
        .from('invoice_line_items')
        .insert(lineRows)

      if (insertLinesErr) {
        await supabase.from('invoices').delete().eq('id', newInv.id).eq('tenant_id', tenantId)
        return { success: false, error: insertLinesErr.message }
      }
    }

    return { success: true, newInvoiceId: newInv.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { success: false, error: msg }
  }
}
