'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Layers, Percent, Settings2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { PlanEditor } from '@/components/admin/pricing/plan-editor';
import { FeatureManager } from '@/components/admin/pricing/feature-manager';
import { InstallmentManager } from '@/components/admin/pricing/installment-manager';
import { DiscountManager } from '@/components/admin/pricing/discount-manager';

export interface SubscriptionPlan {
  id: string;
  name: string;
  plan_code: string;
  plan_tier: string;
  price_tl: number;
  monthly_price: number;
  annual_price_tl: number | null;
  price_usd: number | null;
  annual_price_usd: number | null;
  discount_annual: number;
  description: string;
  features: string[];
  is_active: boolean;
  recommended: boolean;
  highlight: boolean;
  sort_order: number;
  trial_days: number;
  max_installments: number;
  currency: string;
  setup_fee: number;
  badge_text: string | null;
  badge_color: string | null;
  iyzico_plan_ref: string | null;
  iyzico_product_ref: string | null;
  iyzico_monthly_plan_ref: string | null;
  iyzico_annual_plan_ref: string | null;
  billing_periods: string[];
  created_at: string;
  updated_at: string;
}

export interface PlanFeature {
  id: string;
  feature_key: string;
  name_tr: string;
  name_en: string;
  description_tr: string;
  description_en: string;
  category: string;
  display_order: number;
  is_limit: boolean;
  created_at: string;
}

export interface FeatureAssignment {
  id: string;
  plan_id: string;
  feature_id: string;
  enabled: boolean;
  limit_value: string | null;
}

export default function PricingAdminPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [assignments, setAssignments] = useState<FeatureAssignment[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');

  const fetchData = useCallback(async () => {
    try {
      const [plansRes, featuresRes, assignmentsRes] = await Promise.all([
        supabase.from('subscription_plans').select('*').order('sort_order'),
        supabase.from('plan_features').select('*').order('display_order'),
        supabase.from('plan_feature_assignments').select('*'),
      ]);

      if (plansRes.data) setPlans(plansRes.data);
      if (featuresRes.data) setFeatures(featuresRes.data);
      if (assignmentsRes.data) setAssignments(assignmentsRes.data);
    } catch (err) {
      toast.error('Veri yuklenirken hata olustu');
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abonelik ve Fiyatlandirma Yonetimi</h1>
        <p className="text-muted-foreground mt-1">
          Paketleri, ozellikleri, taksit seceneklerini ve indirimleri yonetin.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Paketler</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Ozellikler</span>
          </TabsTrigger>
          <TabsTrigger value="installments" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Taksit</span>
          </TabsTrigger>
          <TabsTrigger value="discounts" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            <span className="hidden sm:inline">Indirimler</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <PlanEditor plans={plans} onRefresh={fetchData} />
        </TabsContent>

        <TabsContent value="features">
          <FeatureManager
            plans={plans}
            features={features}
            assignments={assignments}
            onRefresh={fetchData}
          />
        </TabsContent>

        <TabsContent value="installments">
          <InstallmentManager plans={plans} onRefresh={fetchData} />
        </TabsContent>

        <TabsContent value="discounts">
          <DiscountManager plans={plans} onRefresh={fetchData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
