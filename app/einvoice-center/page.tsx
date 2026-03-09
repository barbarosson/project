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
  AlertOctagon,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Activity,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Ban,
  Eye,
  Settings2,
  Search
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/tenant-context';
import { useLanguage } from '@/contexts/language-context';
import { toast } from 'sonner';
import { EdocumentSettings } from '@/components/edocuments/edocument-settings';
import { TaxpayerCheck } from '@/components/edocuments/taxpayer-check';
import { SendEInvoicePanel } from '@/components/edocuments/send-einvoice-panel';

interface EInvoiceDetail {
  id: string;
  invoice_id: string;
  gib_uuid: string;
  ettn: string;
  invoice_type: string;
  status: string;
  sent_at: string;
  response_message: string;
  gib_error_detail: string;
  ai_validation_score: number;
  tax_anomaly_detected: boolean;
  invoices: {
    invoice_no: string;
    invoice_date: string;
    grand_total: number;
    customers: {
      name: string;
      company_title?: string;
    };
  };
}

type EdocSetup = { efatura_enabled: boolean; earsiv_enabled: boolean } | null;

export default function EInvoiceCenterPage() {
  const { tenantId } = useTenant();
  const { language, t } = useLanguage();
  const tr = t.edocuments;
  const [invoices, setInvoices] = useState<EInvoiceDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<EInvoiceDetail | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [edocSetup, setEdocSetup] = useState<EdocSetup>(null);

  useEffect(() => {
    if (tenantId) {
      loadInvoices();
    }
  }, [tenantId, activeTab]);

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
    try {
      setLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/einvoice-processor`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'get_pending',
            tenant_id: tenantId
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load invoices');
      }

      const result = await response.json();
      setInvoices(result.invoices || []);
    } catch (error: any) {
      console.error('Error loading invoices:', error);
      toast.error('Faturalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const validateInvoice = async (invoiceId: string) => {
    try {
      setProcessing(invoiceId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/einvoice-processor`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'validate_invoice',
            invoice_id: invoiceId
          })
        }
      );

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      const result = await response.json();

      if (result.is_compliant) {
        toast.success('Fatura doğrulandı! GİB\'e gönderilebilir.');
      } else {
        toast.warning(`${result.issues.length} sorun tespit edildi`, {
          description: 'Detaylar için faturayı inceleyin'
        });
      }

      await loadInvoices();
    } catch (error: any) {
      console.error('Error validating invoice:', error);
      toast.error('Doğrulama sırasında hata oluştu');
    } finally {
      setProcessing(null);
    }
  };

  const sendToGIB = async (invoiceId: string) => {
    try {
      setProcessing(invoiceId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/einvoice-processor`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'send_to_gib',
            invoice_id: invoiceId
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send');
      }

      const result = await response.json();
      toast.success('Fatura GİB\'e gönderildi ve onaylandı!', {
        description: `UUID: ${result.gib_uuid}`
      });

      await loadInvoices();
    } catch (error: any) {
      console.error('Error sending to GİB:', error);
      toast.error('GİB\'e gönderme sırasında hata oluştu', {
        description: error.message
      });
    } finally {
      setProcessing(null);
    }
  };

  const cancelInvoice = async (invoiceId: string) => {
    try {
      setProcessing(invoiceId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/einvoice-processor`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'cancel_invoice',
            invoice_id: invoiceId,
            reason: 'Manuel iptal'
          })
        }
      );

      if (!response.ok) {
        throw new Error('Cancellation failed');
      }

      toast.info('Fatura iptal edildi');
      await loadInvoices();
    } catch (error: any) {
      console.error('Error cancelling invoice:', error);
      toast.error('İptal işlemi sırasında hata oluştu');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'draft': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'validated': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'sending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'rejected': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <ShieldCheck className="text-green-400" size={18} />;
      case 'draft': return <FileText className="text-slate-400" size={18} />;
      case 'validated': return <CheckCircle className="text-cyan-400" size={18} />;
      case 'sending': return <Send className="text-yellow-400" size={18} />;
      case 'error': return <AlertOctagon className="text-red-400" size={18} />;
      case 'rejected': return <XCircle className="text-orange-400" size={18} />;
      case 'cancelled': return <Ban className="text-gray-400" size={18} />;
      default: return <Clock className="text-slate-400" size={18} />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: 'Taslak',
      validated: 'Doğrulandı',
      sending: 'Gönderiliyor',
      approved: 'GİB Onaylı',
      rejected: 'Reddedildi',
      error: 'Hata',
      cancelled: 'İptal'
    };
    return statusMap[status] || status;
  };

  const stats = {
    total: invoices.length,
    approved: invoices.filter(i => i.status === 'approved').length,
    pending: invoices.filter(i => ['draft', 'validated', 'sending'].includes(i.status)).length,
    errors: invoices.filter(i => ['error', 'rejected'].includes(i.status)).length,
  };

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

          <Tabs defaultValue="invoices" className="space-y-6">
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
                <SendEInvoicePanel tenantId={tenantId} language={language} />
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

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border border-gray-200 bg-card shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">{language === 'tr' ? 'Toplam Fatura' : 'Total Invoices'}</CardTitle>
                    <FileText className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <p className="text-xs text-gray-500">{language === 'tr' ? 'Sistem kaydı' : 'System records'}</p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 bg-card shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">{language === 'tr' ? 'GİB Onaylı' : 'GIB Approved'}</CardTitle>
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
                    <p className="text-xs text-gray-500">{language === 'tr' ? 'Resmi faturalar' : 'Official invoices'}</p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 bg-card shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">{language === 'tr' ? 'Bekleyen' : 'Pending'}</CardTitle>
                    <Clock className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-700">{stats.pending}</div>
                    <p className="text-xs text-gray-500">{language === 'tr' ? 'İşlem gerekiyor' : 'Action required'}</p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 bg-card shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">{language === 'tr' ? 'Hata/Red' : 'Error/Rejected'}</CardTitle>
                    <AlertOctagon className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-700">{stats.errors}</div>
                    <p className="text-xs text-gray-500">{language === 'tr' ? 'Dikkat gerekiyor' : 'Attention needed'}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Invoice List */}
              <Card className="border border-gray-200 bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Activity className="text-[#00D4AA]" />
                    {language === 'tr' ? 'Fatura Listesi' : 'Invoice List'}
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    {invoices.length} {language === 'tr' ? 'fatura • Durum bazlı görünüm' : 'invoices • Status view'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin h-8 w-8 text-[#7DD3FC]" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                <p className="text-slate-400">Henüz e-fatura kaydı yok</p>
                <p className="text-sm text-slate-500 mt-2">
                  Yeni fatura oluşturmak için Faturalar modülünü kullanın
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className={`rounded-xl border-2 p-6 transition-all hover:shadow-lg ${getStatusColor(invoice.status)}`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-slate-800/50`}>
                          {getStatusIcon(invoice.status)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-bold">{invoice.invoices?.invoice_no}</p>
                            <Badge variant="outline" className="text-[10px]">
                              {invoice.invoice_type === 'e-invoice' ? 'e-Fatura' : 'e-Arşiv'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400">
                            {invoice.invoices?.customers?.company_title || invoice.invoices?.customers?.name}
                          </p>
                          {invoice.gib_uuid && (
                            <p className="text-[10px] text-slate-500 uppercase tracking-tighter mt-1">
                              UUID: {invoice.gib_uuid.substring(0, 8)}...
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge className={`uppercase text-xs px-2 py-1 ${getStatusColor(invoice.status)}`}>
                          {getStatusText(invoice.status)}
                        </Badge>
                        <p className="text-white font-bold text-lg mt-1">
                          ₺{invoice.invoices?.grand_total?.toLocaleString('tr-TR') || 0}
                        </p>
                      </div>
                    </div>

                    {/* AI Validation */}
                    {invoice.ai_validation_score !== null && (
                      <div className="mb-4 p-3 bg-slate-800/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400">AI Uyumluluk Skoru</span>
                          <span className={`text-xs font-bold ${
                            invoice.ai_validation_score >= 0.85 ? 'text-green-400' : 'text-orange-400'
                          }`}>
                            %{(invoice.ai_validation_score * 100).toFixed(0)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              invoice.ai_validation_score >= 0.85 ? 'bg-green-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${invoice.ai_validation_score * 100}%` }}
                          />
                        </div>
                        {invoice.tax_anomaly_detected && (
                          <div className="flex items-center gap-2 mt-2">
                            <AlertTriangle size={14} className="text-yellow-400" />
                            <span className="text-xs text-yellow-400">Vergi anomalisi tespit edildi</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error Message */}
                    {invoice.gib_error_detail && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-xs text-red-400 flex items-center gap-2">
                          <AlertOctagon size={14} />
                          {invoice.gib_error_detail}
                        </p>
                      </div>
                    )}

                    {/* Success Message */}
                    {invoice.response_message && invoice.status === 'approved' && (
                      <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-xs text-green-400 flex items-center gap-2">
                          <CheckCircle size={14} />
                          {invoice.response_message}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      {invoice.status === 'draft' && (
                        <Button
                          onClick={() => validateInvoice(invoice.invoice_id)}
                          disabled={processing === invoice.invoice_id}
                          size="sm"
                          className="bg-[#7DD3FC] hover:bg-cyan-400 text-slate-900"
                        >
                          {processing === invoice.invoice_id ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Doğrulanıyor...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={14} />
                              Doğrula
                            </>
                          )}
                        </Button>
                      )}

                      {invoice.status === 'validated' && (
                        <Button
                          onClick={() => sendToGIB(invoice.invoice_id)}
                          disabled={processing === invoice.invoice_id}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          {processing === invoice.invoice_id ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Gönderiliyor...
                            </>
                          ) : (
                            <>
                              <Send size={14} />
                              GİB'e Gönder
                            </>
                          )}
                        </Button>
                      )}

                      {invoice.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500/30 text-green-400"
                          disabled
                        >
                          <ShieldCheck size={14} />
                          Onaylandı
                        </Button>
                      )}

                      {['draft', 'validated', 'error'].includes(invoice.status) && (
                        <Button
                          onClick={() => cancelInvoice(invoice.invoice_id)}
                          disabled={processing === invoice.invoice_id}
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          <Ban size={14} />
                          İptal
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-400"
                      >
                        <Eye size={14} />
                        Detay
                      </Button>
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
