'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/hooks/use-currency'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Star, Zap, Crown, Rocket, Building2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface SubscriptionPlan {
  id: string
  name: string
  price_tl: number
  price_usd: number
  description: string
  features: string[]
  recommended: boolean
  trial_days: number
}

const PLAN_CONFIG: Record<string, { icon: React.ElementType; labelTr: string; labelEn: string; popular?: boolean }> = {
  FREE: { icon: Zap, labelTr: 'Temel', labelEn: 'Free' },
  KUCUK: { icon: Star, labelTr: 'Kucuk', labelEn: 'Small' },
  ORTA: { icon: Rocket, labelTr: 'Orta', labelEn: 'Medium', popular: true },
  BUYUK: { icon: Crown, labelTr: 'Buyuk', labelEn: 'Large' },
  ENTERPRISE: { icon: Building2, labelTr: 'Kurumsal', labelEn: 'Enterprise' },
}

export function ParasutPricingSection() {
  const { language } = useLanguage()
  const { currency, formatCurrency } = useCurrency()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlans()
  }, [])

  async function fetchPlans() {
    try {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('monthly_price', { ascending: true })

      if (data) {
        setPlans(data as SubscriptionPlan[])
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section id="pricing" className="py-20 lg:py-28 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-12 bg-gray-200 rounded w-full"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-emerald-500 text-white px-4 py-1.5">
            {language === 'en' ? 'Simple Pricing' : 'Basit Fiyatlandirma'}
          </Badge>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4" style={{ color: '#1a202c' }}>
            {language === 'en'
              ? 'Choose Your Perfect Plan'
              : 'Size Uygun Plani Secin'
            }
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            {language === 'en'
              ? 'All plans include 14-day free trial. No credit card required. Cancel anytime.'
              : 'Tum planlarda 14 gunluk ucretsiz deneme. Kredi karti gerekmez.'
            }
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {plans.map((plan) => {
            const cfg = PLAN_CONFIG[plan.name] || PLAN_CONFIG.FREE
            const Icon = cfg.icon
            const basePrice = currency === 'TRY' ? plan.price_tl : plan.price_usd
            const isPopular = cfg.popular

            return (
              <Card
                key={plan.id}
                className={`relative p-6 flex flex-col transition-all duration-300 ${
                  isPopular
                    ? 'border-2 border-emerald-500 shadow-2xl lg:scale-105 bg-gradient-to-br from-emerald-50 to-white'
                    : 'border-2 border-gray-200 hover:border-emerald-300 bg-white hover:shadow-xl'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white px-4 py-1.5 text-sm font-semibold shadow-lg">
                      {language === 'en' ? 'Most Popular' : 'En Populer'}
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-5">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 ${
                    isPopular ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">
                    {language === 'tr' ? cfg.labelTr : cfg.labelEn}
                  </h3>

                  <div className="mb-2">
                    {basePrice === 0 ? (
                      <span className="text-3xl font-bold text-gray-600">
                        {language === 'tr' ? 'Ucretsiz' : 'Free'}
                      </span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold">{formatCurrency(basePrice)}</span>
                        <span className="text-gray-600 ml-1">/{language === 'en' ? 'mo' : 'ay'}</span>
                      </>
                    )}
                  </div>

                  {plan.trial_days > 0 && basePrice > 0 && (
                    <p className="text-xs text-green-600 font-semibold">
                      {language === 'en'
                        ? `${plan.trial_days}-day free trial`
                        : `${plan.trial_days} gun ucretsiz deneme`
                      }
                    </p>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                        isPopular ? 'text-emerald-500' : 'text-green-600'
                      }`} />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/login" className="block mt-auto">
                  <Button
                    className={`w-full h-11 text-sm font-semibold ${
                      isPopular
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {basePrice === 0
                      ? (language === 'en' ? 'Start Free' : 'Ucretsiz Basla')
                      : (language === 'en' ? 'Start Free Trial' : 'Ucretsiz Dene')
                    }
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <Link href="/pricing">
            <Button
              size="lg"
              className="gap-2 shadow-2xl rounded-full font-semibold transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: '#0A2540', color: '#00D4AA' }}
            >
              {language === 'en' ? 'View Full Pricing Details' : 'Tum Fiyatlandirma Detaylari'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
