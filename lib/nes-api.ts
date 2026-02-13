import { supabase } from './supabase'

const getHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    const { data: refreshData } = await supabase.auth.refreshSession()
    if (!refreshData.session) throw new Error('Not authenticated')
    return {
      'Authorization': `Bearer ${refreshData.session.access_token}`,
      'Content-Type': 'application/json',
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    }
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  }
}

async function callNesEdocument(action: string, tenantId: string, params: Record<string, unknown> = {}) {
  const headers = await getHeaders()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  let response: Response
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/nes-edocument`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, tenant_id: tenantId, ...params }),
    })
  } catch (err: any) {
    throw new Error(err?.message || 'NES API sunucusuna baglanilamiyor')
  }

  let data: any
  try {
    data = await response.json()
  } catch {
    throw new Error(`NES API beklenmeyen yanit (HTTP ${response.status})`)
  }

  if (!data.success) {
    throw new Error(data.error || 'NES API hatasi')
  }
  return data.data
}

export async function testNesConnection(tenantId: string) {
  return callNesEdocument('test_connection', tenantId)
}

export async function checkTaxpayer(tenantId: string, vkn: string) {
  return callNesEdocument('check_taxpayer', tenantId, { vkn })
}

export async function sendInvoice(tenantId: string, invoiceData: Record<string, unknown>, edocumentId?: string, draft = false) {
  return callNesEdocument('send_invoice', tenantId, { invoice_data: invoiceData, edocument_id: edocumentId, draft })
}

export async function sendEArchive(tenantId: string, invoiceData: Record<string, unknown>, edocumentId?: string) {
  return callNesEdocument('send_earchive', tenantId, { invoice_data: invoiceData, edocument_id: edocumentId })
}

export async function getIncomingInvoices(tenantId: string, beginDate: string, endDate: string) {
  return callNesEdocument('get_incoming_invoices', tenantId, { begin_date: beginDate, end_date: endDate })
}

export async function getOutgoingInvoices(tenantId: string, beginDate: string, endDate: string) {
  return callNesEdocument('get_outgoing_invoices', tenantId, { begin_date: beginDate, end_date: endDate })
}

export async function getInvoiceXml(tenantId: string, ettn: string, direction: string) {
  return callNesEdocument('get_invoice_xml', tenantId, { ettn, direction })
}

export async function getInvoiceHtml(tenantId: string, ettn: string, direction: string) {
  return callNesEdocument('get_invoice_html', tenantId, { ettn, direction })
}

export async function setTransferred(tenantId: string, ettnList: string[]) {
  return callNesEdocument('set_transferred', tenantId, { ettn_list: ettnList })
}

export async function approveDraft(tenantId: string, ettnList: string[], edocumentId?: string) {
  return callNesEdocument('approve_draft', tenantId, { ettn_list: ettnList, edocument_id: edocumentId })
}

export async function deleteDraft(tenantId: string, ettnList: string[]) {
  return callNesEdocument('delete_draft', tenantId, { ettn_list: ettnList })
}

export async function sendDespatch(tenantId: string, despatchData: Record<string, unknown>, edocumentId?: string) {
  return callNesEdocument('send_despatch', tenantId, { despatch_data: despatchData, edocument_id: edocumentId })
}

export async function getIncomingDespatches(tenantId: string, beginDate: string, endDate: string) {
  return callNesEdocument('get_incoming_despatches', tenantId, { begin_date: beginDate, end_date: endDate })
}

export async function sendEsmm(tenantId: string, voucherData: Record<string, unknown>, edocumentId?: string) {
  return callNesEdocument('send_esmm', tenantId, { voucher_data: voucherData, edocument_id: edocumentId })
}

export async function sendEmm(tenantId: string, voucherData: Record<string, unknown>, edocumentId?: string) {
  return callNesEdocument('send_emm', tenantId, { voucher_data: voucherData, edocument_id: edocumentId })
}

export async function getAccountInfo(tenantId: string) {
  return callNesEdocument('get_account_info', tenantId)
}

export async function getTemplates(tenantId: string) {
  return callNesEdocument('get_templates', tenantId)
}

export async function getEArchiveStatus(tenantId: string, ettnList: string[]) {
  return callNesEdocument('get_earchive_status', tenantId, { ettn_list: ettnList })
}

export async function cancelEArchive(tenantId: string, ettnList: string[]) {
  return callNesEdocument('cancel_earchive', tenantId, { ettn_list: ettnList })
}

export async function getCreditBalance(tenantId: string) {
  return callNesEdocument('get_credit_balance', tenantId)
}

export async function getInvoiceStatus(tenantId: string, ettnList: string[], edocumentId?: string) {
  return callNesEdocument('get_invoice_status', tenantId, { ettn_list: ettnList, edocument_id: edocumentId })
}

export async function cancelEInvoice(tenantId: string, ettnList: string[], cancelNote?: string, edocumentId?: string) {
  return callNesEdocument('cancel_einvoice', tenantId, { ettn_list: ettnList, cancel_note: cancelNote, edocument_id: edocumentId })
}

export async function getEArchivePdf(tenantId: string, ettn: string) {
  return callNesEdocument('get_earchive_pdf', tenantId, { ettn })
}
