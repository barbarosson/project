'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Toaster } from '@/components/ui/sonner'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { getIncomingInvoices, getOutgoingInvoices } from '@/lib/nes-api'
import { toast } from 'sonner'
import {
  FileCheck2, Settings2, FileText, Search, ArrowDownLeft, ArrowUpRight, Loader2,
  AlertCircle, Download, Send, ShoppingCart, Link2,
} from 'lucide-react'
import { EdocumentSettings } from '@/components/edocuments/edocument-settings'
import { EdocumentList } from '@/components/edocuments/edocument-list'
import { EdocumentStats } from '@/components/edocuments/edocument-stats'
import { TaxpayerCheck } from '@/components/edocuments/taxpayer-check'
import { SendEInvoicePanel } from '@/components/edocuments/send-einvoice-panel'

interface Edocument {
  id: string
  document_type: string
  direction: string
  ettn: string | null
  invoice_number: string | null
  status: string
  sender_vkn?: string | null
  sender_title: string | null
  receiver_vkn?: string | null
  receiver_title: string | null
  issue_date: string
  invoice_type?: string | null
  currency: string
  subtotal?: number
  tax_total?: number
  grand_total: number
  notes?: string | null
  ubl_xml?: string | null
  html_content?: string | null
  error_message?: string | null
  nes_response?: unknown
  transferred?: boolean
  created_at: string
}

export default function EdocumentsPage() {
  const { tenantId } = useTenant()
  const { language, t } = useLanguage()
  const [activeTab, setActiveTab] = useState('documents')
  const [hasSettings, setHasSettings] = useState<boolean | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<Edocument | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [syncing, setSyncing] = useState<'incoming' | 'outgoing' | null>(null)

  const tr = t.edocuments
  const [linkedInvoiceCount, setLinkedInvoiceCount] = useState(0)
  const [linkedOrderCount, setLinkedOrderCount] = useState(0)

  useEffect(() => {
    if (tenantId) checkSettings()
  }, [tenantId])

  async function checkSettings() {
    const { data } = await supabase
      .from('edocument_settings')
      .select('id, is_active')
      .eq('tenant_id', tenantId)
      .maybeSingle()

    setHasSettings(!!data?.is_active)

    const { count: invCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'paid')

    setLinkedInvoiceCount(invCount || 0)

    const { count: ordCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('status', ['completed', 'delivered'])

    setLinkedOrderCount(ordCount || 0)
  }

  function handleViewDocument(doc: Edocument) {
    setSelectedDoc(doc)
    setDetailOpen(true)
  }

  async function handleSyncInvoices(direction: 'incoming' | 'outgoing') {
    if (!tenantId) return
    setSyncing(direction)
    try {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const beginDate = thirtyDaysAgo.toISOString().split('T')[0]
      const endDate = now.toISOString().split('T')[0]

      const result = direction === 'incoming'
        ? await getIncomingInvoices(tenantId, beginDate, endDate)
        : await getOutgoingInvoices(tenantId, beginDate, endDate)

      const invoiceList = result?.Result?.InvoiceList || result?.InvoiceList || []
      let imported = 0

      for (const inv of invoiceList) {
        const ettn = inv.Ettn || inv.UUID || inv.Id
        if (!ettn) continue

        const { data: existing } = await supabase
          .from('edocuments')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('ettn', ettn)
          .maybeSingle()

        if (!existing) {
          await supabase.from('edocuments').insert({
            tenant_id: tenantId,
            document_type: 'efatura',
            direction,
            ettn,
            invoice_number: inv.InvoiceNumber || inv.InvoiceId || null,
            status: inv.Status?.toLowerCase() || 'delivered',
            sender_vkn: inv.SenderVkn || inv.SenderIdentifier || null,
            sender_title: inv.SenderTitle || inv.SenderName || null,
            receiver_vkn: inv.ReceiverVkn || inv.ReceiverIdentifier || null,
            receiver_title: inv.ReceiverTitle || inv.ReceiverName || null,
            issue_date: inv.IssueDate || inv.InvoiceDate || new Date().toISOString().split('T')[0],
            invoice_type: inv.InvoiceType || 'SATIS',
            currency: inv.Currency || 'TRY',
            subtotal: parseFloat(inv.SubTotal || inv.TaxExclusiveAmount || '0'),
            tax_total: parseFloat(inv.TaxTotal || inv.TaxAmount || '0'),
            grand_total: parseFloat(inv.GrandTotal || inv.PayableAmount || inv.TaxInclusiveAmount || '0'),
            nes_response: inv,
          })
          imported++
        }
      }

      const msg = language === 'tr'
        ? `${invoiceList.length} fatura bulundu, ${imported} yeni fatura eklendi`
        : `${invoiceList.length} invoices found, ${imported} new imported`
      toast.success(msg)
    } catch (error: any) {
      toast.error(error.message || 'Sync failed')
    } finally {
      setSyncing(null)
    }
  }

  if (!tenantId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      draft: tr.draft, queued: tr.queued, sent: tr.sent,
      delivered: tr.delivered, accepted: tr.accepted, rejected: tr.rejected, cancelled: tr.cancelled,
    }
    return map[s] || s
  }

  const docTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      efatura: tr.efatura, earsiv: tr.earsiv, edespatch: tr.edespatch,
      esmm: tr.esmm, emm: tr.emm, ebook: tr.ebook,
    }
    return map[type] || type
  }

  return (
    <DashboardLayout>
      <Toaster position="top-right" />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0D1B2A] to-[#1B3A5C]">
              <FileCheck2 className="h-6 w-6 text-[#B8E6FF]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{tr.title}</h1>
              <p className="text-sm text-muted-foreground">{tr.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasSettings === false && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <AlertCircle className="mr-1 h-3 w-3" />
                {language === 'tr' ? 'Yapilandirma gerekli' : 'Setup required'}
              </Badge>
            )}
            {hasSettings && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSyncInvoices('incoming')}
                  disabled={!!syncing}
                >
                  {syncing === 'incoming' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {tr.syncIncoming}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSyncInvoices('outgoing')}
                  disabled={!!syncing}
                >
                  {syncing === 'outgoing' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                  )}
                  {tr.syncOutgoing}
                </Button>
              </>
            )}
          </div>
        </div>

        {(linkedInvoiceCount > 0 || linkedOrderCount > 0) && (
          <div className="flex flex-wrap gap-3">
            {linkedInvoiceCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-blue-800">
                  {linkedInvoiceCount} {language === 'tr' ? 'odenmis fatura e-belge olarak gonderilebilir' : 'paid invoices ready for e-document'}
                </span>
              </div>
            )}
            {linkedOrderCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-lg text-sm">
                <ShoppingCart className="h-3.5 w-3.5 text-teal-600" />
                <span className="text-teal-800">
                  {linkedOrderCount} {language === 'tr' ? 'tamamlanan siparis' : 'completed orders'}
                </span>
              </div>
            )}
          </div>
        )}

        {hasSettings && <EdocumentStats tenantId={tenantId} language={language} />}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              {tr.allDocuments}
            </TabsTrigger>
            <TabsTrigger value="send" className="gap-2" disabled={!hasSettings}>
              <Send className="h-4 w-4" />
              {tr.sendInvoice}
            </TabsTrigger>
            <TabsTrigger value="taxpayer" className="gap-2">
              <Search className="h-4 w-4" />
              {tr.checkTaxpayer}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings2 className="h-4 w-4" />
              {tr.settings}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="mt-4">
            {hasSettings === false ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 rounded-2xl bg-amber-50 mb-4">
                    <AlertCircle className="h-8 w-8 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {language === 'tr' ? 'Entegrasyon Yapilandirilmamis' : 'Integration Not Configured'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mb-4">{tr.notConfigured}</p>
                  <Button onClick={() => setActiveTab('settings')} className="bg-[#0D1B2A] hover:bg-[#132d46]">
                    <Settings2 className="mr-2 h-4 w-4" />
                    {tr.settings}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <EdocumentList
                tenantId={tenantId}
                language={language}
                translations={tr}
                onViewDocument={handleViewDocument}
              />
            )}
          </TabsContent>

          <TabsContent value="send" className="mt-4">
            {hasSettings ? (
              <SendEInvoicePanel tenantId={tenantId} language={language} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm text-muted-foreground mb-4">{tr.notConfigured}</p>
                  <Button variant="outline" onClick={() => setActiveTab('settings')}>
                    <Settings2 className="mr-2 h-4 w-4" />
                    {tr.settings}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="taxpayer" className="mt-4">
            {hasSettings === false ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm text-muted-foreground mb-4">{tr.notConfigured}</p>
                  <Button variant="outline" onClick={() => setActiveTab('settings')}>
                    <Settings2 className="mr-2 h-4 w-4" />
                    {tr.settings}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <TaxpayerCheck tenantId={tenantId} language={language} translations={tr} />
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <EdocumentSettings tenantId={tenantId} language={language} translations={tr} onSaved={checkSettings} />
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedDoc && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedDoc.direction === 'incoming' ? (
                    <ArrowDownLeft className="h-5 w-5 text-blue-600" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5 text-teal-600" />
                  )}
                  {docTypeLabel(selectedDoc.document_type)} - {selectedDoc.invoice_number || selectedDoc.ettn?.slice(0, 8) || 'N/A'}
                </SheetTitle>
                <SheetDescription>
                  {language === 'tr' ? 'E-belge detaylari' : 'E-document details'}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <DetailField label={tr.documentType} value={docTypeLabel(selectedDoc.document_type)} />
                  <DetailField label={tr.direction} value={selectedDoc.direction === 'incoming' ? tr.incoming : tr.outgoing} />
                  <DetailField label="Status" value={statusLabel(selectedDoc.status)} />
                  <DetailField label={tr.invoiceType} value={selectedDoc.invoice_type || '-'} />
                  <DetailField label={tr.issueDate} value={selectedDoc.issue_date ? new Date(selectedDoc.issue_date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US') : '-'} />
                  <DetailField label={tr.invoiceNumber} value={selectedDoc.invoice_number || '-'} />
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h4 className="text-sm font-semibold">{language === 'tr' ? 'Taraflar' : 'Parties'}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{tr.senderTitle}</p>
                      <p className="text-sm font-medium">{selectedDoc.sender_title || '-'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedDoc.sender_vkn || ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{tr.receiverTitle}</p>
                      <p className="text-sm font-medium">{selectedDoc.receiver_title || '-'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedDoc.receiver_vkn || ''}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <h4 className="text-sm font-semibold">{language === 'tr' ? 'Tutarlar' : 'Amounts'}</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{language === 'tr' ? 'Ara Toplam' : 'Subtotal'}</span>
                      <span>{formatAmount(selectedDoc.subtotal || 0, selectedDoc.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{language === 'tr' ? 'KDV' : 'Tax'}</span>
                      <span>{formatAmount(selectedDoc.tax_total || 0, selectedDoc.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t pt-2">
                      <span>{tr.grandTotal}</span>
                      <span>{formatAmount(selectedDoc.grand_total, selectedDoc.currency)}</span>
                    </div>
                  </div>
                </div>

                {selectedDoc.ettn && (
                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground">{tr.ettn}</p>
                    <p className="text-xs font-mono bg-gray-100 p-2 rounded mt-1 break-all">{selectedDoc.ettn}</p>
                  </div>
                )}

                {selectedDoc.error_message && (
                  <div className="border-t pt-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-red-700">{language === 'tr' ? 'Hata' : 'Error'}</p>
                      <p className="text-xs text-red-600 mt-1">{selectedDoc.error_message}</p>
                    </div>
                  </div>
                )}

                {selectedDoc.notes && (
                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground">{language === 'tr' ? 'Notlar' : 'Notes'}</p>
                    <p className="text-sm mt-1">{selectedDoc.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

function formatAmount(amount: number, currency: string) {
  const symbols: Record<string, string> = { TRY: '\u20BA', USD: '$', EUR: '\u20AC', GBP: '\u00A3' }
  return `${symbols[currency] || ''}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
}
