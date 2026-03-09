'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShieldCheck,
  Send,
  FileText,
  Loader2,
  RefreshCw,
  Eye,
  Settings2,
  Search
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/tenant-context';
import { useLanguage } from '@/contexts/language-context';
import { toast } from 'sonner';
import { getInvoiceXml, getInvoiceHtml } from '@/lib/nes-api';
import { EdocumentSettings } from '@/components/edocuments/edocument-settings';
import { TaxpayerCheck } from '@/components/edocuments/taxpayer-check';
import { SendEInvoicePanel } from '@/components/edocuments/send-einvoice-panel';

type EdocSetup = { efatura_enabled: boolean; earsiv_enabled: boolean } | null;

export default function EInvoiceCenterPage() {
  const { tenantId } = useTenant();
  const { language, t } = useLanguage();
  const tr = t.edocuments;
  const [outgoingDocs, setOutgoingDocs] = useState<Array<{ id: string; invoice_number: string | null; ettn: string | null; status: string; receiver_title: string | null; grand_total: number; issue_date: string; document_type: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [edocSetup, setEdocSetup] = useState<EdocSetup>(null);
  const [mainTabValue, setMainTabValue] = useState('invoices');

  useEffect(() => {
    if (tenantId && mainTabValue === 'invoices') {
      loadInvoices();
    }
  }, [tenantId, activeTab, mainTabValue]);

  const loadEdocSetup = useCallback(() => {
    if (!tenantId) return;
    supabase
      .from('edocument_settings')
      .select('efatura_enabled, earsiv_enabled')
      .eq('tenant_id', tenantId)
      .maybeSingle()
      .then(({ data }) => {
        setEdocSetup(data ? { efatura_enabled: !!data.efatura_enabled, earsiv_enabled: !!data.earsiv_enabled } : null);
      });
  }, [tenantId]);

  useEffect(() => {
    loadEdocSetup();
  }, [loadEdocSetup]);

  const loadInvoices = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const result = await supabase
        .from('edocuments')
        .select('id, invoice_number, ettn, status, receiver_title, grand_total, issue_date, document_type, created_at')
        .eq('tenant_id', tenantId)
        .eq('direction', 'outgoing')
        .order('created_at', { ascending: false })
        .limit(100);

      if (result.error) throw result.error;
      setOutgoingDocs(result.data ?? []);
    } catch (e: any) {
      console.error('Edocuments load error:', e);
      toast.error('Faturalar yüklenirken hata oluştu');
      setOutgoingDocs([]);
    } finally {
      setLoading(false);
    }
  };

  const getContentString = (raw: unknown): string => {
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw === 'object' && 'content' in raw && typeof (raw as { content: unknown }).content === 'string') {
      return (raw as { content: string }).content;
    }
    return '';
  };

  const handleViewXml = async (ettn: string | null) => {
    if (!tenantId || !ettn) {
      toast.error(language === 'tr' ? 'ETTN bulunamadı' : 'ETTN not found');
      return;
    }
    setViewingDocId(ettn);
    try {
      const raw = await getInvoiceXml(tenantId, ettn, 'outgoing');
      const xml = getContentString(raw);
      if (!xml.trim()) throw new Error(language === 'tr' ? 'XML içeriği boş' : 'Empty XML response');
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(`<pre style="padding:1rem;font-size:12px;white-space:pre-wrap;word-break:break-all;">${escapeHtml(xml)}</pre>`);
        w.document.close();
      }
    } catch (e: any) {
      toast.error(e?.message || (language === 'tr' ? 'XML alınamadı' : 'Failed to load XML'));
    } finally {
      setViewingDocId(null);
    }
  };

  const handleViewHtml = async (ettn: string | null) => {
    if (!tenantId || !ettn) {
      toast.error(language === 'tr' ? 'ETTN bulunamadı' : 'ETTN not found');
      return;
    }
    setViewingDocId(ettn);
    try {
      const raw = await getInvoiceHtml(tenantId, ettn, 'outgoing');
      const html = getContentString(raw);
      if (!html.trim()) throw new Error(language === 'tr' ? 'Görüntü içeriği boş' : 'Empty view response');
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
      }
    } catch (e: any) {
      toast.error(e?.message || (language === 'tr' ? 'Görüntü alınamadı' : 'Failed to load view'));
    } finally {
      setViewingDocId(null);
    }
  };

  function escapeHtml(s: string) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0A2540]/5 overflow-x-hidden">
        <div className="p-3 lg:p-5 text-[#0A2540] min-w-0 overflow-x-hidden text-[15px] space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ShieldCheck className="text-[#00D4AA]" size={32} />
                {language === 'tr' ? 'e-Fatura & e-Arşiv Merkezi' : 'E-Invoice & E-Archive Center'}
              </h1>
              <p className="text-gray-500 mt-1">
                {language === 'tr' ? 'GİB uyumlu elektronik fatura yönetimi' : 'GIB-compliant electronic invoice management'}
              </p>
            </div>
          </div>

          <Tabs value={mainTabValue} onValueChange={setMainTabValue} className="space-y-6">
            <TabsList className="h-8 p-0.5 bg-[#0A2540]/10 border border-[#0A2540]/20">
              <TabsTrigger value="setup" className="h-7 px-2.5 py-0 text-xs data-[state=active]:bg-[#00D4AA] data-[state=active]:text-[#0A2540] font-medium text-contrast-body">
                <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                {language === 'tr' ? 'Kurulum' : 'Setup'}
              </TabsTrigger>
              <TabsTrigger value="invoices" className="h-7 px-2.5 py-0 text-xs data-[state=active]:bg-[#00D4AA] data-[state=active]:text-[#0A2540] font-medium text-contrast-body">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                {language === 'tr' ? 'Fatura Listesi' : 'Invoice List'}
              </TabsTrigger>
              {(edocSetup === null || edocSetup.efatura_enabled) && (
                <TabsTrigger value="taxpayer" className="h-7 px-2.5 py-0 text-xs data-[state=active]:bg-[#00D4AA] data-[state=active]:text-[#0A2540] font-medium text-contrast-body">
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                  {tr.checkTaxpayer}
                </TabsTrigger>
              )}
              <TabsTrigger value="send" className="h-7 px-2.5 py-0 text-xs data-[state=active]:bg-[#00D4AA] data-[state=active]:text-[#0A2540] font-medium text-contrast-body">
                <Send className="h-3.5 w-3.5 mr-1.5" />
                {tr.sendInvoice}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="mt-0">
              {tenantId && (
                <EdocumentSettings
                  tenantId={tenantId}
                  language={language}
                  translations={tr}
                  onSaved={loadEdocSetup}
                />
              )}
            </TabsContent>

            {(edocSetup === null || edocSetup.efatura_enabled) && (
              <TabsContent value="taxpayer" className="mt-0">
                {tenantId && (
                  <TaxpayerCheck tenantId={tenantId} language={language} translations={tr} />
                )}
              </TabsContent>
            )}

            <TabsContent value="send" className="mt-0">
              {tenantId && (
                <SendEInvoicePanel
                  tenantId={tenantId}
                  language={language}
                  onSwitchToSetup={() => setMainTabValue('setup')}
                  onSent={loadInvoices}
                />
              )}
            </TabsContent>

            <TabsContent value="invoices" className="mt-0 space-y-6">
              <div className="flex justify-end">
                <Button
                  onClick={loadInvoices}
                  variant="outline"
                  disabled={loading}
                  className="font-semibold text-contrast-body border-gray-300 bg-white hover:bg-gray-50"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin mr-2' : 'mr-2'} />
                  {language === 'tr' ? 'Yenile' : 'Refresh'}
                </Button>
              </div>

              <Card className="border border-gray-200 bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Send className="text-[#00D4AA]" />
                    {language === 'tr' ? 'Gönderilen e-Faturalar' : 'Sent e-Invoices'}
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    {language === 'tr' ? 'NES üzerinden gönderilen e-fatura ve e-arşiv faturalar' : 'E-invoices and e-archive sent via NES'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="animate-spin h-8 w-8 text-[#00D4AA]" />
                    </div>
                  ) : outgoingDocs.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">{language === 'tr' ? 'Henüz gönderilen fatura yok' : 'No sent invoices yet'}</p>
                      <p className="text-sm text-gray-400 mt-2">
                        {language === 'tr' ? '"Fatura Gönder" sekmesinden fatura gönderebilirsiniz' : 'You can send invoices from the "Send Invoice" tab'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {outgoingDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">{doc.invoice_number || doc.id.slice(0, 8)}</p>
                            <p className="text-sm text-gray-500 truncate">{doc.receiver_title || '—'}</p>
                            {doc.ettn && (
                              <p className="text-xs text-gray-400 mt-1 truncate">ETTN: {doc.ettn}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge variant="outline">
                              {doc.document_type === 'earsiv' ? (language === 'tr' ? 'e-Arşiv' : 'E-Archive') : (language === 'tr' ? 'e-Fatura' : 'E-Invoice')}
                            </Badge>
                            <span className="text-sm font-semibold text-gray-900">₺{(doc.grand_total ?? 0).toLocaleString('tr-TR')}</span>
                            <span className="text-xs text-gray-500">{doc.status}</span>
                            {doc.ettn && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  disabled={viewingDocId === doc.ettn}
                                  onClick={() => handleViewXml(doc.ettn)}
                                >
                                  {viewingDocId === doc.ettn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 mr-1" />}
                                  XML
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  disabled={viewingDocId === doc.ettn}
                                  onClick={() => handleViewHtml(doc.ettn)}
                                >
                                  {viewingDocId === doc.ettn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                                  {language === 'tr' ? 'Görüntüle (PDF)' : 'View (PDF)'}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}
