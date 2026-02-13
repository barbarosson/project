'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  Package,
  Activity,
  Target,
  BarChart3,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/use-tenant';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/language-context';

interface ProductionSuggestion {
  id: string;
  product_id: string;
  product_name?: string;
  suggested_quantity: number;
  priority_score: number;
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
  confidence_score: number;
  estimated_revenue: number;
  estimated_cost: number;
  estimated_profit: number;
  profit_margin_percentage: number;
  roi_percentage: number;
  cash_impact_status: 'safe' | 'moderate' | 'risky' | 'critical';
  cash_required: number;
  current_stock_level: number;
  pending_orders_quantity: number;
  forecasted_demand: number;
  recommended_start_date: string;
  status: string;
  created_at: string;
  products?: {
    name: string;
    sku: string;
    image_url?: string;
  };
}

export default function AIProductionAdvisorPage() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [suggestions, setSuggestions] = useState<ProductionSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ProductionSuggestion | null>(null);
  const [activeTab, setActiveTab] = useState('suggestions');

  useEffect(() => {
    if (tenantId) {
      loadSuggestions();
    }
  }, [tenantId]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_production_suggestions')
        .select(`
          *,
          products (
            name,
            sku,
            image_url
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'pending')
        .order('priority_score', { ascending: false })
        .limit(20);

      if (error) throw error;

      setSuggestions(data.map(item => ({
        ...item,
        product_name: item.products?.name || 'Unknown Product'
      })));
    } catch (error: any) {
      console.error('Error loading suggestions:', error);
      toast.error('Öneriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    try {
      setGenerating(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-production-advisor`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            action: 'generate_suggestions'
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const result = await response.json();
      toast.success(`${result.count} yeni öneri oluşturuldu!`);
      await loadSuggestions();
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      toast.error('Öneriler oluşturulurken hata oluştu');
    } finally {
      setGenerating(false);
    }
  };

  const approveSuggestion = async (suggestion: ProductionSuggestion) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-production-advisor`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            action: 'approve_suggestion',
            suggestion_id: suggestion.id,
            user_id: user?.id
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to approve suggestion');
      }

      const result = await response.json();
      toast.success(result.message);
      await loadSuggestions();
    } catch (error: any) {
      console.error('Error approving suggestion:', error);
      toast.error('Öneri onaylanırken hata oluştu');
    }
  };

  const rejectSuggestion = async (suggestion: ProductionSuggestion) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-production-advisor`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            action: 'reject_suggestion',
            suggestion_id: suggestion.id,
            user_id: user?.id,
            reason: 'Manual rejection'
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reject suggestion');
      }

      const result = await response.json();
      toast.info(result.message);
      await loadSuggestions();
    } catch (error: any) {
      console.error('Error rejecting suggestion:', error);
      toast.error('Öneri reddedilirken hata oluştu');
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  const getCashImpactColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'risky': return 'text-orange-400';
      default: return 'text-red-400';
    }
  };

  const stats = {
    totalSuggestions: suggestions.length,
    avgPriority: suggestions.length > 0
      ? (suggestions.reduce((sum, s) => sum + s.priority_score, 0) / suggestions.length * 100).toFixed(0)
      : '0',
    totalProfitPotential: suggestions.reduce((sum, s) => sum + (s.estimated_profit || 0), 0),
    avgConfidence: suggestions.length > 0
      ? (suggestions.reduce((sum, s) => sum + s.confidence_score, 0) / suggestions.length * 100).toFixed(0)
      : '0'
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                <Sparkles className="text-cyan-500" size={40} />
                AI Üretim Stratejisti
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Yapay zeka destekli üretim karar destek sistemi
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={loadSuggestions}
                variant="outline"
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Yenile
              </Button>
              <Button
                onClick={generateSuggestions}
                disabled={generating}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                {generating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Yeni Öneriler Oluştur
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Öneriler</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSuggestions}</div>
              <p className="text-xs text-muted-foreground">Bekleyen karar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potansiyel Kâr</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₺{stats.totalProfitPotential.toLocaleString('tr-TR')}
              </div>
              <p className="text-xs text-muted-foreground">Toplam tahmin</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Öncelik</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgPriority}%</div>
              <p className="text-xs text-muted-foreground">Skor ortalaması</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Güveni</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgConfidence}%</div>
              <p className="text-xs text-muted-foreground">Model güven skoru</p>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="text-cyan-500" />
              AI Üretim Önerileri
            </CardTitle>
            <CardDescription>
              {suggestions.length} öneri • Öncelik sırasına göre
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin h-8 w-8 text-cyan-500" />
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  Şu an için üretim önerisi yok
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                  Yeni öneriler oluşturmak için yukarıdaki butona tıklayın
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    className={`rounded-xl border-2 p-6 transition-all hover:shadow-lg ${getUrgencyColor(suggestion.urgency_level)}`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {suggestion.product_name}
                          </h3>
                          <Badge variant="outline" className="uppercase text-xs">
                            {suggestion.urgency_level === 'critical' ? 'KRİTİK' :
                             suggestion.urgency_level === 'high' ? 'YÜKSEK' :
                             suggestion.urgency_level === 'medium' ? 'ORTA' : 'DÜŞÜK'}
                          </Badge>
                        </div>

                        {/* Priority Score */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < suggestion.priority_score * 5 ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-cyan-600 dark:text-cyan-400 text-sm font-semibold">
                            {(suggestion.priority_score * 100).toFixed(0)}% Öncelik
                          </span>
                        </div>

                        {/* Reasoning */}
                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                          {suggestion.reasoning}
                        </p>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Üretim Miktarı</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          {suggestion.suggested_quantity} adet
                        </p>
                      </div>

                      <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Tahmini Kâr</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          ₺{suggestion.estimated_profit?.toLocaleString('tr-TR') || 0}
                        </p>
                      </div>

                      <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">ROI</p>
                        <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
                          %{suggestion.roi_percentage?.toFixed(1) || 0}
                        </p>
                      </div>

                      <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Nakit Etkisi</p>
                        <p className={`text-lg font-bold ${getCashImpactColor(suggestion.cash_impact_status)}`}>
                          {suggestion.cash_impact_status === 'safe' ? 'Güvenli' :
                           suggestion.cash_impact_status === 'moderate' ? 'Orta' :
                           suggestion.cash_impact_status === 'risky' ? 'Riskli' : 'Kritik'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => approveSuggestion(suggestion)}
                        className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                      >
                        <CheckCircle size={16} />
                        Onayla & Üret
                      </Button>

                      <Button
                        onClick={() => rejectSuggestion(suggestion)}
                        variant="outline"
                        className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                      >
                        <XCircle size={16} />
                        Reddet
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
