'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowRight,
  Download,
  Package,
  Sparkles,
  Users,
  ShoppingCart,
  FileCheck,
  Cpu,
  CreditCard,
} from 'lucide-react'
import type { PricingBreakdown } from '@/hooks/use-pricing-engine'
import type { BillingCycle } from '@/hooks/use-pricing-engine'
import { IyzicoCheckoutDialog } from './iyzico-checkout-dialog'

interface OrderSummaryProps {
  breakdown: PricingBreakdown
  billingCycle: BillingCycle
  language: string
  currency: string
  formatCurrency: (n: number) => string
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  base: Package,
  module: Cpu,
  ai_bot: Sparkles,
  scalable: Users,
  marketplace: ShoppingCart,
  credit_pack: FileCheck,
}

const TYPE_COLORS: Record<string, string> = {
  base: 'text-blue-500',
  module: 'text-emerald-500',
  ai_bot: 'text-violet-500',
  scalable: 'text-sky-500',
  marketplace: 'text-orange-500',
  credit_pack: 'text-green-500',
}

export function OrderSummary({
  breakdown,
  billingCycle,
  language,
  currency,
  formatCurrency,
}: OrderSummaryProps) {
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const isYearly = billingCycle === 'yearly'
  const totalMonthly = currency === 'TRY' ? breakdown.totalMonthlyTRY : breakdown.totalMonthlyUSD
  const totalYearly = currency === 'TRY' ? breakdown.totalYearlyTRY : breakdown.totalYearlyUSD
  const discount = currency === 'TRY' ? breakdown.discountMonthsTRY : breakdown.discountMonthsUSD
  const subtotalYearly = currency === 'TRY' ? breakdown.subtotalYearlyTRY : breakdown.subtotalYearlyUSD

  const displayTotal = isYearly ? totalYearly : totalMonthly
  const displayPeriod = isYearly
    ? (language === 'en' ? '/year' : '/yıl')
    : (language === 'en' ? '/month' : '/ay')

  return (
    <>
      <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A2540] to-[#1a3a5c] px-6 py-5">
          <h3 className="font-bold text-lg" style={{ color: '#ffffff' }}>
            {language === 'en' ? 'Order Summary' : 'Sipariş Özeti'}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {breakdown.selectedModuleCount} {language === 'en' ? 'modules' : 'modül'}
            {breakdown.aiBotCount > 0 && (
              <> · {breakdown.aiBotCount} AI bot</>
            )}
          </p>
        </div>

        {/* Line Items */}
        <div className="px-6 py-4 max-h-[45vh] overflow-y-auto">
          {breakdown.lineItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              {language === 'en' ? 'Select modules to see pricing' : 'Fiyatlandırma için modül seçin'}
            </p>
          ) : (
            <ul className="space-y-2.5">
              {breakdown.lineItems.map((item) => {
                const Icon = TYPE_ICONS[item.type] || Package
                const color = TYPE_COLORS[item.type] || 'text-gray-500'
                const p = currency === 'TRY' ? item.monthlyTRY : item.monthlyUSD
                return (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${color}`} />
                      <span className="truncate text-gray-700 dark:text-gray-300">
                        {language === 'en' ? item.labelEn : item.labelTr}
                      </span>
                    </div>
                    <span className="ml-3 flex-shrink-0 font-medium tabular-nums">
                      {p === 0
                        ? (language === 'en' ? 'Free' : 'Dahil')
                        : formatCurrency(p)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <Separator />

        {/* Totals */}
        <div className="px-6 py-4 space-y-3">
          {isYearly && discount > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {language === 'en' ? 'Subtotal (12 mo)' : 'Ara toplam (12 ay)'}
                </span>
                <span className="line-through text-gray-400">{formatCurrency(subtotalYearly)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600 font-medium">
                  {language === 'en' ? 'Annual Discount' : 'Yıllık İndirim'}
                </span>
                <span className="text-green-600 font-bold">-{formatCurrency(discount)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {language === 'en' ? 'Total' : 'Toplam'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold tracking-tight">
                {formatCurrency(displayTotal)}
              </span>
              <span className="text-sm text-gray-500 ml-1">{displayPeriod}</span>
            </div>
          </div>

          {!isYearly && (
            <p className="text-[11px] text-gray-400 text-right">
              {language === 'en'
                ? `or ${formatCurrency(totalYearly)}/year (save 2 months)`
                : `veya ${formatCurrency(totalYearly)}/yıl (2 ay tasarruf)`}
            </p>
          )}
        </div>

        <Separator />

        {/* CTA */}
        <div className="px-6 py-5 space-y-3">
          {/* Primary: iyzico checkout */}
          <Button
            size="lg"
            className="w-full h-12 text-sm font-bold shadow-lg transition-all hover:shadow-xl"
            style={{ backgroundColor: '#0A2540', color: '#ffffff' }}
            disabled={displayTotal <= 0}
            onClick={() => setCheckoutOpen(true)}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {language === 'en' ? 'Proceed to Payment' : 'Ödemeye Geç'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {/* Secondary: free trial */}
          {displayTotal > 0 && (
            <p className="text-[11px] text-center text-gray-400">
              {language === 'en'
                ? 'or start with a 14-day free trial — no card needed'
                : 'veya 14 gün ücretsiz deneyin — kart gerekmez'}
            </p>
          )}

          <Button
            variant="outline"
            size="lg"
            className="w-full h-10 text-xs font-semibold"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.print()
              }
            }}
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            {language === 'en' ? 'Download PDF Quote' : 'PDF Teklif İndir'}
          </Button>

          <div className="flex items-center justify-center gap-4 pt-1">
            <img
              src="https://www.iyzico.com/assets/images/content/logo.svg"
              alt="iyzico"
              className="h-5 opacity-50"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <span className="text-[9px] text-gray-400">PCI DSS · 3D Secure</span>
          </div>
        </div>
      </Card>

      {/* iyzico Checkout Dialog */}
      <IyzicoCheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        breakdown={breakdown}
        billingCycle={billingCycle}
        language={language}
        currency={currency}
        formatCurrency={formatCurrency}
      />
    </>
  )
}
