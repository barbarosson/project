'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Star, Zap, Crown, Rocket, Building2 } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'
import { useSiteConfig } from '@/contexts/site-config-context'
import { useCurrency } from '@/hooks/use-currency'

interface SubscriptionPlan {
  id: string
  name: string
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
            const cfg = PLAN_CONFIG[plan.name] || PLAN_CONFIG.FREE
            const Icon = cfg.icon
            const basePrice = currency === 'TRY' ? plan.price_tl : plan.price_usd
            const isPopular = cfg.popular

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
                    {basePrice === 0 ? (
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

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <CheckCircle2 className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                        isPopular ? 'text-emerald-500' : 'text-green-600'
                      }`} />
                      <span className="text-sm text-auto-contrast-muted-light">{feature}</span>
                    </li>
                  ))}
                </ul>

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
