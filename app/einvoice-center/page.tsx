'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ShieldCheck,
  Send,
  FileText,
  Loader2,
  RefreshCw,
  Eye,
  Settings2,
  Search,
  FilterX,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/tenant-context';
import { useLanguage } from '@/contexts/language-context';
import { toast } from 'sonner';
import { getInvoiceXml, getInvoiceHtml, getIncomingInvoices, getOutgoingInvoices } from '@/lib/nes-api';
import { getEdocStatusLabel } from '@/lib/edocument-status';
import { importIncomingEdocumentToPurchase } from '@/lib/import-incoming-edocument';
import { useRouter } from 'next/navigation';
import { EdocumentSettings } from '@/components/edocuments/edocument-settings';
import { TaxpayerCheck } from '@/components/edocuments/taxpayer-check';
import { SendEInvoicePanel } from '@/components/edocuments/send-einvoice-panel';

type EdocSetup = { efatura_enabled: boolean; earsiv_enabled: boolean } | null;

type EdocRow = {
  id: string;
  invoice_number: string | null;
  ettn: string | null;
  status: string;
  receiver_title: string | null;
  sender_title: string | null;
  receiver_vkn: string | null;
  sender_vkn: string | null;
  grand_total: number;
  issue_date: string;
  document_type: string;
  created_at: string;
  local_purchase_invoice_id?: string | null;
};

const GIB_STATUS_FILTER_OPTIONS: { value: string; i18nKey: string }[] = [
  { value: 'all', i18nKey: 'filterStatusAll' },
  { value: 'sent', i18nKey: 'sent' },
  { value: 'delivered', i18nKey: 'delivered' },
  { value: 'envelopeiswaitingtobesendedtoreceiverbygib', i18nKey: 'statusWaitingToBeSentByGib' },
  { value: 'envelopeissenttoreceiverbygib', i18nKey: 'statusSentToReceiverByGib' },
  { value: 'envelopeisreceivedbyreceiver', i18nKey: 'statusReceivedByReceiver' },
  { value: 'envelopeisreceivedbygib', i18nKey: 'statusReceivedByGib' },
  { value: 'accepted', i18nKey: 'accepted' },
  { value: 'rejected', i18nKey: 'rejected' },
  { value: 'cancelled', i18nKey: 'cancelled' },
  { value: 'envelopeisrejected', i18nKey: 'rejected' },
  { value: 'envelopeiscancelled', i18nKey: 'cancelled' },
];

export default function EInvoiceCenterPage() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const invoiceIdFromUrl = searchParams.get('invoice_id');
  const { tenantId } = useTenant();
  const { language, t } = useLanguage();
  const tr = t.edocuments;
  const [listSubTab, setListSubTab] = useState<'incoming' | 'outgoing'>('outgoing');
  const [incomingDocs, setIncomingDocs] = useState<EdocRow[]>([]);
  const [outgoingDocs, setOutgoingDocs] = useState<EdocRow[]>([]);
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
  const [filterVkn, setFilterVkn] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');
  const [appliedTitle, setAppliedTitle] = useState('');
  const [appliedAmount, setAppliedAmount] = useState('');
  const [appliedNumber, setAppliedNumber] = useState('');
  const [appliedVkn, setAppliedVkn] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('all');
  const [syncing, setSyncing] = useState<'incoming' | 'outgoing' | null>(null);
  const [importingEdocId, setImportingEdocId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (tenantId && mainTabValue === 'invoices') {
      loadInvoices();
    }
  }, [tenantId, activeTab, mainTabValue, listSubTab, appliedDateFrom, appliedDateTo, appliedTitle, appliedAmount, appliedNumber, appliedVkn, appliedStatus]);

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
      const direction = listSubTab;
      let query = supabase
        .from('edocuments')
        .select('id, invoice_number, ettn, status, receiver_title, sender_title, receiver_vkn, sender_vkn, grand_total, issue_date, document_type, created_at, local_purchase_invoice_id')
        .eq('tenant_id', tenantId)
        .eq('direction', direction);

      if (direction === 'outgoing') {
        query = query.neq('status', 'draft');
      }

      if (appliedDateFrom) query = query.gte('issue_date', appliedDateFrom);
      if (appliedDateTo) query = query.lte('issue_date', appliedDateTo);
      const titleTrim = appliedTitle.trim();
      if (titleTrim) {
        if (direction === 'outgoing') query = query.ilike('receiver_title', `%${titleTrim}%`);
        else query = query.ilike('sender_title', `%${titleTrim}%`);
      }
      const numberTrim = appliedNumber.trim();
      if (numberTrim) query = query.ilike('invoice_number', `%${numberTrim}%`);
      const amountNum = appliedAmount.trim() !== '' ? Number(appliedAmount) : NaN;
      if (!Number.isNaN(amountNum)) query = query.gte('grand_total', amountNum);

      if (direction === 'outgoing') {
        const vknTrim = appliedVkn.trim();
        if (vknTrim) query = query.ilike('receiver_vkn', `%${vknTrim}%`);
        if (appliedStatus && appliedStatus !== 'all') query = query.eq('status', appliedStatus);
      }

      const result = await query.order('created_at', { ascending: false }).limit(200);

      if (result.error) throw result.error;
      const rows = (result.data ?? []) as EdocRow[];
      if (direction === 'incoming') setIncomingDocs(rows);
      else setOutgoingDocs(rows);
    } catch (e: any) {
      console.error('Edocuments load error:', e);
      toast.error(tr.loadError);
      if (listSubTab === 'incoming') setIncomingDocs([]);
      else setOutgoingDocs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncInvoices = async (direction: 'incoming' | 'outgoing') => {
    if (!tenantId) return;
    setSyncing(direction);
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const beginDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = now.toISOString().split('T')[0];
      const raw =
        direction === 'incoming'
          ? await getIncomingInvoices(tenantId, beginDate, endDate)
          : await getOutgoingInvoices(tenantId, beginDate, endDate);
      type InvoicesResponse = { Result?: { InvoiceList?: unknown[] }; InvoiceList?: unknown[] };
      type InvoiceListItem = {
        Ettn?: string;
        UUID?: string;
        Id?: string;
        InvoiceNumber?: string;
        InvoiceId?: string;
        Status?: string;
        SenderVkn?: string;
        SenderIdentifier?: string;
        SenderTitle?: string;
        SenderName?: string;
        ReceiverVkn?: string;
        ReceiverIdentifier?: string;
        ReceiverTitle?: string;
        ReceiverName?: string;
        IssueDate?: string;
        InvoiceDate?: string;
        InvoiceType?: string;
        Currency?: string;
        SubTotal?: string | number;
        TaxExclusiveAmount?: string | number;
        TaxTotal?: string | number;
        TaxAmount?: string | number;
        GrandTotal?: string | number;
        PayableAmount?: string | number;
        TaxInclusiveAmount?: string | number;
      };
      const res = raw as InvoicesResponse | undefined;
      const fromResult = res?.Result?.InvoiceList;
      const fromList = res?.InvoiceList;
      const invoiceList: InvoiceListItem[] =
        Array.isArray(fromResult)
          ? (fromResult as InvoiceListItem[])
          : Array.isArray(fromList)
            ? (fromList as InvoiceListItem[])
            : [];
      let imported = 0;
      for (const inv of invoiceList) {
        const ettn = inv.Ettn ?? inv.UUID ?? inv.Id;
        if (!ettn) continue;
        const { data: existing } = await supabase
          .from('edocuments')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('ettn', ettn)
          .maybeSingle();
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
            subtotal: Number(inv.SubTotal ?? inv.TaxExclusiveAmount ?? 0),
            tax_total: Number(inv.TaxTotal ?? inv.TaxAmount ?? 0),
            grand_total: Number(inv.GrandTotal ?? inv.PayableAmount ?? inv.TaxInclusiveAmount ?? 0),
            nes_response: inv,
          });
          imported++;
        }
      }
      toast.success(
        language === 'tr'
          ? `${invoiceList.length} fatura bulundu, ${imported} yeni eklendi`
          : `${invoiceList.length} found, ${imported} new imported`
      );
      loadInvoices();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg || tr.loadError);
    } finally {
      setSyncing(null);
    }
  };

  const handleImportToPurchase = async (doc: EdocRow) => {
    if (!tenantId || !doc.id) return;
    setImportingEdocId(doc.id);
    try {
      const result = await importIncomingEdocumentToPurchase(tenantId, doc.id);
      if (result.success) {
        toast.success(language === 'tr' ? 'Alış faturası oluşturuldu.' : 'Purchase invoice created.');
        loadInvoices();
      } else if (result.alreadyImported && 'purchaseInvoiceId' in result) {
        toast.info(language === 'tr' ? 'Zaten aktarılmış.' : 'Already imported.');
        loadInvoices();
      } else {
        toast.error(result.error);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
    } finally {
      setImportingEdocId(null);
    }
  };

  const getContentString = (raw: unknown): string => {
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw === 'object' && 'content' in raw && typeof (raw as { content: unknown }).content === 'string') {
      return (raw as { content: string }).content;
    }
    return '';
  };

  const handleViewXml = async (ettn: string | null, direction: 'incoming' | 'outgoing' = 'outgoing') => {
    if (!tenantId || !ettn) {
      toast.error(tr.ettNotFound);
      return;
    }
    setViewingDocId(ettn);
    try {
      const raw = await getInvoiceXml(tenantId, ettn, direction);
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

  const handleViewHtml = async (ettn: string | null, direction: 'incoming' | 'outgoing' = 'outgoing') => {
    if (!tenantId || !ettn) {
      toast.error(tr.ettNotFound);
      return;
    }
    setViewingDocId(ettn);
    try {
      const raw = await getInvoiceHtml(tenantId, ettn, direction);
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
              <Tabs value={listSubTab} onValueChange={(v) => setListSubTab(v as 'incoming' | 'outgoing')} className="space-y-4">
                <TabsList className="h-9 p-0.5 bg-gray-100 border border-gray-200">
                  <TabsTrigger value="incoming" className="h-8 px-4 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <ArrowDownLeft className="h-4 w-4 mr-2" />
                    {tr.incomingInvoices}
                  </TabsTrigger>
                  <TabsTrigger value="outgoing" className="h-8 px-4 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    {tr.outgoingInvoices}
                  </TabsTrigger>
                </TabsList>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!syncing}
                    onClick={() => handleSyncInvoices('incoming')}
                    className="font-medium"
                  >
                    {syncing === 'incoming' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    {tr.syncIncomingButton}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!syncing}
                    onClick={() => handleSyncInvoices('outgoing')}
                    className="font-medium"
                  >
                    {syncing === 'outgoing' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    {tr.syncOutgoingButton}
                  </Button>
                </div>

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
                          placeholder={listSubTab === 'outgoing' ? (language === 'tr' ? 'Alıcı ünvan' : 'Receiver') : (language === 'tr' ? 'Gönderen ünvan' : 'Sender')}
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
                      {listSubTab === 'outgoing' && (
                        <>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">{tr.filterVknTckn}</label>
                            <Input
                              placeholder="VKN / TCKN"
                              value={filterVkn}
                              onChange={(e) => setFilterVkn(e.target.value)}
                              className="h-9 w-[130px]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">{tr.filterStatus}</label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                              <SelectTrigger className="h-9 w-[180px]">
                                <SelectValue placeholder={tr.filterStatusAll} />
                              </SelectTrigger>
                              <SelectContent>
                                {GIB_STATUS_FILTER_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {(tr as Record<string, string>)[opt.i18nKey] ?? opt.i18nKey}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          setAppliedDateFrom(filterDateFrom);
                          setAppliedDateTo(filterDateTo);
                          setAppliedTitle(filterTitle);
                          setAppliedAmount(filterAmount);
                          setAppliedNumber(filterNumber);
                          setAppliedVkn(listSubTab === 'outgoing' ? filterVkn : '');
                          setAppliedStatus(listSubTab === 'outgoing' ? filterStatus : '');
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
                          setFilterVkn('');
                          setFilterStatus('all');
                          setAppliedDateFrom('');
                          setAppliedDateTo('');
                          setAppliedTitle('');
                          setAppliedAmount('');
                          setAppliedNumber('');
                          setAppliedVkn('');
                          setAppliedStatus('all');
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

                <TabsContent value="incoming" className="mt-0">
                  <Card className="border border-gray-200 bg-card shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900">
                        <ArrowDownLeft className="text-[#00D4AA]" />
                        {tr.incomingInvoices}
                      </CardTitle>
                      <CardDescription className="text-gray-500">
                        {tr.incomingInvoicesDesc}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading && listSubTab === 'incoming' ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="animate-spin h-8 w-8 text-[#00D4AA]" />
                        </div>
                      ) : incomingDocs.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-gray-500">{tr.noIncomingInvoices}</p>
                          <p className="text-sm text-gray-400 mt-2">{tr.noIncomingInvoicesDesc}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {incomingDocs.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4"
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900">{doc.invoice_number || doc.id.slice(0, 8)}</p>
                                <p className="text-sm text-gray-500 truncate">{doc.sender_title || '—'}</p>
                                {doc.sender_vkn && <p className="text-xs text-gray-400 mt-1">VKN: {doc.sender_vkn}</p>}
                                {doc.ettn && <p className="text-xs text-gray-400 truncate">ETTN: {doc.ettn}</p>}
                              </div>
                              <div className="flex items-center gap-3 flex-wrap">
                                {doc.local_purchase_invoice_id ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => router.push('/expenses')}
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                    {tr.goToPurchaseInvoice}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="text-xs bg-[#0A2540] hover:bg-[#1e3a5f]"
                                    disabled={!!importingEdocId}
                                    onClick={() => handleImportToPurchase(doc)}
                                  >
                                    {importingEdocId === doc.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                                    ) : (
                                      <Download className="h-3.5 w-3.5 mr-1" />
                                    )}
                                    {tr.importToPurchaseButton}
                                  </Button>
                                )}
                                <Badge variant="outline">{doc.document_type === 'earsiv' ? tr.earsiv : tr.efatura}</Badge>
                                <span className="text-sm font-semibold text-gray-900">₺{(doc.grand_total ?? 0).toLocaleString('tr-TR')}</span>
                                <span className="text-xs text-gray-500">{getEdocStatusLabel(doc.status, tr as Record<string, string>)}</span>
                                {doc.ettn && (
                                  <>
                                    <Button variant="outline" size="sm" className="text-xs" disabled={viewingDocId === doc.ettn} onClick={() => handleViewXml(doc.ettn, 'incoming')}>
                                      {viewingDocId === doc.ettn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 mr-1" />}
                                      XML
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-xs" disabled={viewingDocId === doc.ettn} onClick={() => handleViewHtml(doc.ettn, 'incoming')}>
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

                <TabsContent value="outgoing" className="mt-0">
                  <Card className="border border-gray-200 bg-card shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900">
                        <Send className="text-[#00D4AA]" />
                        {tr.sentEInvoices}
                      </CardTitle>
                      <CardDescription className="text-gray-500">
                        {tr.outgoingInvoicesDesc}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading && listSubTab === 'outgoing' ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="animate-spin h-8 w-8 text-[#00D4AA]" />
                        </div>
                      ) : outgoingDocs.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-gray-500">{tr.noSentInvoices}</p>
                          <p className="text-sm text-gray-400 mt-2">{tr.noSentInvoicesDesc}</p>
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
                                {doc.receiver_vkn && <p className="text-xs text-gray-400 mt-1">VKN: {doc.receiver_vkn}</p>}
                                {doc.ettn && <p className="text-xs text-gray-400 mt-1 truncate">ETTN: {doc.ettn}</p>}
                              </div>
                              <div className="flex items-center gap-3 flex-wrap">
                                <Badge variant="outline">{doc.document_type === 'earsiv' ? tr.earsiv : tr.efatura}</Badge>
                                <span className="text-sm font-semibold text-gray-900">₺{(doc.grand_total ?? 0).toLocaleString('tr-TR')}</span>
                                <span className="text-xs text-gray-500">{getEdocStatusLabel(doc.status, tr as Record<string, string>)}</span>
                                {doc.ettn && (
                                  <>
                                    <Button variant="outline" size="sm" className="text-xs" disabled={viewingDocId === doc.ettn} onClick={() => handleViewXml(doc.ettn, 'outgoing')}>
                                      {viewingDocId === doc.ettn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 mr-1" />}
                                      XML
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-xs" disabled={viewingDocId === doc.ettn} onClick={() => handleViewHtml(doc.ettn, 'outgoing')}>
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}
