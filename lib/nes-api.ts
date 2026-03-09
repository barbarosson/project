import { supabase } from './supabase'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: refreshData } = await supabase.auth.refreshSession()
  const token = refreshData.session?.access_token
  if (!token) throw new Error('Oturum gecersiz. Cikis yapip tekrar giris yapin.')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  }
}

async function callNesEdocument(action: string, tenantId: string, params: Record<string, unknown> = {}, retryOn401 = true): Promise<unknown> {
  const headers = await getAuthHeaders()
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

  const isAuthError = response.status === 401 || /invalid jwt|invalid token|unauthorized/i.test(String(data?.error ?? data?.message ?? ''))

  if (isAuthError && retryOn401) {
    await supabase.auth.refreshSession()
    return callNesEdocument(action, tenantId, params, false)
  }

  if (!data.success) {
    const raw =
      (typeof data.error === 'string' ? data.error
      : (data.message ?? data.err ?? (data.details ? String(data.details) : null)))
      || `NES API hatasi (HTTP ${response.status})`
    if (isAuthError) {
      throw new Error(raw)
    }
    throw new Error(raw)
  }
  return data.data
}

export async function testNesConnection(tenantId: string) {
  return callNesEdocument('test_connection', tenantId)
}

export async function checkTaxpayer(tenantId: string, vkn: string) {
  return callNesEdocument('check_taxpayer', tenantId, { vkn })
}

export async function sendInvoice(
  tenantId: string,
  invoiceData: Record<string, unknown>,
  edocumentId?: string,
  draft = false,
  options?: { sender_alias?: string; ubl_xml?: string; receiver_alias?: string }
) {
  return callNesEdocument('send_invoice', tenantId, {
    invoice_data: invoiceData,
    edocument_id: edocumentId,
    draft,
    ...(options?.ubl_xml && { ubl_xml: options.ubl_xml }),
    ...(options?.sender_alias && { sender_alias: options.sender_alias }),
    ...(options?.receiver_alias && { receiver_alias: options.receiver_alias }),
  })
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

export type AccountInfoResponse = {
  Result?: {
    RemainingCredit?: number
    Credit?: number
    Balance?: number
    TotalMonthlyUnits?: number
  }
  RemainingCredit?: number
  Credit?: number
  Balance?: number
}

export async function getAccountInfo(tenantId: string): Promise<AccountInfoResponse> {
  return callNesEdocument('get_account_info', tenantId) as Promise<AccountInfoResponse>
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
