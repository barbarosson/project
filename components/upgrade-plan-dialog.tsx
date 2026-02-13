"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Lock, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { useSubscription, PlanName } from '@/contexts/subscription-context';
import { useRouter } from 'next/navigation';

interface UpgradePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  requiredPlan: PlanName;
}

const PLAN_DISPLAY_NAMES: Record<PlanName, { tr: string; en: string }> = {
  FREE: { tr: 'Temel', en: 'Free' },
  KUCUK: { tr: 'Kucuk', en: 'Small' },
  ORTA: { tr: 'Orta', en: 'Medium' },
  BUYUK: { tr: 'Buyuk', en: 'Large' },
  ENTERPRISE: { tr: 'Kurumsal', en: 'Enterprise' },
};

const PLAN_BENEFITS: Record<PlanName, { tr: string[]; en: string[] }> = {
  FREE: {
    tr: ['Kontrol Paneli', 'Musteri Yonetimi (25)', 'Urun Yonetimi (50)', 'Fatura Olusturma (15/ay)', 'Email Destek'],
    en: ['Dashboard', 'Customer Management (25)', 'Product Management (50)', 'Invoice Creation (15/mo)', 'Email Support'],
  },
  KUCUK: {
    tr: ['250 Musteri', '500 Urun', 'Sinirsiz Fatura', 'Gider Yonetimi', 'Finans Hesaplari & Islemleri', 'Stok Takibi', 'Nakit Akis Grafigi'],
    en: ['250 Customers', '500 Products', 'Unlimited Invoices', 'Expense Management', 'Finance Accounts & Transactions', 'Stock Tracking', 'Cash Flow Chart'],
  },
  ORTA: {
    tr: ['Sinirsiz Musteri & Urun', 'Teklif Yonetimi', 'Kampanya Yonetimi', 'Toplu Fatura & Urun', 'Cok Dovizli Islem', 'Canli Destek'],
    en: ['Unlimited Customers & Products', 'Proposal Management', 'Campaign Management', 'Bulk Invoice & Product', 'Multi-Currency', 'Live Support'],
  },
  BUYUK: {
    tr: ['AI Is Analizleri', 'Finans Robotu', 'Nakit Akis Tahminleri', 'E-Fatura & E-Arsiv', 'E-Irsaliye', 'Oncelikli Destek'],
    en: ['AI Business Insights', 'Finance Robot', 'Cash Flow Predictions', 'E-Invoice & E-Archive', 'E-Dispatch', 'Priority Support'],
  },
  ENTERPRISE: {
    tr: ['API Erisimi', 'Ozel Hesap Yoneticisi', '7/24 Premium Destek', 'Ozel Gelistirme', 'SLA Garantisi', 'Sinirsiz Kullanici'],
    en: ['API Access', 'Dedicated Account Manager', '24/7 Premium Support', 'Custom Development', 'SLA Guarantee', 'Unlimited Users'],
  },
};

export function UpgradePlanDialog({ open, onOpenChange, featureName, requiredPlan }: UpgradePlanDialogProps) {
  const { language } = useLanguage();
  const { allPlans } = useSubscription();
  const router = useRouter();

  const isTr = language === 'tr';
  const targetPlan = allPlans.find(p => p.name === requiredPlan);
  const displayName = PLAN_DISPLAY_NAMES[requiredPlan]?.[isTr ? 'tr' : 'en'] || requiredPlan;
  const benefits = PLAN_BENEFITS[requiredPlan]?.[isTr ? 'tr' : 'en'] || [];

  const handleUpgrade = () => {
    router.push('/settings/subscription');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-500" />
            <DialogTitle className="text-2xl">
              {isTr ? 'Ozellik Kilitli' : 'Feature Locked'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            {isTr ? 'Bu ozellik icin' : 'This feature requires'}{' '}
            <span className="font-semibold text-foreground">{displayName}</span>{' '}
            {isTr ? 'plani veya ustu gereklidir' : 'plan or higher'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Sparkles className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{featureName}</h3>
                <p className="text-sm text-muted-foreground">
                  {isTr
                    ? `Bu guclu ozelligi ${displayName} plana yukselerek acin`
                    : `Unlock this feature by upgrading to ${displayName}`}
                </p>
              </div>
            </div>
          </Card>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <h4 className="font-semibold">{displayName}</h4>
              {targetPlan && (
                <div className="text-right">
                  {targetPlan.monthly_price === 0 ? (
                    <span className="text-2xl font-bold text-gray-600">
                      {isTr ? 'Ucretsiz' : 'Free'}
                    </span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold">{targetPlan.monthly_price} TL</span>
                      <span className="text-sm text-muted-foreground">/{isTr ? 'ay' : 'month'}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{isTr ? 'Icerikler' : 'Includes'}:</p>
              <div className="grid grid-cols-2 gap-2">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {isTr ? 'Belki Sonra' : 'Maybe Later'}
            </Button>
            <Button
              onClick={handleUpgrade}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {isTr ? 'Simdi Yukselt' : 'Upgrade Now'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
