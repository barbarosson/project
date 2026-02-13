"use client";

import React, { useState, useEffect } from 'react';
import { Check, Minus, Infinity, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface DbPlan {
  id: string;
  name: string;
  plan_tier: string;
  price_tl: number;
  price_usd: number;
  monthly_price: number;
  sort_order: number;
  is_active: boolean;
  highlight: boolean;
}

interface DbFeature {
  id: string;
  feature_key: string;
  name_tr: string;
  name_en: string;
  category: string;
  display_order: number;
  is_limit: boolean;
}

interface DbAssignment {
  plan_id: string;
  feature_id: string;
  enabled: boolean;
  limit_value: string | null;
}

const PLAN_COLORS: Record<string, string> = {
  FREE: '#64748B',
  KUCUK: '#0EA5E9',
  ORTA: '#00D1A0',
  BUYUK: '#F59E0B',
  ENTERPRISE: '#0A2540',
};

const PLAN_LABELS: Record<string, { tr: string; en: string }> = {
  FREE: { tr: 'Baslangic', en: 'Free' },
  KUCUK: { tr: 'Kucuk', en: 'Small' },
  ORTA: { tr: 'Orta', en: 'Medium' },
  BUYUK: { tr: 'Buyuk', en: 'Large' },
  ENTERPRISE: { tr: 'Kurumsal', en: 'Enterprise' },
};

const CATEGORY_ORDER = [
  'Temel Moduller',
  'Limitler',
  'Ileri Ozellikler',
  'AI ve Otomasyon',
  'Entegrasyonlar',
  'Destek',
  'Ek Ozellikler',
];

const CATEGORY_LABELS: Record<string, { tr: string; en: string }> = {
  'Temel Moduller': { tr: 'Temel Ozellikler', en: 'Core Features' },
  'Limitler': { tr: 'Limitler', en: 'Limits' },
  'Ileri Ozellikler': { tr: 'Ileri Ozellikler', en: 'Advanced Features' },
  'AI ve Otomasyon': { tr: 'AI & Otomasyon', en: 'AI & Automation' },
  'Entegrasyonlar': { tr: 'Entegrasyonlar', en: 'Integrations' },
  'Destek': { tr: 'Destek & Hizmet', en: 'Support & Services' },
  'Ek Ozellikler': { tr: 'Ek Ozellikler', en: 'Additional Features' },
};

function CellValue({ enabled, limitValue, isTr }: { enabled: boolean; limitValue: string | null; isTr: boolean }) {
  if (!enabled) {
    return (
      <div className="flex items-center justify-center">
        <Minus className="w-4 h-4 text-gray-300 dark:text-gray-600" />
      </div>
    );
  }

  if (limitValue) {
    const lower = limitValue.toLowerCase();
    if (lower === 'sinirsiz' || lower === 'unlimited') {
      return (
        <div className="flex items-center justify-center gap-1">
          <Infinity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{limitValue}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      </div>
    </div>
  );
}

interface PlanFeatureMatrixProps {
  highlightPlan?: string;
}

export function PlanFeatureMatrix({ highlightPlan }: PlanFeatureMatrixProps) {
  const { language } = useLanguage();
  const isTr = language === 'tr';
  const [plans, setPlans] = useState<DbPlan[]>([]);
  const [features, setFeatures] = useState<DbFeature[]>([]);
  const [assignments, setAssignments] = useState<DbAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [plansRes, featRes, assignRes] = await Promise.all([
          supabase
            .from('subscription_plans')
            .select('id, name, plan_tier, price_tl, price_usd, monthly_price, sort_order, is_active, highlight')
            .eq('is_active', true)
            .order('sort_order'),
          supabase
            .from('plan_features')
            .select('id, feature_key, name_tr, name_en, category, display_order, is_limit')
            .order('display_order'),
          supabase
            .from('plan_feature_assignments')
            .select('plan_id, feature_id, enabled, limit_value'),
        ]);

        if (plansRes.data) setPlans(plansRes.data);
        if (featRes.data) setFeatures(featRes.data);
        if (assignRes.data) setAssignments(assignRes.data);
      } catch (err) {
        console.error('Failed to load feature matrix:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (features.length === 0 || plans.length === 0) return null;

  const assignmentMap = new Map<string, DbAssignment>();
  assignments.forEach((a) => {
    assignmentMap.set(`${a.plan_id}:${a.feature_id}`, a);
  });

  const grouped = new Map<string, DbFeature[]>();
  features.forEach((f) => {
    const cat = f.category || 'Ek Ozellikler';
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(f);
  });

  const sortedCategories = CATEGORY_ORDER.filter((c) => grouped.has(c));
  grouped.forEach((_, key) => {
    if (!sortedCategories.includes(key)) sortedCategories.push(key);
  });

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isTr ? 'Tum Ozellikleri Karsilastir' : 'Compare All Features'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
          {isTr
            ? 'Her paketin sunduklari detayli olarak asagida listelenmistir'
            : 'Detailed breakdown of what each plan offers'}
        </p>
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <DesktopView
          plans={plans}
          categories={sortedCategories}
          grouped={grouped}
          assignmentMap={assignmentMap}
          isTr={isTr}
          highlightPlan={highlightPlan}
        />
      </div>

      <div className="lg:hidden">
        <MobileView
          plans={plans}
          categories={sortedCategories}
          grouped={grouped}
          assignmentMap={assignmentMap}
          isTr={isTr}
          highlightPlan={highlightPlan}
        />
      </div>
    </div>
  );
}

interface ViewProps {
  plans: DbPlan[];
  categories: string[];
  grouped: Map<string, DbFeature[]>;
  assignmentMap: Map<string, DbAssignment>;
  isTr: boolean;
  highlightPlan?: string;
}

function DesktopView({ plans, categories, grouped, assignmentMap, isTr, highlightPlan }: ViewProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50">
            <th className="text-left py-5 px-6 w-[280px] border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {isTr ? 'Ozellikler' : 'Features'}
              </span>
            </th>
            {plans.map((plan) => {
              const isHl = highlightPlan === plan.name;
              const isPopular = plan.name === 'ORTA';
              const labels = PLAN_LABELS[plan.name] || { tr: plan.name, en: plan.name };
              const color = PLAN_COLORS[plan.name] || '#64748B';

              return (
                <th
                  key={plan.id}
                  className={cn(
                    'text-center py-5 px-3 border-b border-gray-200 dark:border-gray-700 min-w-[130px]',
                    (isHl || (isPopular && !highlightPlan)) && 'bg-emerald-50/50 dark:bg-emerald-900/10'
                  )}
                >
                  {isPopular && (
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white px-2.5 py-0.5 rounded-full mb-1.5">
                      {isTr ? 'Populer' : 'Popular'}
                    </span>
                  )}
                  <div className="font-bold text-gray-900 dark:text-white text-base">
                    {isTr ? labels.tr : labels.en}
                  </div>
                  <div className="mt-1">
                    <span className="text-lg font-bold" style={{ color }}>
                      {plan.price_tl === 0 ? (isTr ? 'Ucretsiz' : 'Free') : `${plan.monthly_price || plan.price_tl} TL`}
                    </span>
                    {plan.price_tl > 0 && (
                      <span className="text-xs text-gray-400">/{isTr ? 'ay' : 'mo'}</span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {categories.map((catKey) => {
            const catFeatures = grouped.get(catKey) || [];
            const catLabel = CATEGORY_LABELS[catKey] || { tr: catKey, en: catKey };

            return (
              <React.Fragment key={catKey}>
                <tr className="bg-gray-50/70 dark:bg-gray-800/30">
                  <td colSpan={plans.length + 1} className="py-3 px-6 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      {isTr ? catLabel.tr : catLabel.en}
                    </span>
                  </td>
                </tr>
                {catFeatures.map((feat) => (
                  <tr
                    key={feat.id}
                    className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
                  >
                    <td className="py-3.5 px-6 text-sm text-gray-700 dark:text-gray-300">
                      {isTr ? feat.name_tr : feat.name_en}
                    </td>
                    {plans.map((plan) => {
                      const a = assignmentMap.get(`${plan.id}:${feat.id}`);
                      const isHl = highlightPlan === plan.name;
                      const isPopular = plan.name === 'ORTA';

                      return (
                        <td
                          key={plan.id}
                          className={cn(
                            'py-3.5 px-3 text-center',
                            (isHl || (isPopular && !highlightPlan)) && 'bg-emerald-50/30 dark:bg-emerald-900/5'
                          )}
                        >
                          <CellValue
                            enabled={a?.enabled ?? false}
                            limitValue={a?.limit_value ?? null}
                            isTr={isTr}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MobileView({ plans, categories, grouped, assignmentMap, isTr, highlightPlan }: ViewProps) {
  return (
    <div className="space-y-6">
      {plans.map((plan) => {
        const isHl = highlightPlan === plan.name;
        const isPopular = plan.name === 'ORTA';
        const labels = PLAN_LABELS[plan.name] || { tr: plan.name, en: plan.name };
        const color = PLAN_COLORS[plan.name] || '#64748B';

        return (
          <div
            key={plan.id}
            className={cn(
              'border rounded-2xl overflow-hidden',
              isHl
                ? 'border-emerald-400 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20'
                : isPopular
                  ? 'border-emerald-300 shadow-md'
                  : 'border-gray-200 dark:border-gray-700'
            )}
          >
            <div className="px-5 py-4 text-white" style={{ backgroundColor: color }}>
              <div className="flex items-center justify-between">
                <div>
                  {isPopular && (
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur px-2 py-0.5 rounded-full mb-1">
                      {isTr ? 'Populer' : 'Popular'}
                    </span>
                  )}
                  <h3 className="text-xl font-bold">{isTr ? labels.tr : labels.en}</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold">
                    {plan.price_tl === 0 ? (isTr ? 'Ucretsiz' : 'Free') : `${plan.monthly_price || plan.price_tl} TL`}
                  </span>
                  {plan.price_tl > 0 && (
                    <span className="text-sm opacity-80">/{isTr ? 'ay' : 'mo'}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {categories.map((catKey) => {
                const catFeatures = grouped.get(catKey) || [];
                const catLabel = CATEGORY_LABELS[catKey] || { tr: catKey, en: catKey };
                const activeFeatures = catFeatures.filter((f) => {
                  const a = assignmentMap.get(`${plan.id}:${f.id}`);
                  return a?.enabled;
                });
                if (activeFeatures.length === 0) return null;

                return (
                  <div key={catKey} className="px-5 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {isTr ? catLabel.tr : catLabel.en}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {activeFeatures.map((feat) => {
                        const a = assignmentMap.get(`${plan.id}:${feat.id}`);
                        return (
                          <div key={feat.id} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {isTr ? feat.name_tr : feat.name_en}
                            </span>
                            <CellValue
                              enabled={a?.enabled ?? false}
                              limitValue={a?.limit_value ?? null}
                              isTr={isTr}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
