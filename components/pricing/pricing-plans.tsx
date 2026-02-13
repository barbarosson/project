'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/hooks/use-currency'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, Star, Zap, Crown, Rocket, Building2 } from 'lucide-react'
import Link from 'next/link'

interface SubscriptionPlan {
  id: string
  name: string
  plan_tier: string
  price_tl: number
  price_usd: number
  monthly_price: number
  annual_price_tl: number
  annual_price_usd: number
  discount_annual: number
  description: string
  features: string[]
  recommended: boolean
  trial_days: number
  addon_support: boolean
  is_active: boolean
  sort_order: number
}

interface PlanFeature {
  id: string
  feature_key: string
  name_tr: string
  name_en: string
  category: string
  display_order: number
  is_limit: boolean
}

interface FeatureAssignment {
  plan_id: string
  feature_id: string
  enabled: boolean
  limit_value: string | null
}

interface Addon {
  id: string
  name_en: string
  name_tr: string
  price_tl: number
  price_usd: number
}

interface PricingPlansProps {
  selectedAddons: string[]
}

const PLAN_CONFIG: Record<string, {
  icon: React.ElementType
  labelTr: string
  labelEn: string
  color: string
  popular?: boolean
}> = {
  FREE: { icon: Zap, labelTr: 'Baslangic', labelEn: 'Free', color: 'gray' },
  KUCUK: { icon: Star, labelTr: 'Kucuk', labelEn: 'Small', color: 'sky' },
  ORTA: { icon: Rocket, labelTr: 'Orta', labelEn: 'Medium', color: 'emerald', popular: true },
  BUYUK: { icon: Crown, labelTr: 'Buyuk', labelEn: 'Large', color: 'amber' },
  ENTERPRISE: { icon: Building2, labelTr: 'Kurumsal', labelEn: 'Enterprise', color: 'slate' },
}

export function PricingPlans({ selectedAddons }: PricingPlansProps) {
  const { language } = useLanguage()
  const { currency, formatCurrency } = useCurrency()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [dbFeatures, setDbFeatures] = useState<PlanFeature[]>([])
  const [assignments, setAssignments] = useState<FeatureAssignment[]>([])
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [plansRes, addonsRes, featRes, assignRes] = await Promise.all([
        supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('pricing_addons')
          .select('id, name_en, name_tr, price_tl, price_usd')
          .eq('is_active', true),
        supabase
          .from('plan_features')
          .select('id, feature_key, name_tr, name_en, category, display_order, is_limit')
          .order('display_order'),
        supabase
          .from('plan_feature_assignments')
          .select('plan_id, feature_id, enabled, limit_value'),
      ])

      if (plansRes.data) setPlans(plansRes.data as SubscriptionPlan[])
      if (addonsRes.data) setAddons(addonsRes.data as Addon[])
      if (featRes.data) setDbFeatures(featRes.data)
      if (assignRes.data) setAssignments(assignRes.data)
    } catch (error) {
      console.error('Error fetching pricing data:', error)
    } finally {
      setLoading(false)
    }
  }

  function getPlanFeatures(planId: string): string[] {
    if (dbFeatures.length === 0 || assignments.length === 0) return []

    const planAssignments = assignments
      .filter((a) => a.plan_id === planId && a.enabled)
      .slice(0, 8)

    return planAssignments.map((a) => {
      const feat = dbFeatures.find((f) => f.id === a.feature_id)
      if (!feat) return ''
      const label = language === 'tr' ? feat.name_tr : feat.name_en
      if (a.limit_value) {
        const lv = a.limit_value.toLowerCase()
        if (lv === 'sinirsiz' || lv === 'unlimited') {
          return `${label} (${language === 'tr' ? 'Sinirsiz' : 'Unlimited'})`
        }
        return `${label}: ${a.limit_value}`
      }
      return label
    }).filter(Boolean)
  }

  function calculateTotalPrice(basePrice: number): number {
    const addonPrice = selectedAddons.reduce((total, addonId) => {
      const addon = addons.find(a => a.id === addonId)
      if (addon) {
        return total + (currency === 'TRY' ? addon.price_tl : addon.price_usd)
      }
      return total
    }, 0)

    return basePrice + addonPrice
  }

  function getPrice(plan: SubscriptionPlan): number {
    if (billingCycle === 'yearly') {
      return currency === 'TRY'
        ? (plan.annual_price_tl || Math.round((plan.monthly_price || plan.price_tl) * 10))
        : (plan.annual_price_usd || Math.round(plan.price_usd * 10))
    }
    return currency === 'TRY' ? (plan.monthly_price || plan.price_tl) : plan.price_usd
  }

  if (loading) {
    return (
      <div className="container-marketing">
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
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
    )
  }

  const discountPct = plans.find(p => p.discount_annual > 0)?.discount_annual || 17

  return (
    <div className="container-marketing">
      <div className="flex justify-center mb-12">
        <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="monthly">
              {language === 'en' ? 'Monthly' : 'Aylik'}
            </TabsTrigger>
            <TabsTrigger value="yearly" className="relative">
              {language === 'en' ? 'Yearly' : 'Yillik'}
              <Badge className="absolute -top-3 -right-3 bg-green-600 text-white text-xs">
                {language === 'en' ? `Save ${discountPct}%` : `%${discountPct} Indirim`}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
        {plans.map((plan) => {
          const config = PLAN_CONFIG[plan.name] || PLAN_CONFIG.FREE
          const Icon = config.icon
          const basePrice = getPrice(plan)
          const totalPrice = calculateTotalPrice(basePrice)
          const isPopular = config.popular

          const featureList = getPlanFeatures(plan.id)
          const displayFeatures = featureList.length > 0 ? featureList : (plan.features || [])

          return (
            <Card
              key={plan.id}
              className={`relative p-6 flex flex-col ${
                isPopular
                  ? 'border-2 border-emerald-500 shadow-2xl md:scale-105 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950 dark:to-gray-900'
                  : 'border hover:border-gray-300 bg-white dark:bg-gray-900'
              } transition-all duration-300`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-emerald-500 text-white px-4 py-1 text-sm font-semibold">
                    {language === 'en' ? 'Most Popular' : 'En Populer'}
                  </Badge>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 ${
                  isPopular ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold mb-1">
                  {language === 'tr' ? config.labelTr : config.labelEn}
                </h3>

                <div className="mb-1">
                  {plan.price_tl === 0 ? (
                    <span className="text-3xl font-bold text-gray-600">
                      {language === 'tr' ? 'Ucretsiz' : 'Free'}
                    </span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">{formatCurrency(totalPrice)}</span>
                      <span className="text-muted-foreground ml-1 text-sm">
                        /{billingCycle === 'monthly'
                          ? (language === 'en' ? 'mo' : 'ay')
                          : (language === 'en' ? 'yr' : 'yil')
                        }
                      </span>
                    </>
                  )}
                </div>

                {billingCycle === 'yearly' && plan.price_tl > 0 && (
                  <p className="text-xs text-green-600 font-semibold">
                    {language === 'en'
                      ? `Save ${discountPct}% annually`
                      : `Yillik %${discountPct} tasarruf`
                    }
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {displayFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                      isPopular ? 'text-emerald-500' : 'text-green-600'
                    }`} />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/login" className="block mt-auto">
                <Button
                  className={`w-full h-11 text-sm font-semibold ${
                    isPopular
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg'
                      : 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
                  }`}
                >
                  {plan.price_tl === 0
                    ? (language === 'en' ? 'Start Free' : 'Ucretsiz Basla')
                    : (language === 'en'
                      ? `Start ${plan.trial_days}-Day Trial`
                      : `${plan.trial_days} Gun Ucretsiz Dene`)
                  }
                </Button>
              </Link>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
