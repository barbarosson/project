"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useLanguage } from '@/contexts/language-context';
import { useSubscription } from '@/contexts/subscription-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { PRICING_MODULES, SCALABLE_UNITS, YEARLY_DISCOUNT_MONTHS } from '@/lib/pricing-configurator-data';
import { Checkbox } from '@/components/ui/checkbox';
import { IyzicoCheckoutDialog } from '@/components/pricing/iyzico-checkout-dialog';
import type { PricingBreakdown } from '@/hooks/use-pricing-engine';
import type { PricingLineItem } from '@/hooks/use-pricing-engine';

export default function SubscriptionPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { currentPlan, userSubscription, creditBalance, refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(new Set());
  const [extraUsers, setExtraUsers] = useState<number>(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedEInvoicePackQty, setSelectedEInvoicePackQty] = useState<number | null>(null);

  const eInvoicePacks = [
    { qty: 100, basePrice: 400 },
    { qty: 200, basePrice: 660, tag: 'advantage' as const },
    { qty: 500, basePrice: 1500 },
    { qty: 1000, basePrice: 2500 },
    { qty: 2500, basePrice: 5500 },
    { qty: 5000, basePrice: 9500 },
  ];

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
      FREE: { tr: 'Temel Paket', en: 'Base Package' },
      KUCUK: { tr: 'Temel Paket + Başlangıç Modülleri', en: 'Base Package + Starter Modules' },
      ORTA: { tr: 'Temel Paket + Büyüme Modülleri', en: 'Base Package + Growth Modules' },
      BUYUK: { tr: 'Temel Paket + Genişletilmiş Modüller', en: 'Base Package + Extended Modules' },
      ENTERPRISE: { tr: 'Temel Paket + Kurumsal Modüller', en: 'Base Package + Enterprise Modules' },
    };
    return names[planName]?.[language === 'tr' ? 'tr' : 'en'] || planName;
  };
  const baseModules = PRICING_MODULES.filter((m) => m.includedInBase);
  const paidModules = PRICING_MODULES.filter((m) => !m.includedInBase);
  const extraUsersUnit = SCALABLE_UNITS.find((u) => u.id === 'extra_users');
  const selectedModules = paidModules.filter((m) => selectedModuleIds.has(m.id));

  const cartBreakdown = useMemo<PricingBreakdown>(() => {
    const lineItems: PricingLineItem[] = [];
    let recurringMonthlyTRY = 0;
    let oneTimeTRY = 0;
    let selectedModuleCount = 0;

    for (const mod of selectedModules) {
      lineItems.push({
        id: mod.id,
        labelTr: mod.labelTr,
        labelEn: mod.labelEn,
        monthlyTRY: mod.monthlyPriceTRY,
        monthlyUSD: mod.monthlyPriceUSD,
        type: 'module' as const,
      });
      recurringMonthlyTRY += mod.monthlyPriceTRY;
      selectedModuleCount += 1;
    }

    if (extraUsersUnit && extraUsers > 0) {
      lineItems.push({
        id: extraUsersUnit.id,
        labelTr: `${extraUsers} ${extraUsersUnit.labelTr}`,
        labelEn: `${extraUsers} ${extraUsersUnit.labelEn}`,
        monthlyTRY: extraUsers * extraUsersUnit.unitPriceTRY,
        monthlyUSD: extraUsers * extraUsersUnit.unitPriceUSD,
        type: 'scalable' as const,
      });
      recurringMonthlyTRY += extraUsers * extraUsersUnit.unitPriceTRY;
    }

    if (selectedEInvoicePackQty) {
      const selectedPack = eInvoicePacks.find((p) => p.qty === selectedEInvoicePackQty);
      if (selectedPack) {
        const discounted = selectedPack.basePrice * 0.85;
        lineItems.push({
          id: `einvoice_pack_${selectedPack.qty}`,
          labelTr: `${selectedPack.qty} e‑Kontör`,
          labelEn: `${selectedPack.qty} e-Token`,
          monthlyTRY: discounted,
          monthlyUSD: 0,
          type: 'credit_pack' as const,
        });
        oneTimeTRY += discounted;
      }
    }

    const yearlyMultiplier = 12 - YEARLY_DISCOUNT_MONTHS;
    const totalMonthlyTRY = recurringMonthlyTRY + oneTimeTRY;
    const totalYearlyTRY = recurringMonthlyTRY * yearlyMultiplier + oneTimeTRY;
    return {
      lineItems,
      subtotalMonthlyTRY: totalMonthlyTRY,
      subtotalMonthlyUSD: 0,
      subtotalYearlyTRY: recurringMonthlyTRY * 12 + oneTimeTRY,
      subtotalYearlyUSD: 0,
      discountMonthsTRY: recurringMonthlyTRY * YEARLY_DISCOUNT_MONTHS,
      discountMonthsUSD: 0,
      totalMonthlyTRY,
      totalMonthlyUSD: 0,
      totalYearlyTRY,
      totalYearlyUSD: 0,
      selectedModuleCount,
      aiBotCount: 0,
    };
  }, [selectedModules, extraUsersUnit, extraUsers, selectedEInvoicePackQty]);

  const toggleModuleInCart = (moduleId: string) => {
    setSelectedModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const formatTRY = (n: number) =>
    new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 2,
    }).format(n);
  const formatDate = (iso?: string | null) => {
    if (!iso) return language === 'tr' ? 'Belirtilmemiş' : 'Not specified';
    return new Date(iso).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  const multiplier = billingCycle === 'yearly' ? (12 - YEARLY_DISCOUNT_MONTHS) : 1;
  const cycleSuffix = billingCycle === 'yearly'
    ? (language === 'tr' ? '/yıl' : '/yr')
    : (language === 'tr' ? '/ay' : '/mo');

  return (
    <DashboardLayout>
      <div className="space-y-10 p-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">{t.subscription.title}</h1>
          <p className="text-gray-500 mt-2">{t.subscription.chooseThePlan}</p>
        </div>

        <Card className="border-2 border-blue-100 bg-blue-50/30 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle>
              {language === 'tr' ? 'Sepet ile Uygulama İçi Satın Alma' : 'In-App Purchases with Cart'}
            </CardTitle>
            <CardDescription>
              {language === 'tr'
                ? 'Fiyatlandırma sayfasına gitmeden modül ve ek kullanıcı seçin, sepetten iyzico ile ödeyin.'
                : 'Select modules and extra users here, then pay via iyzico from the cart.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border bg-white/90 dark:bg-gray-900 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{language === 'tr' ? 'Ek Modül Seçimi' : 'Add-on Module Selection'}</h3>
                <div className="inline-flex rounded-md border p-0.5 bg-white">
                  <Button
                    type="button"
                    size="sm"
                    variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                    className={billingCycle === 'monthly' ? 'h-7 px-3 bg-[#0A2540] text-white' : 'h-7 px-3'}
                    onClick={() => setBillingCycle('monthly')}
                  >
                    {language === 'tr' ? 'Aylık' : 'Monthly'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
                    className={billingCycle === 'yearly' ? 'h-7 px-3 bg-[#0A2540] text-white' : 'h-7 px-3'}
                    onClick={() => setBillingCycle('yearly')}
                  >
                    {language === 'tr' ? 'Yıllık' : 'Yearly'}
                  </Button>
                </div>
              </div>
              {billingCycle === 'yearly' && (
                <p className="text-xs text-emerald-700 font-medium">
                  {language === 'tr' ? `${YEARLY_DISCOUNT_MONTHS} ay hediye yıllık fiyat uygulanır.` : `${YEARLY_DISCOUNT_MONTHS} months free yearly pricing applied.`}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {paidModules.map((mod) => {
                  const checked = selectedModuleIds.has(mod.id);
                  return (
                    <label
                      key={mod.id}
                      className="rounded-md border bg-white dark:bg-gray-900 p-3 flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleModuleInCart(mod.id)}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-medium">{language === 'tr' ? mod.labelTr : mod.labelEn}</p>
                          <p className="text-xs text-gray-500">{language === 'tr' ? mod.descriptionTr : mod.descriptionEn}</p>
                          <p className="text-xs font-semibold mt-1" style={{ color: '#0A2540' }}>
                            {language === 'tr' ? 'Fiyat: ' : 'Price: '}
                            {mod.monthlyPriceTRY * multiplier} TL{cycleSuffix}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold whitespace-nowrap">{mod.monthlyPriceTRY * multiplier} TL{cycleSuffix}</span>
                    </label>
                  );
                })}
              </div>

              {extraUsersUnit && (
                <div className="rounded-md border bg-white dark:bg-gray-900 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{language === 'tr' ? extraUsersUnit.labelTr : extraUsersUnit.labelEn}</p>
                    <p className="text-xs text-gray-500">
                      {language === 'tr' ? 'Mevcut pakete ek kullanıcı ekleyin' : 'Add extra users to current package'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 border-[#0A2540] text-[#0A2540] font-bold text-base leading-none"
                      onClick={() => setExtraUsers((v) => Math.max(0, v - 1))}
                      aria-label={language === 'tr' ? 'Kullanıcı azalt' : 'Decrease users'}
                    >
                      <span style={{ color: '#0A2540', lineHeight: 1 }}>−</span>
                    </Button>
                    <span className="w-8 text-center text-sm font-bold">{extraUsers}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 border-[#0A2540] text-[#0A2540] font-bold text-base leading-none"
                      onClick={() => setExtraUsers((v) => Math.min(100, v + 1))}
                      aria-label={language === 'tr' ? 'Kullanıcı artır' : 'Increase users'}
                    >
                      <span style={{ color: '#0A2540', lineHeight: 1 }}>+</span>
                    </Button>
                    <span className="text-xs font-semibold ml-2">{extraUsersUnit.unitPriceTRY * multiplier} TL/{language === 'tr' ? 'kullanıcı' : 'user'}{billingCycle === 'yearly' ? (language === 'tr' ? '/yıl' : '/yr') : ''}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-white dark:bg-gray-900 p-4 space-y-3">
              <h3 className="font-semibold">{language === 'tr' ? 'Sepet Özeti' : 'Cart Summary'}</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cartBreakdown.lineItems.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {language === 'tr' ? 'Sepet boş. Modül veya ek kullanıcı seçin.' : 'Cart is empty. Select modules or extra users.'}
                  </p>
                ) : (
                  cartBreakdown.lineItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span>{language === 'tr' ? item.labelTr : item.labelEn}</span>
                      <span className="font-semibold">
                        {formatTRY(item.type === 'credit_pack' ? item.monthlyTRY : item.monthlyTRY * multiplier)}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t pt-3 flex items-center justify-between">
                <span className="font-semibold">{billingCycle === 'yearly' ? (language === 'tr' ? 'Toplam (Yıllık)' : 'Total (Yearly)') : (language === 'tr' ? 'Toplam (Aylık)' : 'Total (Monthly)')}</span>
                <span className="text-lg font-bold" style={{ color: '#0A2540' }}>
                  {formatTRY(billingCycle === 'yearly' ? cartBreakdown.totalYearlyTRY : cartBreakdown.totalMonthlyTRY)}
                </span>
              </div>
              <Button
                className="w-full"
                style={{ backgroundColor: '#0A2540', color: '#ffffff' }}
                disabled={(billingCycle === 'yearly' ? cartBreakdown.totalYearlyTRY : cartBreakdown.totalMonthlyTRY) <= 0}
                onClick={() => setCheckoutOpen(true)}
              >
                {language === 'tr' ? 'iyzico ile Öde' : 'Pay with iyzico'}
              </Button>
              <Link href="/pricing" className="block">
                <Button className="w-full" variant="outline">
                  {language === 'tr' ? 'Detaylı Fiyatlandırma' : 'Detailed Pricing'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
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
              <div className="rounded-lg border bg-slate-50/70 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>{language === 'tr' ? 'e‑Kontör Paketleri' : 'e-Token Packages'}</span>
                  <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">-%15</span>
                </div>

                {eInvoicePacks.map((pack) => {
                  const discounted = pack.basePrice * 0.85;
                  const isSelected = selectedEInvoicePackQty === pack.qty;
                  return (
                  <button
                    type="button"
                    key={pack.qty}
                    onClick={() => setSelectedEInvoicePackQty(isSelected ? null : pack.qty)}
                    className={`w-full text-left rounded-md border px-3 py-2 transition-colors ${
                      isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{pack.qty.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')} e‑Kontör</p>
                        {pack.tag && <p className="text-[11px] text-emerald-700 font-medium">{language === 'tr' ? 'Avantaj paketi' : 'Advantage pack'}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-gray-500 line-through">
                          {pack.basePrice.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')} ₺
                        </p>
                        <p className="text-sm font-bold" style={{ color: '#0A2540' }}>
                          {discounted.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')} ₺
                        </p>
                        <p className="text-[11px] text-gray-500">+ KDV</p>
                      </div>
                    </div>
                  </button>
                )})}
              </div>
              <Button className="w-full" variant="outline" onClick={() => handleBuyCredits('e_fatura')} disabled={loading === 'e_fatura' || !selectedEInvoicePackQty}>
                {loading === 'e_fatura'
                  ? t.subscription.processing
                  : selectedEInvoicePackQty
                    ? (language === 'tr' ? 'Seçilen Paketi Satın Al' : 'Purchase Selected Pack')
                    : (language === 'tr' ? 'Önce paket seçin' : 'Select a pack first')}
              </Button>
            </CardContent>
          </Card>
          {userSubscription && (
            <Card>
              <CardHeader>
                <CardTitle>{language === 'tr' ? 'Mevcut Abonelik Bilgileri' : 'Current Subscription Details'}</CardTitle>
                <CardDescription>
                  {language === 'tr'
                    ? 'Planınız ve abonelik durumunuzun detayları.'
                    : 'Detailed overview of your plan and subscription status.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-gray-500">{t.subscription.currentPlan}</p>
                    <p className="font-semibold mt-1">{getPlanDisplayName(userSubscription.plan_name)}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-gray-500">{t.common.status}</p>
                    <div className="mt-1">
                      <Badge variant={userSubscription.status === 'active' ? 'default' : 'secondary'}>
                        {userSubscription.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-gray-500">{language === 'tr' ? 'Başlangıç Tarihi' : 'Start Date'}</p>
                    <p className="font-medium mt-1">{formatDate(userSubscription.started_at)}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-gray-500">{language === 'tr' ? 'Bitiş / Yenileme Tarihi' : 'End / Renewal Date'}</p>
                    <p className="font-medium mt-1">{formatDate(userSubscription.expires_at)}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-gray-500">{t.subscription.autoRenew}</p>
                    <p className="font-medium mt-1">{userSubscription.auto_renew ? t.common.yes : t.common.no}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-gray-500">{language === 'tr' ? 'Ödeme Yöntemi' : 'Payment Method'}</p>
                    <p className="font-medium mt-1">
                      {userSubscription.payment_method || (language === 'tr' ? 'Belirtilmemiş' : 'Not specified')}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-md border p-3 bg-blue-50/50">
                    <p className="text-xs text-gray-500">{language === 'tr' ? 'OCR Kredisi' : 'OCR Credits'}</p>
                    <p className="text-lg font-bold mt-1">{creditBalance?.ocr_credits || 0}</p>
                  </div>
                  <div className="rounded-md border p-3 bg-blue-50/50">
                    <p className="text-xs text-gray-500">{language === 'tr' ? 'e-Fatura Kredisi' : 'e-Invoice Credits'}</p>
                    <p className="text-lg font-bold mt-1">{creditBalance?.e_fatura_credits || 0}</p>
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-gray-500 mb-2">
                    {language === 'tr' ? 'Planınızdaki Ek Modül/Özellikler' : 'Add-ons/Features in Your Plan'}
                  </p>
                  {currentPlan?.features?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {currentPlan.features.slice(0, 12).map((feature, idx) => (
                        <Badge key={`${feature}-${idx}`} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {currentPlan.features.length > 12 && (
                        <Badge variant="outline" className="text-xs">
                          +{currentPlan.features.length - 12} {language === 'tr' ? 'özellik daha' : 'more'}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {language === 'tr'
                        ? 'Aktif ek modül bulunmuyor.'
                        : 'No active add-on modules found.'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
      <IyzicoCheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        breakdown={cartBreakdown}
        billingCycle={billingCycle}
        language={language}
        currency="TRY"
        formatCurrency={formatTRY}
      />
    </DashboardLayout>
  );
}
