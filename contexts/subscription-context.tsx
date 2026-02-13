"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/access-control';

export type PlanName = 'FREE' | 'KUCUK' | 'ORTA' | 'BUYUK' | 'ENTERPRISE';

export type FeatureCode =
  | 'customers'
  | 'products'
  | 'invoices'
  | 'expenses'
  | 'finance'
  | 'proposals'
  | 'campaigns'
  | 'bulk_operations'
  | 'stock_movements'
  | 'multi_currency'
  | 'ai_chat'
  | 'finance_robot'
  | 'executive_assistant'
  | 'marketplace'
  | 'orders'
  | 'projects'
  | 'production'
  | 'warehouses'
  | 'branches'
  | 'accounting_ai'
  | 'trend_agent'
  | 'einvoice'
  | 'api_access'
  | 'support_email'
  | 'support_live'
  | 'support_24_7'
  | 'dedicated_manager';

export interface SubscriptionPlan {
  id: string;
  name: PlanName;
  price_tl: number;
  monthly_price: number;
  description: string;
  features: string[];
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_name: PlanName;
  status: 'active' | 'cancelled' | 'expired';
  started_at: string;
  expires_at: string | null;
  payment_method: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditBalance {
  id: string;
  user_id: string;
  ocr_credits: number;
  e_fatura_credits: number;
  updated_at: string;
}

interface SubscriptionContextType {
  currentPlan: SubscriptionPlan | null;
  userSubscription: UserSubscription | null;
  creditBalance: CreditBalance | null;
  allPlans: SubscriptionPlan[];
  loading: boolean;
  hasFeature: (featureCode: FeatureCode) => boolean;
  canAccessRoute: (route: string) => boolean;
  refreshSubscription: () => Promise<void>;
  deductCredit: (type: 'ocr' | 'e_fatura') => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const FEATURE_TO_ROUTE_MAP: Record<string, FeatureCode[]> = {
  '/customers': ['customers'],
  '/products': ['products'],
  '/inventory': ['products'],
  '/invoices': ['invoices'],
  '/expenses': ['expenses'],
  '/finance': ['finance'],
  '/support': ['support_email'],
  '/proposals': ['proposals'],
  '/campaigns': ['campaigns'],
  '/ai-insights': ['ai_chat'],
  '/finance-robot': ['finance_robot'],
  '/executive-assistant': ['executive_assistant'],
  '/marketplace': ['marketplace'],
  '/orders': ['orders'],
  '/projects': ['projects'],
  '/production': ['production'],
  '/warehouses': ['warehouses'],
  '/branches': ['branches'],
  '/accounting-ai': ['accounting_ai'],
  '/trend-agent': ['trend_agent'],
  '/edocuments': ['einvoice'],
};

const PLAN_FEATURES: Record<PlanName, FeatureCode[]> = {
  FREE: [
    'customers', 'products', 'invoices', 'support_email', 'einvoice',
  ],
  KUCUK: [
    'customers', 'products', 'invoices', 'expenses', 'finance',
    'stock_movements', 'orders', 'projects', 'production', 'warehouses', 'branches', 'support_email',
  ],
  ORTA: [
    'customers', 'products', 'invoices', 'expenses', 'finance',
    'proposals', 'campaigns', 'bulk_operations', 'stock_movements',
    'multi_currency', 'orders', 'projects', 'production', 'warehouses', 'branches', 'accounting_ai', 'support_email', 'support_live',
  ],
  BUYUK: [
    'customers', 'products', 'invoices', 'expenses', 'finance',
    'proposals', 'campaigns', 'bulk_operations', 'stock_movements',
    'multi_currency', 'orders', 'projects', 'production', 'warehouses', 'branches', 'accounting_ai', 'ai_chat', 'finance_robot', 'executive_assistant', 'marketplace', 'trend_agent', 'einvoice',
    'support_email', 'support_live',
  ],
  ENTERPRISE: [
    'customers', 'products', 'invoices', 'expenses', 'finance',
    'proposals', 'campaigns', 'bulk_operations', 'stock_movements',
    'multi_currency', 'orders', 'projects', 'production', 'warehouses', 'branches', 'accounting_ai', 'ai_chat', 'finance_robot', 'executive_assistant', 'marketplace', 'trend_agent', 'einvoice',
    'api_access', 'support_email', 'support_live', 'support_24_7',
    'dedicated_manager',
  ],
};

export { PLAN_FEATURES };

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptionData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const [plansResponse, subscriptionResponse, creditsResponse] = await Promise.all([
        supabase.from('subscription_plans').select('*').order('monthly_price', { ascending: true }),
        supabase.from('user_subscriptions').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('credit_balances').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      if (plansResponse.data) {
        setAllPlans(plansResponse.data);
      }

      if (subscriptionResponse.data) {
        setUserSubscription(subscriptionResponse.data);
        const plan = plansResponse.data?.find(p => p.name === subscriptionResponse.data.plan_name);
        setCurrentPlan(plan || plansResponse.data?.[0] || null);
      } else {
        setCurrentPlan(plansResponse.data?.[0] || null);
        setUserSubscription({
          id: '',
          user_id: user.id,
          plan_name: 'FREE',
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: null,
          payment_method: null,
          auto_renew: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (creditsResponse.data) {
        setCreditBalance(creditsResponse.data);
      } else {
        setCreditBalance({
          id: '',
          user_id: user.id,
          ocr_credits: 5,
          e_fatura_credits: 5,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [user]);

  const hasFeature = (featureCode: FeatureCode): boolean => {
    if (isSuperAdmin(user)) return true;
    if (!currentPlan) return true;
    const planFeatures = PLAN_FEATURES[currentPlan.name as PlanName];
    if (!planFeatures) return true;
    return planFeatures.includes(featureCode);
  };

  const canAccessRoute = (route: string): boolean => {
    if (isSuperAdmin(user)) return true;
    const requiredFeatures = FEATURE_TO_ROUTE_MAP[route];
    if (!requiredFeatures) return true;
    return requiredFeatures.some(feature => hasFeature(feature));
  };

  const refreshSubscription = async () => {
    await fetchSubscriptionData();
  };

  const deductCredit = async (type: 'ocr' | 'e_fatura'): Promise<boolean> => {
    if (!user || !creditBalance) return false;

    const creditField = type === 'ocr' ? 'ocr_credits' : 'e_fatura_credits';
    const currentCredits = creditBalance[creditField];

    if (currentCredits <= 0) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('credit_balances')
        .update({ [creditField]: currentCredits - 1 })
        .eq('user_id', user.id);

      if (!error) {
        setCreditBalance({
          ...creditBalance,
          [creditField]: currentCredits - 1,
        });
        return true;
      }
    } catch (error) {
      console.error('Error deducting credit:', error);
    }

    return false;
  };

  return (
    <SubscriptionContext.Provider
      value={{
        currentPlan,
        userSubscription,
        creditBalance,
        allPlans,
        loading,
        hasFeature,
        canAccessRoute,
        refreshSubscription,
        deductCredit,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
