'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/dashboard-layout';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Activity,
  Search,
  RefreshCw,
  Target,
  Zap,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function CRMDashboard() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [atRiskCustomers, setAtRiskCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // Load customers
      const { data: customersData } = await supabase
        .from('v_customer_360')
        .select('*')
        .order('clv', { ascending: false })
        .limit(50);

      setCustomers(customersData || []);

      // Load metrics
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/crm-ai-agent`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'get_dashboard_metrics' })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }

      // Load at-risk customers
      const riskResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/crm-ai-agent`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'get_at_risk_customers',
            risk_level: 'high',
            limit: 5
          })
        }
      );

      if (riskResponse.ok) {
        const data = await riskResponse.json();
        setAtRiskCustomers(data.customers || []);
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Dashboard yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const analyzeCustomer = async (customerId: string) => {
    try {
      toast.info('Müşteri analiz ediliyor...');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/crm-ai-agent`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'analyze_customer',
            customer_id: customerId,
            force_refresh: true
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success('Analiz tamamlandı!');
        loadDashboard(); // Refresh data
        return data.insight;
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing customer:', error);
      toast.error('Analiz sırasında hata oluştu');
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'VIP':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'Regular':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'Risky':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'New':
        return 'bg-green-500/20 text-green-400 border-green-500/40';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-500 bg-red-500/10';
      case 'high':
        return 'text-orange-500 bg-orange-500/10';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10';
      default:
        return 'text-green-500 bg-green-500/10';
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchQuery ||
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSegment = segmentFilter === 'all' || customer.segment === segmentFilter;

    return matchesSearch && matchesSegment;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0A0F1E] p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Customer Intelligence Center
              </h1>
              <p className="text-slate-400 text-sm">
                AI destekli müşteri ilişkileri yönetimi ve tahmin sistemi
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={loadDashboard}
                variant="outline"
                size="sm"
                className="border-[#7DD3FC]/30 text-[#7DD3FC]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Yenile
              </Button>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Users className="w-6 h-6 text-cyan-400" />
                  <span className="text-xs font-bold text-green-400">↑ +12%</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 mb-2">Toplam Müşteri</p>
                <p className="text-3xl font-bold text-white">
                  {metrics?.summary?.total_customers || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <DollarSign className="w-6 h-6 text-green-400" />
                  <span className="text-xs font-bold text-green-400">↑ +8%</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 mb-2">Ortalama CLV</p>
                <p className="text-3xl font-bold text-white">
                  ₺{((metrics?.summary?.avg_clv || 0) / 1000).toFixed(0)}K
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Activity className="w-6 h-6 text-blue-400" />
                  <span className="text-xs font-bold text-green-400">↑ +5%</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 mb-2">Ortalama Sağlık</p>
                <p className="text-3xl font-bold text-white">
                  {((metrics?.summary?.avg_health_score || 0) * 100).toFixed(0)}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
                  <span className="text-xs font-bold text-red-400">↓ -3%</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 mb-2">Kritik Risk</p>
                <p className="text-3xl font-bold text-white">
                  {metrics?.summary?.critical_churn_count || 0}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* At Risk Alert */}
        {atRiskCustomers.length > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/40">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                <CardTitle className="text-white">
                  🚨 {atRiskCustomers.length} Müşteri Yüksek Risk Altında
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {atRiskCustomers.map((customer: any) => (
                  <Badge
                    key={customer.id}
                    variant="outline"
                    className="bg-red-500/20 border-red-500/30 text-red-300 cursor-pointer hover:bg-red-500/30"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    {customer.name} (%{((customer.churn_probability || 0) * 100).toFixed(0)})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Müşteri ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Segment Filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Segmentler</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="Regular">Regular</SelectItem>
              <SelectItem value="Risky">Risky</SelectItem>
              <SelectItem value="New">New</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              className="bg-[#0A192F] border-[#7DD3FC]/30 hover:shadow-[0_0_30px_rgba(125,211,252,0.25)] transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedCustomer(customer)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white text-lg mb-2">
                      {customer.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={`${getSegmentColor(customer.segment)}`}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      {customer.segment}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase mb-1">CLV (12M)</p>
                    <p className="text-xl font-bold text-[#7DD3FC]">
                      ₺{((customer.clv || 0) / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-3 h-3 text-[#7DD3FC]" />
                      <span className="text-xs text-slate-400">Sağlık</span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {((customer.health_score || 0) * 100).toFixed(0)}%
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-slate-400">Ödeme</span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {((customer.payment_score || 0) * 100).toFixed(0)}%
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-3 h-3 text-orange-400" />
                      <span className="text-xs text-slate-400">Risk</span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {((customer.churn_probability || 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Sipariş</p>
                    <p className="text-sm font-bold text-white">{customer.total_orders || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Ciro</p>
                    <p className="text-sm font-bold text-[#7DD3FC]">
                      ₺{((customer.total_revenue || 0) / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Son Sp.</p>
                    <p className="text-sm font-bold text-white">
                      {customer.days_since_last_order || 0}g
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Ödeme</p>
                    <p className="text-sm font-bold text-white">
                      %{(customer.on_time_payment_rate || 0).toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {customer.recommended_actions && customer.recommended_actions.length > 0 && (
                  <div className="bg-cyan-500/10 rounded-lg p-3 border border-cyan-500/20 mb-3">
                    <div className="flex items-start gap-2">
                      <Target className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-white mb-1">
                          {customer.recommended_actions[0].reason}
                        </p>
                        <p className="text-xs text-slate-400">
                          {customer.recommended_actions[0].description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    analyzeCustomer(customer.id);
                  }}
                  className="w-full bg-transparent border-2 border-[#7DD3FC] text-[#7DD3FC] hover:bg-[#7DD3FC] hover:text-[#0A192F]"
                  size="sm"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  AI ANALİZ
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <Card className="bg-[#0A192F] border-[#7DD3FC]/30">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">Müşteri bulunamadı</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
