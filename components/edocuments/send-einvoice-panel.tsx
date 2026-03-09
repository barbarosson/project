'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { sendInvoice, sendEArchive } from '@/lib/nes-api'
import { toast } from 'sonner'
import {
  Send, Loader2, FileText, AlertTriangle,
} from 'lucide-react'

interface SendEInvoicePanelProps {
  tenantId: string
  language: 'en' | 'tr'
  translations?: Record<string, string>
  initialSelectedInvoiceId?: string
  onSwitchToSetup?: () => void
  onSent?: () => void
}

interface LocalInvoice {
  id: string
  invoice_number: string
  customer_id: string | null
  total: number
  issue_date: string
  status: string
  customers: { name: string; company_title?: string } | null
}

interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
  amount: number
}

type EdocModuleFlags = { efatura_enabled: boolean; earsiv_enabled: boolean; sender_alias?: string }

export function SendEInvoicePanel({ tenantId, language, translations: tr, initialSelectedInvoiceId, onSwitchToSetup, onSent }: SendEInvoicePanelProps) {
  const [invoices, setInvoices] = useState<LocalInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(initialSelectedInvoiceId ?? '')
  const [sending, setSending] = useState(false)
  const [docType, setDocType] = useState<'efatura' | 'earsiv'>('efatura')
  const [invoiceType, setInvoiceType] = useState('SATIS')
  const [sendAsDraft, setSendAsDraft] = useState(false)
  const [moduleFlags, setModuleFlags] = useState<EdocModuleFlags | null>(null)
  const t = tr || {}
  const isTr = language === 'tr'

  useEffect(() => {
    loadInvoices()
  }, [tenantId])

  useEffect(() => {
    if (initialSelectedInvoiceId && invoices.some((inv) => inv.id === initialSelectedInvoiceId)) {
      setSelectedInvoiceId(initialSelectedInvoiceId)
    }
  }, [initialSelectedInvoiceId, invoices])

  useEffect(() => {
    let cancelled = false
    supabase
      .from('edocument_settings')
      .select('efatura_enabled, earsiv_enabled, sender_alias')
      .eq('tenant_id', tenantId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return
        setModuleFlags({
          efatura_enabled: !!data.efatura_enabled,
          earsiv_enabled: !!data.earsiv_enabled,
          sender_alias: data.sender_alias ?? '',
        })
      })
    return () => { cancelled = true }
  }, [tenantId])

  useEffect(() => {
    if (!moduleFlags) return
    const { efatura_enabled, earsiv_enabled } = moduleFlags
    if (earsiv_enabled && !efatura_enabled) setDocType('earsiv')
    else if (efatura_enabled && !earsiv_enabled) setDocType('efatura')
    else if (efatura_enabled && earsiv_enabled) setDocType('efatura')
  }, [moduleFlags])

  async function loadInvoices() {
    setLoading(true)
    try {
      const { data: invoiceList, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, customer_id, total, issue_date, status, customers(name, company_title)')
        .eq('tenant_id', tenantId)
        .in('status', ['sent', 'paid', 'overdue'])
        .order('created_at', { ascending: false })
        .limit(80)

      if (error) throw error

      const { data: sentEdocs } = await supabase
        .from('edocuments')
        .select('local_invoice_id')
        .eq('tenant_id', tenantId)
        .eq('direction', 'outgoing')
        .neq('status', 'draft')
        .not('local_invoice_id', 'is', null)

      const sentInvoiceIds = new Set((sentEdocs ?? []).map((d) => d.local_invoice_id).filter(Boolean))
      const notYetSent = (invoiceList ?? []).filter((inv) => !sentInvoiceIds.has(inv.id))
      setInvoices(notYetSent)
      setSelectedInvoiceId((prev) => (sentInvoiceIds.has(prev) ? '' : prev))
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendEInvoice() {
    if (!selectedInvoiceId) {
      toast.error(t.pleaseSelectInvoice ?? (isTr ? 'Lütfen bir fatura seçin' : 'Please select an invoice'))
      return
    }

    setSending(true)
    try {
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', selectedInvoiceId)
        .single()

      if (invError || !invoice) throw new Error(t.invoiceNotFound ?? (isTr ? 'Fatura bulunamadı' : 'Invoice not found'))

      const { data: lineItems } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', selectedInvoiceId)

      const { data: settings } = await supabase
        .from('edocument_settings')
        .select('company_vkn, company_title, default_series, sender_alias')
        .eq('tenant_id', tenantId)
        .maybeSingle()

      let customer: any = null
      if (invoice.customer_id) {
        const { data: c } = await supabase
          .from('customers')
          .select('*')
          .eq('id', invoice.customer_id)
          .maybeSingle()
        customer = c
      }

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
          invoice_type: invoiceType,
          currency: 'TRY',
          subtotal: invoice.subtotal || 0,
          tax_total: invoice.tax_total || 0,
          grand_total: invoice.total || 0,
          local_invoice_id: invoice.id,
        })
        .select()
        .single()

      if (insertError) throw insertError

      if (docType === 'efatura' && !settings?.sender_alias?.trim()) {
        toast.error(t.senderAliasRequired || (isTr
          ? 'E-Fatura göndermek için Kurulum sekmesinde "Gönderici etiketi (SenderAlias)" alanını doldurup kaydedin (örn: urn:mail:defaultgb@nes.com.tr).'
          : 'To send e-invoice, fill "Sender alias (SenderAlias)" in the Setup tab and save (e.g. urn:mail:defaultgb@nes.com.tr).'))
        setSending(false)
        return
      }

      const nesInvoiceData = {
        InvoiceNumber: invoice.invoice_number,
        InvoiceId: invoice.invoice_number,
        IssueDate: invoice.issue_date || new Date().toISOString().split('T')[0],
        InvoiceType: invoiceType,
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
        PayableAmount: invoice.total || 0,
        Notes: invoice.notes || '',
        Lines: (lineItems || []).map((item: InvoiceLineItem, idx: number) => ({
          LineNumber: idx + 1,
          Name: item.description || '',
          Quantity: item.quantity || 1,
          UnitCode: 'ADET',
          UnitPrice: item.unit_price || 0,
          TaxRate: item.tax_rate || 20,
          TaxAmount: ((item.quantity || 1) * (item.unit_price || 0) * (item.tax_rate || 20)) / 100,
          LineTotal: item.amount || 0,
        })),
      }

      if (docType === 'efatura') {
        await sendInvoice(tenantId, nesInvoiceData, edoc?.id, sendAsDraft, {
          ...(settings?.sender_alias && { sender_alias: settings.sender_alias }),
        })
      } else {
        await sendEArchive(tenantId, nesInvoiceData, edoc?.id)
      }

      const msg = docType === 'efatura'
        ? (sendAsDraft ? (t.efaturaDraft ?? 'E-Invoice saved as draft!') : (t.efaturaSent ?? 'E-Invoice sent!'))
        : (sendAsDraft ? (t.earsivDraft ?? 'E-Archive saved as draft!') : (t.earsivSent ?? 'E-Archive sent!'))
      toast.success(msg)
      setSelectedInvoiceId('')
      loadInvoices()
      onSent?.()
    } catch (error: any) {
      toast.error(error.message || (t.sendFailed ?? (isTr ? 'Gönderim başarısız' : 'Send failed')))
    } finally {
      setSending(false)
    }
  }

  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0A2540]">
              <Send className="h-5 w-5 text-[#B8E6FF]" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {t.sendFromInvoice ?? (isTr ? 'Faturadan E-Belge Gönder' : 'Send E-Document from Invoice')}
              </CardTitle>
              <CardDescription>
                {t.sendFromInvoiceDesc ?? (isTr
                  ? 'Sistemdeki bir faturayı seçip NES üzerinden e-fatura veya e-arşiv olarak gönderin'
                  : 'Select an existing invoice and send it as e-invoice or e-archive via NES')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {docType === 'efatura' && moduleFlags && !moduleFlags.sender_alias?.trim() && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {t.senderAliasRequiredShort ?? (isTr ? 'E-Fatura göndermek için Gönderici etiketi gerekli' : 'Sender alias required to send e-invoice')}
                </p>
                <p className="text-sm mt-1 opacity-90">
                  {t.senderAliasHint ?? (isTr
                    ? 'Kurulum sekmesinde "Gönderici etiketi (SenderAlias)" alanını doldurup kaydedin. Örnek: urn:mail:defaultgb@nes.com.tr'
                    : 'Fill "Sender alias (SenderAlias)" in the Setup tab and save. Example: urn:mail:defaultgb@nes.com.tr')}
                </p>
                {onSwitchToSetup && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/50"
                    onClick={onSwitchToSetup}
                  >
                    {t.goToSetup ?? (isTr ? 'Kuruluma git' : 'Go to Setup')}
                  </Button>
                )}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t.selectInvoice ?? (isTr ? 'Fatura Seç' : 'Select Invoice')}
              </label>
              <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                <SelectTrigger>
                  <SelectValue placeholder={t.chooseInvoice ?? (isTr ? 'Fatura seçin...' : 'Choose invoice...')} />
                </SelectTrigger>
                <SelectContent>
                  {invoices.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      {t.noInvoicesReady ?? (isTr ? 'Gönderilecek fatura bulunamadı' : 'No invoices ready to send')}
                    </div>
                  ) : (
                    invoices.map(inv => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.invoice_number} - {inv.customers?.company_title || inv.customers?.name || 'N/A'} ({formatCurrency(inv.total, 'TRY')})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t.documentType ?? (isTr ? 'Belge Türü' : 'Document Type')}
              </label>
              {moduleFlags && moduleFlags.efatura_enabled && moduleFlags.earsiv_enabled ? (
                <Select value={docType} onValueChange={(v) => setDocType(v as 'efatura' | 'earsiv')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efatura">{t.efatura ?? (isTr ? 'E-Fatura' : 'E-Invoice')}</SelectItem>
                    <SelectItem value="earsiv">{t.earsiv ?? (isTr ? 'E-Arşiv' : 'E-Archive')}</SelectItem>
                  </SelectContent>
                </Select>
              ) : moduleFlags ? (
                <div className="flex h-10 items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  {docType === 'efatura' ? (t.efatura ?? (isTr ? 'E-Fatura' : 'E-Invoice')) : (t.earsiv ?? (isTr ? 'E-Arşiv' : 'E-Archive'))}
                  {' '}{t.perSetup ?? (isTr ? '(Kuruluma göre)' : '(per setup)')}
                </div>
              ) : (
                <Select value={docType} onValueChange={(v) => setDocType(v as 'efatura' | 'earsiv')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efatura">{t.efatura ?? (isTr ? 'E-Fatura' : 'E-Invoice')}</SelectItem>
                    <SelectItem value="earsiv">{t.earsiv ?? (isTr ? 'E-Arşiv' : 'E-Archive')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t.invoiceType ?? (isTr ? 'Fatura Türü' : 'Invoice Type')}
              </label>
              <Select value={invoiceType} onValueChange={setInvoiceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SATIS">{t.satis ?? (isTr ? 'Satış' : 'Sales')}</SelectItem>
                  <SelectItem value="IADE">{t.iade ?? (isTr ? 'İade' : 'Return')}</SelectItem>
                  <SelectItem value="TEVKIFAT">{t.tevkifat ?? (isTr ? 'Tevkifat' : 'Withholding')}</SelectItem>
                  <SelectItem value="ISTISNA">{t.istisna ?? (isTr ? 'İstisna' : 'Exemption')}</SelectItem>
                  <SelectItem value="OZELMATRAH">{t.ozelmatrah ?? (isTr ? 'Özel Matrah' : 'Special Base')}</SelectItem>
                  <SelectItem value="IHRACKAYITLI">{t.ihrackayitli ?? (isTr ? 'İhraç Kayıtlı' : 'Export Registered')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {docType === 'efatura' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t.sendMode ?? (isTr ? 'Gönderim Modu' : 'Send Mode')}
                </label>
                <Select
                  value={sendAsDraft ? 'draft' : 'send'}
                  onValueChange={(v) => setSendAsDraft(v === 'draft')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send">{t.sendDirectly ?? (isTr ? 'Direkt Gönder' : 'Send Directly')}</SelectItem>
                    <SelectItem value="draft">{t.saveAsDraft ?? (isTr ? 'Taslak Kaydet' : 'Save as Draft')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {selectedInvoice && (
            <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {selectedInvoice.invoice_number}
                </h4>
                <Badge variant="outline" className="text-xs">
                  {selectedInvoice.status}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{t.customerLabel ?? (isTr ? 'Müşteri' : 'Customer')}</p>
                  <p className="font-medium">{selectedInvoice.customers?.company_title || selectedInvoice.customers?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.dateLabel ?? (isTr ? 'Tarih' : 'Date')}</p>
                  <p className="font-medium">
                    {selectedInvoice.issue_date
                      ? new Date(selectedInvoice.issue_date).toLocaleDateString(isTr ? 'tr-TR' : 'en-US')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.totalLabel ?? (isTr ? 'Toplam' : 'Total')}</p>
                  <p className="font-bold">{formatCurrency(selectedInvoice.total, 'TRY')}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSendEInvoice}
              disabled={sending || !selectedInvoiceId}
              className="bg-[#0A2540] hover:bg-[#1e3a5f]"
            >
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {sendAsDraft ? (t.saveAsDraftButton ?? t.saveAsDraft ?? (isTr ? 'Taslak Olarak Kaydet' : 'Save as Draft')) : (t.sendEdocButton ?? (isTr ? 'E-Belge Gönder' : 'Send E-Document'))}
            </Button>

            {docType === 'efatura' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                {t.cannotCancelAfterSend ?? (isTr ? 'Gönderdikten sonra iptal edilemez' : 'Cannot be cancelled after sending')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function formatCurrency(amount: number, currency: string) {
  const symbols: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' }
  return `${symbols[currency] || ''}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
}
