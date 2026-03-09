'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  ShieldCheck,
  Send,
  FileText,
  Loader2,
  RefreshCw,
  Eye,
  Settings2,
  Search,
  FilterX
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
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const invoiceIdFromUrl = searchParams.get('invoice_id');
  const { tenantId } = useTenant();
  const { language, t } = useLanguage();
  const tr = t.edocuments;
  const [outgoingDocs, setOutgoingDocs] = useState<Array<{ id: string; invoice_number: string | null; ettn: string | null; status: string; receiver_title: string | null; grand_total: number; issue_date: string; document_type: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [edocSetup, setEdocSetup] = useState<EdocSetup>(null);
  const [mainTabValue, setMainTabValue] = useState(tabFromUrl === 'send' ? 'send' : 'invoices');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterTitle, setFilterTitle] = useState('');
  const [filterAmount, setFilterAmount] = useState('');
  const [filterNumber, setFilterNumber] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');
  const [appliedTitle, setAppliedTitle] = useState('');
  const [appliedAmount, setAppliedAmount] = useState('');
  const [appliedNumber, setAppliedNumber] = useState('');

  useEffect(() => {
    if (tenantId && mainTabValue === 'invoices') {
      loadInvoices();
    }
  }, [tenantId, activeTab, mainTabValue, appliedDateFrom, appliedDateTo, appliedTitle, appliedAmount, appliedNumber]);

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
      let query = supabase
        .from('edocuments')
        .select('id, invoice_number, ettn, status, receiver_title, grand_total, issue_date, document_type, created_at')
        .eq('tenant_id', tenantId)
        .eq('direction', 'outgoing')
        .neq('status', 'draft');

      if (appliedDateFrom) query = query.gte('issue_date', appliedDateFrom);
      if (appliedDateTo) query = query.lte('issue_date', appliedDateTo);
      const titleTrim = appliedTitle.trim();
      if (titleTrim) query = query.ilike('receiver_title', `%${titleTrim}%`);
      const numberTrim = appliedNumber.trim();
      if (numberTrim) query = query.ilike('invoice_number', `%${numberTrim}%`);
      const amountNum = appliedAmount.trim() !== '' ? Number(appliedAmount) : NaN;
      if (!Number.isNaN(amountNum)) query = query.gte('grand_total', amountNum);

      const result = await query.order('created_at', { ascending: false }).limit(200);

      if (result.error) throw result.error;
      setOutgoingDocs(result.data ?? []);
    } catch (e: any) {
      console.error('Edocuments load error:', e);
      toast.error(tr.loadError);
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
      toast.error(tr.ettNotFound);
      return;
    }
    setViewingDocId(ettn);
    try {
      const raw = await getInvoiceXml(tenantId, ettn, 'outgoing');
      const xml = getContentString(raw);
      if (!xml.trim()) throw new Error(tr.xmlEmpty);
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(`<pre style="padding:1rem;font-size:12px;white-space:pre-wrap;word-break:break-all;">${escapeHtml(xml)}</pre>`);
        w.document.close();
      }
    } catch (e: any) {
      toast.error(e?.message || tr.xmlFailed);
    } finally {
      setViewingDocId(null);
    }
  };

  const handleViewHtml = async (ettn: string | null) => {
    if (!tenantId || !ettn) {
      toast.error(tr.ettNotFound);
      return;
    }
    setViewingDocId(ettn);
    try {
      const raw = await getInvoiceHtml(tenantId, ettn, 'outgoing');
      const html = getContentString(raw);
      if (!html.trim()) throw new Error(tr.viewEmpty);
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
      }
    } catch (e: any) {
      toast.error(e?.message || tr.viewFailed);
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
                {tr.centerTitle}
              </h1>
              <p className="text-gray-500 mt-1">
                {tr.centerSubtitle}
              </p>
            </div>
          </div>

          <Tabs value={mainTabValue} onValueChange={setMainTabValue} className="space-y-6">
            <TabsList className="h-8 p-0.5 bg-[#0A2540]/10 border border-[#0A2540]/20">
              <TabsTrigger value="setup" className="h-7 px-2.5 py-0 text-xs data-[state=active]:bg-[#00D4AA] data-[state=active]:text-[#0A2540] font-medium text-contrast-body">
                <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                {tr.setup}
              </TabsTrigger>
              <TabsTrigger value="invoices" className="h-7 px-2.5 py-0 text-xs data-[state=active]:bg-[#00D4AA] data-[state=active]:text-[#0A2540] font-medium text-contrast-body">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                {tr.invoiceList}
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
                  translations={tr}
                  initialSelectedInvoiceId={invoiceIdFromUrl ?? undefined}
                  onSwitchToSetup={() => setMainTabValue('setup')}
                  onSent={loadInvoices}
                />
              )}
            </TabsContent>

            <TabsContent value="invoices" className="mt-0 space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-end gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">{tr.filterDateFrom}</label>
                      <Input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        className="h-9 w-[140px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">{tr.filterDateTo}</label>
                      <Input
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        className="h-9 w-[140px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">{tr.filterNumber}</label>
                      <Input
                        placeholder={tr.filterNumber}
                        value={filterNumber}
                        onChange={(e) => setFilterNumber(e.target.value)}
                        className="h-9 w-[140px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">{tr.filterTitle}</label>
                      <Input
                        placeholder={tr.filterTitle}
                        value={filterTitle}
                        onChange={(e) => setFilterTitle(e.target.value)}
                        className="h-9 w-[160px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">{tr.filterAmount}</label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0"
                        value={filterAmount}
                        onChange={(e) => setFilterAmount(e.target.value)}
                        className="h-9 w-[120px]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        setAppliedDateFrom(filterDateFrom);
                        setAppliedDateTo(filterDateTo);
                        setAppliedTitle(filterTitle);
                        setAppliedAmount(filterAmount);
                        setAppliedNumber(filterNumber);
                      }}
                      disabled={loading}
                      className="bg-[#0A2540] hover:bg-[#1e3a5f]"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                      {tr.searchFilters}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilterDateFrom('');
                        setFilterDateTo('');
                        setFilterTitle('');
                        setFilterAmount('');
                        setFilterNumber('');
                        setAppliedDateFrom('');
                        setAppliedDateTo('');
                        setAppliedTitle('');
                        setAppliedAmount('');
                        setAppliedNumber('');
                      }}
                      className="font-semibold text-contrast-body border-gray-300 bg-white hover:bg-gray-50"
                    >
                      <FilterX className="h-4 w-4 mr-2" />
                      {tr.clearFilters}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={loadInvoices}
                      disabled={loading}
                      className="font-semibold text-contrast-body border-gray-300 bg-white hover:bg-gray-50"
                    >
                      <RefreshCw size={16} className={loading ? 'animate-spin mr-2' : 'mr-2'} />
                      {tr.refresh}
                    </Button>
                  </div>
                </div>
              </div>

              <Card className="border border-gray-200 bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Send className="text-[#00D4AA]" />
                    {tr.sentEInvoices}
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    {tr.sentEInvoicesDesc}
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
                      <p className="text-gray-500">{tr.noSentInvoices}</p>
                      <p className="text-sm text-gray-400 mt-2">
                        {tr.noSentInvoicesDesc}
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
                              {doc.document_type === 'earsiv' ? tr.earsiv : tr.efatura}
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
                                  {tr.viewPdf}
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
