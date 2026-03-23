'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Star, Zap, Crown, Rocket, Building2 } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'
import { useSiteConfig } from '@/contexts/site-config-context'
import { useCurrency } from '@/hooks/use-currency'

interface SubscriptionPlan {
  id: string
  name: string
  plan_code?: string
  price_tl: number
  price_usd: number
  description: string
  features: string[]
  recommended: boolean
}

const PLAN_CONFIG: Record<string, { icon: React.ElementType; labelTr: string; labelEn: string; popular?: boolean }> = {
  FREE: { icon: Zap, labelTr: 'Temel', labelEn: 'Free' },
  KUCUK: { icon: Star, labelTr: 'Kucuk', labelEn: 'Small' },
  ORTA: { icon: Rocket, labelTr: 'Orta', labelEn: 'Medium', popular: true },
  BUYUK: { icon: Crown, labelTr: 'Buyuk', labelEn: 'Large' },
  ENTERPRISE: { icon: Building2, labelTr: 'Kurumsal', labelEn: 'Enterprise' },
}

type FeatureKey =
  | 'DASHBOARD'
  | 'CLIENTS'
  | 'SALES_INVOICES'
  | 'PURCHASE_INVOICES'
  | 'ORDERS'
  | 'PURCHASE_ORDERS'
  | 'PRODUCTS_SERVICES'
  | 'HR'
  | 'WAREHOUSE_STOCK'
  | 'BRANCHES'
  | 'PROJECTS'
  | 'PRODUCTION'
  | 'COSTING'
  | 'QUALITY'
  | 'QUOTATIONS'
  | 'CAMPAIGNS'
  | 'MARKETPLACE_INTEGRATIONS'
  | 'AI_BOTS'
  | 'E_DOCUMENTS'
  | 'E_INVOICE'
  | 'E_ARCHIVE'
  | 'E_IRSALIYE'
  | 'E_SMM'
  | 'SUPPORT_EMAIL'
  | 'LIVE_CHAT'
  | 'APP_CHATBOT'

const FEATURE_CATALOG: Array<{
  groupLabelTr: string
  groupLabelEn: string
  items: Array<{ key: FeatureKey; labelTr: string; labelEn: string }>
}> = [
  {
    groupLabelTr: 'Uygulama modülleri',
    groupLabelEn: 'App modules',
    items: [
      { key: 'DASHBOARD', labelTr: 'Kontrol paneli', labelEn: 'Dashboard' },
      { key: 'CLIENTS', labelTr: 'Cariler', labelEn: 'Clients' },
      { key: 'SALES_INVOICES', labelTr: 'Satış Faturaları', labelEn: 'Sales Invoices' },
      { key: 'PURCHASE_INVOICES', labelTr: 'Alış Faturaları', labelEn: 'Purchase Invoices' },
      { key: 'ORDERS', labelTr: 'Siparişler', labelEn: 'Orders' },
      { key: 'PURCHASE_ORDERS', labelTr: 'Satın Alma İşlemleri', labelEn: 'Procurement' },
      { key: 'PRODUCTS_SERVICES', labelTr: 'Ürün ve Hizmetler', labelEn: 'Products & Services' },
      { key: 'HR', labelTr: 'İnsan kaynakları', labelEn: 'Human Resources' },
      { key: 'WAREHOUSE_STOCK', labelTr: 'Depo ve stok yönetimi', labelEn: 'Warehouse & Stock' },
      { key: 'BRANCHES', labelTr: 'Şube yönetimi', labelEn: 'Branch management' },
      { key: 'PROJECTS', labelTr: 'Proje yönetimi', labelEn: 'Project management' },
      { key: 'PRODUCTION', labelTr: 'Üretim', labelEn: 'Production' },
      { key: 'COSTING', labelTr: 'Maliyet', labelEn: 'Costing' },
      { key: 'QUALITY', labelTr: 'Kalite', labelEn: 'Quality' },
      { key: 'QUOTATIONS', labelTr: 'Teklifler', labelEn: 'Quotations' },
      { key: 'CAMPAIGNS', labelTr: 'Kampanyalar', labelEn: 'Campaigns' },
      {
        key: 'MARKETPLACE_INTEGRATIONS',
        labelTr: 'Pazaryeri entegrasyonları',
        labelEn: 'Marketplace integrations',
      },
    ],
  },
  {
    groupLabelTr: 'Yapay Zeka',
    groupLabelEn: 'AI',
    items: [{ key: 'AI_BOTS', labelTr: 'Tüm modüllere ait AI botları', labelEn: 'AI bots for all modules' }],
  },
  {
    groupLabelTr: 'E-belge entegrasyonları',
    groupLabelEn: 'E-document integrations',
    items: [
      { key: 'E_DOCUMENTS', labelTr: 'E-belge entegrasyonları (genel)', labelEn: 'E-doc integrations (general)' },
      { key: 'E_INVOICE', labelTr: 'e-Fatura', labelEn: 'e-Invoice' },
      { key: 'E_ARCHIVE', labelTr: 'e-Arşiv', labelEn: 'e-Archive' },
      { key: 'E_IRSALIYE', labelTr: 'e-İrsaliye', labelEn: 'e-Delivery Note' },
      { key: 'E_SMM', labelTr: 'e-SMM', labelEn: 'e-SMM' },
    ],
  },
  {
    groupLabelTr: 'Destek',
    groupLabelEn: 'Support',
    items: [
      { key: 'SUPPORT_EMAIL', labelTr: 'Destek hattı mail', labelEn: 'Support email' },
      { key: 'LIVE_CHAT', labelTr: 'Canlı chat', labelEn: 'Live chat' },
      { key: 'APP_CHATBOT', labelTr: 'Uygulama chatbot', labelEn: 'App chatbot' },
    ],
  },
]

const ALL_FEATURE_KEYS: FeatureKey[] = FEATURE_CATALOG.flatMap((g) => g.items.map((i) => i.key))

// Varsayılan: Temel + Küçük paketlerde tüm öğeler aktif. Orta/Büyük/Kurumsal için siz tikleri söyleyince güncelleyeceğiz.
const PLAN_ENABLED_FEATURE_KEYS: Record<string, FeatureKey[]> = {
  FREE: ALL_FEATURE_KEYS,
  KUCUK: ALL_FEATURE_KEYS,
  ORTA: [],
  BUYUK: [],
  ENTERPRISE: [],
}

export function PricingSection() {
  const { t, language } = useLanguage()
  const { config } = useSiteConfig()
  const { currency, formatCurrency } = useCurrency()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlans()
  }, [])

  async function fetchPlans() {
    try {
      const { data, error} = await supabase
        .from('subscription_plans')
        .select('*')
        .order('monthly_price', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Error fetching pricing plans:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section id="pricing" className="section-spacing">
        <div className="container-marketing">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (plans.length === 0) return null

  return (
    <section id="pricing" className="section-spacing">
      <div className="container-marketing">
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              {t.marketing.pricing.eyebrow}
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            {config ? (language === 'en' ? config.pricing_title_en : config.pricing_title_tr) : t.marketing.pricing.title}
          </h2>
          <p className="text-lg text-auto-contrast-muted-light max-w-2xl mx-auto">
            {config ? (language === 'en' ? config.pricing_subtitle_en : config.pricing_subtitle_tr) : t.marketing.pricing.subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const planTier = (plan.plan_code || plan.name || '').toString().toUpperCase()
            const cfg = PLAN_CONFIG[planTier] || PLAN_CONFIG.FREE
            const Icon = cfg.icon
            const basePrice = currency === 'TRY' ? plan.price_tl : plan.price_usd
            const isPopular = cfg.popular
            const isComingSoon = ['ORTA', 'BUYUK', 'ENTERPRISE'].includes(planTier)

            return (
              <Card
                key={plan.id}
                className={`relative p-6 bg-white flex flex-col ${
                  isPopular
                    ? 'border-2 border-emerald-500 shadow-xl lg:scale-105'
                    : 'border hover:border-gray-300'
                } transition-all`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white px-4 py-1">
                      {t.marketing.pricing.mostPopular}
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 ${
                    isPopular ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">
                    {language === 'tr' ? cfg.labelTr : cfg.labelEn}
                  </h3>
                  <div className="mb-1">
                    {isComingSoon ? (
                      <span className="text-2xl font-bold text-gray-400">
                        {language === 'en' ? 'COMING SOON' : 'ÇOK YAKINDA'}
                      </span>
                    ) : basePrice === 0 ? (
                      <span className="text-2xl font-bold text-gray-600">
                        {language === 'tr' ? 'Ucretsiz' : 'Free'}
                      </span>
                    ) : (
                      <>
                        <span className="text-2xl font-bold">{formatCurrency(basePrice)}</span>
                        <span className="text-auto-contrast-muted-light text-sm">{t.marketing.pricing.perMonth}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-6 flex-1">
                  {FEATURE_CATALOG.map((group) => (
                    <div key={group.groupLabelTr}>
                      <div className="text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                        {language === 'en' ? group.groupLabelEn : group.groupLabelTr}
                      </div>
                      <div className="space-y-2">
                        {group.items.map((item) => {
                          const enabled = new Set(
                            PLAN_ENABLED_FEATURE_KEYS[planTier] || []
                          ).has(item.key)
                          return (
                            <div key={item.key} className="flex items-start gap-2">
                              {enabled ? (
                                <CheckCircle2
                                  className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                                    isPopular ? 'text-emerald-500' : 'text-green-600'
                                  }`}
                                />
                              ) : (
                                <Circle className="h-4 w-4 flex-shrink-0 mt-0.5 text-gray-300" />
                              )}
                              <span className={`text-sm ${enabled ? 'text-gray-700' : 'text-gray-400'}`}>
                                {language === 'en' ? item.labelEn : item.labelTr}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {isComingSoon ? (
                  <Button
                    disabled
                    className="w-full h-11 text-sm font-semibold bg-gray-200 text-gray-500 cursor-not-allowed mt-auto"
                  >
                    {language === 'en' ? 'COMING SOON' : 'ÇOK YAKINDA'}
                  </Button>
                ) : (
                  <Link href="/login" className="block mt-auto">
                    <Button
                      className={`w-full ${
                        isPopular
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                    >
                      {basePrice === 0
                        ? (language === 'en' ? 'Start Free' : 'Ucretsiz Basla')
                        : t.marketing.pricing.startFreeTrial
                      }
                    </Button>
                  </Link>
                )}
              </Card>
            )
          })}
        </div>

        <div className="mt-16 text-center">
          <Link href="/pricing">
            <Button
              size="lg"
              className="shadow-2xl rounded-full font-semibold transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: '#0A2540', color: '#00D4AA' }}
            >
              {language === 'en' ? 'View Full Pricing Details' : 'Tum Fiyatlandirma Detaylari'}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
