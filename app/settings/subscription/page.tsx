"use client";

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useLanguage } from '@/contexts/language-context';
import { useSubscription, PlanName } from '@/contexts/subscription-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, ShoppingCart, Star, Rocket, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { PlanFeatureMatrix } from '@/components/pricing/plan-feature-matrix';

interface PlanDisplay {
  name: PlanName;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgGradient: string;
}

const PLAN_DISPLAY: PlanDisplay[] = [
  { name: 'FREE', icon: Zap, color: 'text-gray-500', borderColor: 'border-gray-200', bgGradient: 'from-gray-50 to-white dark:from-gray-900 dark:to-gray-800' },
  { name: 'KUCUK', icon: Star, color: 'text-sky-500', borderColor: 'border-sky-200', bgGradient: 'from-sky-50 to-white dark:from-sky-950 dark:to-gray-800' },
  { name: 'ORTA', icon: Rocket, color: 'text-emerald-500', borderColor: 'border-emerald-300', bgGradient: 'from-emerald-50 to-white dark:from-emerald-950 dark:to-gray-800' },
  { name: 'BUYUK', icon: Crown, color: 'text-amber-500', borderColor: 'border-amber-200', bgGradient: 'from-amber-50 to-white dark:from-amber-950 dark:to-gray-800' },
  { name: 'ENTERPRISE', icon: Building2, color: 'text-gray-800 dark:text-gray-200', borderColor: 'border-gray-800 dark:border-gray-400', bgGradient: 'from-gray-100 to-white dark:from-gray-900 dark:to-gray-800' },
];

export default function SubscriptionPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { currentPlan, userSubscription, allPlans, creditBalance, refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (planName: string) => {
    if (!user) return;

    setLoading(planName);
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          plan_name: planName,
          status: 'active',
          started_at: new Date().toISOString(),
          auto_renew: true,
        });

      if (error) throw error;

      await refreshSubscription();
      toast.success(t.subscription.subscriptionUpdated);
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast.error(t.subscription.failedToUpdate);
    } finally {
      setLoading(null);
    }
  };

  const handleBuyCredits = async (type: 'ocr' | 'e_fatura') => {
    if (!user) return;

    setLoading(type);
    try {
      const field = type === 'ocr' ? 'ocr_credits' : 'e_fatura_credits';
      const currentCredits = creditBalance?.[field] || 0;

      const { error } = await supabase
        .from('credit_balances')
        .upsert({
          user_id: user.id,
          [field]: currentCredits + 100,
        });

      if (error) throw error;

      await refreshSubscription();
      toast.success(t.subscription.creditsPurchased);
    } catch (error) {
      console.error('Error buying credits:', error);
      toast.error(t.subscription.failedToPurchase);
    } finally {
      setLoading(null);
    }
  };

  const getPlanDisplayName = (planName: string) => {
    const names: Record<string, { tr: string; en: string }> = {
      FREE: { tr: 'Baslangic', en: 'Free' },
      KUCUK: { tr: 'Kucuk', en: 'Small' },
      ORTA: { tr: 'Orta', en: 'Medium' },
      BUYUK: { tr: 'Buyuk', en: 'Large' },
      ENTERPRISE: { tr: 'Kurumsal', en: 'Enterprise' },
    };
    return names[planName]?.[language === 'tr' ? 'tr' : 'en'] || planName;
  };

  const planOrder: PlanName[] = ['FREE', 'KUCUK', 'ORTA', 'BUYUK', 'ENTERPRISE'];
  const sortedPlans = [...allPlans].sort(
    (a, b) => planOrder.indexOf(a.name as PlanName) - planOrder.indexOf(b.name as PlanName)
  );

  return (
    <DashboardLayout>
      <div className="space-y-10 p-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">{t.subscription.title}</h1>
          <p className="text-gray-500 mt-2">{t.subscription.chooseThePlan}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {sortedPlans.map((plan) => {
            const isCurrentPlan = currentPlan?.name === plan.name;
            const display = PLAN_DISPLAY.find(d => d.name === plan.name);
            const isPopular = plan.name === 'ORTA';
            const Icon = display?.icon || Zap;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col transition-all duration-200 hover:shadow-lg ${
                  isCurrentPlan
                    ? 'ring-2 ring-emerald-500 shadow-lg'
                    : isPopular
                      ? `${display?.borderColor} shadow-md`
                      : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-emerald-500 text-white px-3 py-0.5 text-xs font-bold">
                      {t.subscription.mostPopular}
                    </Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 right-3 z-10">
                    <Badge className="bg-sky-500 text-white px-3 py-0.5 text-xs font-bold">
                      {t.subscription.currentPlan}
                    </Badge>
                  </div>
                )}

                <CardHeader className={`text-center pb-3 pt-6 bg-gradient-to-b ${display?.bgGradient} rounded-t-lg`}>
                  <div className={`flex justify-center mb-2 ${display?.color}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-lg">{getPlanDisplayName(plan.name)}</CardTitle>
                  <div className="mt-2">
                    {plan.monthly_price === 0 ? (
                      <span className="text-2xl font-bold text-gray-600">
                        {language === 'tr' ? 'Ucretsiz' : 'Free'}
                      </span>
                    ) : (
                      <>
                        <span className="text-2xl font-bold">{plan.monthly_price}</span>
                        <span className="text-gray-400 text-sm"> TL/{t.subscription.month}</span>
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col pt-4 space-y-3">
                  <div className="flex-1 space-y-1.5">
                    {plan.features && plan.features.slice(0, 6).map((feature, index) => (
                      <div key={index} className="flex items-start gap-1.5">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{feature}</span>
                      </div>
                    ))}
                    {plan.features && plan.features.length > 6 && (
                      <div className="text-xs text-gray-400 pl-5">
                        +{plan.features.length - 6} {language === 'tr' ? 'daha' : 'more'}
                      </div>
                    )}
                  </div>

                  {isCurrentPlan ? (
                    <Button className="w-full" variant="outline" disabled size="sm">
                      {t.subscription.currentPlan}
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={() => handleUpgrade(plan.name)}
                      disabled={loading === plan.name}
                      size="sm"
                    >
                      {loading === plan.name
                        ? t.subscription.processing
                        : plan.monthly_price === 0
                          ? (language === 'tr' ? 'Baslat' : 'Start Free')
                          : t.subscription.upgrade}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                {t.subscription.ocrCredits}
              </CardTitle>
              <CardDescription>{t.subscription.scanReceipts}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{creditBalance?.ocr_credits || 0}</span>
                <span className="text-gray-500">{t.subscription.creditsRemaining}</span>
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleBuyCredits('ocr')}
                disabled={loading === 'ocr'}
              >
                {loading === 'ocr' ? t.subscription.processing : t.subscription.buyCredits + ' (100 - 50 TL)'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                {t.subscription.eFaturaCredits}
              </CardTitle>
              <CardDescription>{t.subscription.sendEInvoices}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{creditBalance?.e_fatura_credits || 0}</span>
                <span className="text-gray-500">{t.subscription.creditsRemaining}</span>
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleBuyCredits('e_fatura')}
                disabled={loading === 'e_fatura'}
              >
                {loading === 'e_fatura' ? t.subscription.processing : t.subscription.buyCredits + ' (100 - 75 TL)'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {userSubscription && (
          <Card>
            <CardHeader>
              <CardTitle>{t.subscription.subscriptionDetails}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">{t.subscription.currentPlan}:</span>
                <span className="font-medium">{getPlanDisplayName(userSubscription.plan_name)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t.common.status}:</span>
                <Badge variant={userSubscription.status === 'active' ? 'default' : 'secondary'}>
                  {userSubscription.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t.subscription.autoRenew}:</span>
                <span className="font-medium">{userSubscription.auto_renew ? t.common.yes : t.common.no}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <PlanFeatureMatrix highlightPlan={currentPlan?.name as PlanName} />
      </div>
    </DashboardLayout>
  );
}
