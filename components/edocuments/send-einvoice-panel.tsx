'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { sendInvoice, sendEArchive, checkTaxpayer } from '@/lib/nes-api'
import { toast } from 'sonner'
import {
  Send, Loader2, FileText, CheckCircle2, AlertTriangle, ArrowRight,
} from 'lucide-react'

interface SendEInvoicePanelProps {
  tenantId: string
  language: 'en' | 'tr'
}

interface LocalInvoice {
  id: string
  invoice_number: string
  customer_id: string | null
  total: number
  issue_date: string
  status: string
  customers: { name: string } | null
}

interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
  amount: number
}

export function SendEInvoicePanel({ tenantId, language }: SendEInvoicePanelProps) {
  const [invoices, setInvoices] = useState<LocalInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [docType, setDocType] = useState<'efatura' | 'earsiv'>('efatura')
  const [invoiceType, setInvoiceType] = useState('SATIS')
  const [sendAsDraft, setSendAsDraft] = useState(false)
  const isTr = language === 'tr'

  useEffect(() => {
    loadInvoices()
  }, [tenantId])

  async function loadInvoices() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, customer_id, total, issue_date, status, customers(name)')
        .eq('tenant_id', tenantId)
        .in('status', ['sent', 'approved', 'paid', 'partially_paid'])
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setInvoices(data || [])
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendEInvoice() {
    if (!selectedInvoiceId) {
      toast.error(isTr ? 'Lutfen bir fatura secin' : 'Please select an invoice')
      return
    }

    setSending(true)
    try {
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', selectedInvoiceId)
        .single()

      if (invError || !invoice) throw new Error(isTr ? 'Fatura bulunamadi' : 'Invoice not found')

      const { data: lineItems } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', selectedInvoiceId)

      const { data: settings } = await supabase
        .from('edocument_settings')
        .select('company_vkn, company_title, default_series')
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

      const { data: edoc } = await supabase
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
          receiver_title: customer?.name || '',
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

      const nesInvoiceData = {
        InvoiceNumber: invoice.invoice_number,
        IssueDate: invoice.issue_date || new Date().toISOString().split('T')[0],
        InvoiceType: invoiceType,
        Currency: 'TRY',
        SenderVkn: settings?.company_vkn || '',
        SenderTitle: settings?.company_title || '',
        ReceiverVkn: customer?.tax_number || '',
        ReceiverTitle: customer?.name || '',
        ReceiverAddress: customer?.address || '',
        ReceiverCity: customer?.city || '',
        ReceiverCountry: customer?.country || 'Turkiye',
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
        await sendInvoice(tenantId, nesInvoiceData, edoc?.id, sendAsDraft)
      } else {
        await sendEArchive(tenantId, nesInvoiceData, edoc?.id)
      }

      toast.success(isTr
        ? `${docType === 'efatura' ? 'E-Fatura' : 'E-Arsiv'} ${sendAsDraft ? 'taslak olarak kaydedildi' : 'gonderildi'}!`
        : `${docType === 'efatura' ? 'E-Invoice' : 'E-Archive'} ${sendAsDraft ? 'saved as draft' : 'sent'}!`
      )
      setSelectedInvoiceId('')
    } catch (error: any) {
      toast.error(error.message || (isTr ? 'Gonderim basarisiz' : 'Send failed'))
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
            <div className="p-2 rounded-lg bg-[#0D1B2A]">
              <Send className="h-5 w-5 text-[#B8E6FF]" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {isTr ? 'Faturadan E-Belge Gonder' : 'Send E-Document from Invoice'}
              </CardTitle>
              <CardDescription>
                {isTr
                  ? 'Sistemdeki bir faturayi secip NES uzerinden e-fatura veya e-arsiv olarak gonderin'
                  : 'Select an existing invoice and send it as e-invoice or e-archive via NES'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isTr ? 'Fatura Sec' : 'Select Invoice'}
              </label>
              <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                <SelectTrigger>
                  <SelectValue placeholder={isTr ? 'Fatura secin...' : 'Choose invoice...'} />
                </SelectTrigger>
                <SelectContent>
                  {invoices.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      {isTr ? 'Gonderilecek fatura bulunamadi' : 'No invoices ready to send'}
                    </div>
                  ) : (
                    invoices.map(inv => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.invoice_number} - {inv.customers?.name || 'N/A'} ({formatCurrency(inv.total, 'TRY')})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isTr ? 'Belge Turu' : 'Document Type'}
              </label>
              <Select value={docType} onValueChange={(v) => setDocType(v as 'efatura' | 'earsiv')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efatura">{isTr ? 'E-Fatura' : 'E-Invoice'}</SelectItem>
                  <SelectItem value="earsiv">{isTr ? 'E-Arsiv' : 'E-Archive'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isTr ? 'Fatura Turu' : 'Invoice Type'}
              </label>
              <Select value={invoiceType} onValueChange={setInvoiceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SATIS">{isTr ? 'Satis' : 'Sales'}</SelectItem>
                  <SelectItem value="IADE">{isTr ? 'Iade' : 'Return'}</SelectItem>
                  <SelectItem value="TEVKIFAT">{isTr ? 'Tevkifat' : 'Withholding'}</SelectItem>
                  <SelectItem value="ISTISNA">{isTr ? 'Istisna' : 'Exemption'}</SelectItem>
                  <SelectItem value="OZELMATRAH">{isTr ? 'Ozel Matrah' : 'Special Base'}</SelectItem>
                  <SelectItem value="IHRACKAYITLI">{isTr ? 'Ihrac Kayitli' : 'Export Registered'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {docType === 'efatura' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {isTr ? 'Gonderim Modu' : 'Send Mode'}
                </label>
                <Select
                  value={sendAsDraft ? 'draft' : 'send'}
                  onValueChange={(v) => setSendAsDraft(v === 'draft')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send">{isTr ? 'Direkt Gonder' : 'Send Directly'}</SelectItem>
                    <SelectItem value="draft">{isTr ? 'Taslak Kaydet' : 'Save as Draft'}</SelectItem>
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
                  <p className="text-xs text-muted-foreground">{isTr ? 'Musteri' : 'Customer'}</p>
                  <p className="font-medium">{selectedInvoice.customers?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isTr ? 'Tarih' : 'Date'}</p>
                  <p className="font-medium">
                    {selectedInvoice.issue_date
                      ? new Date(selectedInvoice.issue_date).toLocaleDateString(isTr ? 'tr-TR' : 'en-US')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isTr ? 'Toplam' : 'Total'}</p>
                  <p className="font-bold">{formatCurrency(selectedInvoice.total, 'TRY')}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSendEInvoice}
              disabled={sending || !selectedInvoiceId}
              className="bg-[#0D1B2A] hover:bg-[#132d46]"
            >
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isTr
                ? sendAsDraft ? 'Taslak Olarak Kaydet' : 'E-Belge Gonder'
                : sendAsDraft ? 'Save as Draft' : 'Send E-Document'}
            </Button>

            {docType === 'efatura' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                {isTr
                  ? 'Gonderdikten sonra iptal edilemez'
                  : 'Cannot be cancelled after sending'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function formatCurrency(amount: number, currency: string) {
  const symbols: Record<string, string> = { TRY: '\u20BA', USD: '$', EUR: '\u20AC', GBP: '\u00A3' }
  return `${symbols[currency] || ''}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
}
