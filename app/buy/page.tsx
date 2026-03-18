'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/language-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/loading-spinner'

type Plan = {
  id: string
  name: string
  monthly_price: number | null
  price_tl: number | null
  description: string | null
  is_active?: boolean | null
  sort_order?: number | null
}

type BuyerForm = {
  name: string
  surname: string
  email: string
  gsmNumber: string
  address: string
  city: string
  country: string
}

const PLAN_FEATURES: Record<string, { tr: string[]; en: string[] }> = {
  FREE: {
    tr: [
      'Temel faturalama ve müşteri kaydı',
      'Sınırlı raporlama ve panel görünümü',
      'E-posta ile destek',
    ],
    en: [
      'Basic invoicing and customer records',
      'Limited reporting and dashboard',
      'Email support',
    ],
  },
  KUCUK: {
    tr: [
      'Fatura, teklif ve tahsilat takibi',
      'Temel stok ve gider yönetimi',
      'Standart raporlar ve dışa aktarma',
      'Öncelikli e-posta desteği',
    ],
    en: [
      'Invoice, quote and collection tracking',
      'Basic inventory and expense management',
      'Standard reports and exports',
      'Priority email support',
    ],
  },
  ORTA: {
    tr: [
      'Ekipli kullanım ve yetkilendirme',
      'Gelişmiş raporlar ve performans takibi',
      'Entegrasyonlara uygun akışlar',
      'Öncelikli destek ve hızlı geri dönüş',
    ],
    en: [
      'Team access and permissions',
      'Advanced reports and performance tracking',
      'Integration-ready workflows',
      'Priority support with faster response',
    ],
  },
  BUYUK: {
    tr: [
      'Çoklu depo/şube senaryoları',
      'Gelişmiş stok, maliyet ve kârlılık',
      'Detaylı raporlama ve kontrol mekanizmaları',
      'Öncelikli destek',
    ],
    en: [
      'Multi-warehouse/branch scenarios',
      'Advanced inventory, cost and profitability',
      'Detailed reporting and controls',
      'Priority support',
    ],
  },
  ENTERPRISE: {
    tr: [
      'Kurumsal onboarding ve özel süreçler',
      'SLA ve özel destek kanalları',
      'Özel entegrasyon / veri aktarımı',
      'Gelişmiş güvenlik ve erişim kontrolleri',
    ],
    en: [
      'Enterprise onboarding and custom workflows',
      'SLA and dedicated support channels',
      'Custom integrations / data migration',
      'Advanced security and access controls',
    ],
  },
}

function getPlanKey(name: string) {
  const key = (name || '').toUpperCase()
  if (key in PLAN_FEATURES) return key as keyof typeof PLAN_FEATURES
  return null
}

export default function BuyPage() {
  const { language } = useLanguage()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null)
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [requireMembership, setRequireMembership] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')
  const [memberEmail, setMemberEmail] = useState('')
  const [memberPassword, setMemberPassword] = useState('')
  const [memberFullName, setMemberFullName] = useState('')

  const [buyer, setBuyer] = useState<BuyerForm>({
    name: '',
    surname: '',
    email: '',
    gsmNumber: '',
    address: '',
    city: '',
    country: 'Turkey',
  })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (mounted) {
          setAuthUserId(userData?.user?.id ?? null)
        }

        const { data, error } = await supabase
          .from('subscription_plans')
          .select('id, name, monthly_price, price_tl, description, is_active, sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (error) throw error
        if (!mounted) return
        const fetchedPlans = (data as Plan[]) || []
        setPlans(fetchedPlans)

        const requestedPlanId = searchParams.get('planId')
        const requestedPlanExists =
          !!requestedPlanId && fetchedPlans.some((p) => p.id === requestedPlanId)

        setSelectedPlanId(requestedPlanExists ? (requestedPlanId as string) : (fetchedPlans[0]?.id ?? ''))
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || (language === 'tr' ? 'Planlar yüklenemedi.' : 'Failed to load plans.'))
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [language])

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) || null,
    [plans, selectedPlanId]
  )

  const amountTl = useMemo(() => {
    if (!selectedPlan) return 0
    const p = selectedPlan.monthly_price ?? selectedPlan.price_tl ?? 0
    return Number(p) || 0
  }, [selectedPlan])

  async function ensureMembership() {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user ?? null
    setAuthUserId(user?.id ?? null)
    if (!user) {
      setRequireMembership(true)
      throw new Error(language === 'tr' ? 'Ödemeye geçmeden önce üyelik gerekir. Lütfen giriş yapın veya kayıt olun.' : 'You must be signed in before proceeding to payment.')
    }
  }

  async function handleMembershipSubmit() {
    setError(null)
    if (!memberEmail || !memberPassword || (authMode === 'signup' && !memberFullName)) {
      setError(language === 'tr' ? 'Lütfen üyelik bilgilerini doldurun.' : 'Please fill membership information.')
      return
    }
    if (memberPassword.length < 6) {
      setError(language === 'tr' ? 'Şifre en az 6 karakter olmalı.' : 'Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    try {
      if (authMode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: memberEmail.trim(),
          password: memberPassword,
        })
        if (error) throw error
        setAuthUserId(data.user?.id ?? null)
        setRequireMembership(false)
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: memberEmail.trim(),
          password: memberPassword,
          options: {
            data: { full_name: memberFullName.trim() },
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
          },
        })
        if (error) throw error
        // If email confirmation is enabled, session may be null.
        if (!data.session) {
          setError(language === 'tr'
            ? 'Kayıt alındı. E-postanıza gelen doğrulama linki ile hesabınızı aktive edin, ardından tekrar giriş yapın.'
            : 'Sign-up received. Please confirm via email, then sign in.')
          setAuthMode('signin')
          return
        }
        setAuthUserId(data.user?.id ?? null)
        setRequireMembership(false)
      }
    } catch (e: any) {
      setError(e?.message || (language === 'tr' ? 'Üyelik işlemi başarısız.' : 'Membership action failed.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function startCheckout() {
    setError(null)
    setCheckoutHtml(null)

    if (!selectedPlan) {
      setError(language === 'tr' ? 'Lütfen bir paket seçin.' : 'Please select a plan.')
      return
    }
    try {
      await ensureMembership()
    } catch (e: any) {
      setError(e?.message || (language === 'tr' ? 'Üyelik kontrolü başarısız.' : 'Membership check failed.'))
      return
    }
    if (!buyer.name || !buyer.surname || !buyer.email || !buyer.gsmNumber || !buyer.address || !buyer.city || !buyer.country) {
      setError(language === 'tr' ? 'Lütfen alıcı bilgilerini doldurun.' : 'Please fill buyer information.')
      return
    }
    if (amountTl <= 0) {
      setError(language === 'tr' ? 'Bu paket için fiyat bulunamadı.' : 'Price not found for selected plan.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/payments/iyzico/checkout-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: language === 'tr' ? 'tr' : 'en',
          plan: {
            id: selectedPlan.id,
            name: selectedPlan.name,
            price: amountTl,
          },
          buyer,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data && data.error) || 'Checkout initialization failed')
      }
      if (!data.checkoutFormContent) {
        throw new Error(language === 'tr' ? 'Ödeme formu alınamadı.' : 'Checkout form content missing.')
      }

      setCheckoutHtml(data.checkoutFormContent as string)
    } catch (e: any) {
      setError(e?.message || (language === 'tr' ? 'Ödeme başlatılamadı.' : 'Failed to start payment.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#0A2540]">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white">
            {language === 'tr' ? 'Paket Seç & Ödeme' : 'Choose Plan & Pay'}
          </h1>
          <p className="text-sm text-white/80">
            {language === 'tr'
              ? 'Kredi kartı veya banka kartı ile güvenli ödeme yapabilirsiniz.'
              : 'You can pay securely with credit or debit card.'}
          </p>
        </div>

        {error && (
          <div className="rounded-xl p-4 border" style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#991B1B' }}>
            {error}
          </div>
        )}

        {requireMembership && !authUserId && (
          <Card className="border border-white/25 bg-white/95 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-[#0A2540]">{language === 'tr' ? 'Üyelik Bilgileri' : 'Membership'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                    authMode === 'signup' ? 'border-emerald-500 bg-emerald-50 text-[#0A2540]' : 'border-slate-300 bg-white text-[#425466]'
                  }`}
                >
                  {language === 'tr' ? 'Kayıt Ol' : 'Sign Up'}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                    authMode === 'signin' ? 'border-emerald-500 bg-emerald-50 text-[#0A2540]' : 'border-slate-300 bg-white text-[#425466]'
                  }`}
                >
                  {language === 'tr' ? 'Giriş Yap' : 'Sign In'}
                </button>
              </div>

              {authMode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="member-fullname">{language === 'tr' ? 'Ad Soyad' : 'Full Name'}</Label>
                  <Input
                    id="member-fullname"
                    value={memberFullName}
                    onChange={(e) => setMemberFullName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="member-email">{language === 'tr' ? 'E-posta' : 'Email'}</Label>
                <Input
                  id="member-email"
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-password">{language === 'tr' ? 'Şifre' : 'Password'}</Label>
                <Input
                  id="member-password"
                  type="password"
                  value={memberPassword}
                  onChange={(e) => setMemberPassword(e.target.value)}
                />
              </div>

              <Button
                onClick={handleMembershipSubmit}
                disabled={submitting}
                className="w-full rounded-full font-semibold"
                style={{ backgroundColor: '#00D4AA', color: '#0A2540' }}
              >
                {submitting
                  ? (language === 'tr' ? 'İşleniyor…' : 'Processing…')
                  : (authMode === 'signup'
                    ? (language === 'tr' ? 'Üyelik Oluştur' : 'Create Account')
                    : (language === 'tr' ? 'Giriş Yap' : 'Sign In'))}
              </Button>

              <div className="text-xs text-[#6B7280]">
                {language === 'tr'
                  ? 'Not: E-posta doğrulaması açıksa kayıt sonrası doğrulama gerekir.'
                  : 'Note: If email confirmation is enabled, you must confirm before signing in.'}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border border-white/25 bg-white/95 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-[#0A2540]">{language === 'tr' ? 'Ödeme Sepeti' : 'Checkout Basket'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[#425466]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-[#0A2540]">
                  {selectedPlan ? selectedPlan.name : (language === 'tr' ? 'Paket seçilmedi' : 'No plan selected')}
                </div>
                {selectedPlan?.description && (
                  <div className="mt-1">
                    {selectedPlan.description}
                  </div>
                )}
                {selectedPlan && (() => {
                  const key = getPlanKey(selectedPlan.name)
                  if (!key) return null
                  const feats = PLAN_FEATURES[key][language === 'tr' ? 'tr' : 'en']
                  return (
                    <ul className="mt-2 space-y-1 text-xs">
                      {feats.slice(0, 3).map((f) => (
                        <li key={f} className="flex gap-2">
                          <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )
                })()}
              </div>
              <div className="font-bold whitespace-nowrap text-[#0A2540]">
                {amountTl > 0
                  ? `${amountTl} TL/ay`
                  : (language === 'tr' ? 'Ücretsiz' : 'Free')}
              </div>
            </div>
            <div className="text-xs text-[#6B7280]">
              {language === 'tr'
                ? 'Fiyatlar seçili pakete göre otomatik doldurulur.'
                : 'Pricing is prefilled based on selected plan.'}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/25 bg-white/95 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-[#0A2540]">{language === 'tr' ? '1) Paket Seçin' : '1) Select a Plan'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plans.map((p) => {
                const price = Number(p.monthly_price ?? p.price_tl ?? 0) || 0
                const active = p.id === selectedPlanId
                const key = getPlanKey(p.name)
                const feats = key ? PLAN_FEATURES[key][language === 'tr' ? 'tr' : 'en'] : []
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`text-left rounded-xl border p-4 transition-all ${
                      active
                        ? 'border-emerald-500 ring-2 ring-emerald-200 bg-emerald-50/60'
                        : 'border-slate-300 hover:border-slate-400 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[#0A2540]">{p.name}</div>
                        {p.description && (
                          <div className="text-sm mt-1 text-[#425466]">{p.description}</div>
                        )}
                        {feats.length > 0 && (
                          <ul className="mt-2 space-y-1 text-xs text-[#425466]">
                            {feats.slice(0, 4).map((f) => (
                              <li key={f} className="flex gap-2">
                                <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-[#0A2540]" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="font-bold whitespace-nowrap text-[#0A2540]">
                        {price > 0 ? `${price} TL/ay` : (language === 'tr' ? 'Ücretsiz' : 'Free')}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/25 bg-white/95 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-[#0A2540]">{language === 'tr' ? '2) Alıcı Bilgileri' : '2) Buyer Information'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buyer-name">{language === 'tr' ? 'Ad' : 'Name'}</Label>
                <Input id="buyer-name" value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyer-surname">{language === 'tr' ? 'Soyad' : 'Surname'}</Label>
                <Input id="buyer-surname" value={buyer.surname} onChange={(e) => setBuyer({ ...buyer, surname: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyer-email">{language === 'tr' ? 'E-posta' : 'Email'}</Label>
                <Input id="buyer-email" type="email" value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyer-gsm">{language === 'tr' ? 'Telefon (GSM)' : 'Phone (GSM)'}</Label>
                <Input id="buyer-gsm" placeholder="+905xxxxxxxxx" value={buyer.gsmNumber} onChange={(e) => setBuyer({ ...buyer, gsmNumber: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="buyer-address">{language === 'tr' ? 'Adres' : 'Address'}</Label>
                <Input id="buyer-address" value={buyer.address} onChange={(e) => setBuyer({ ...buyer, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyer-city">{language === 'tr' ? 'Şehir' : 'City'}</Label>
                <Input id="buyer-city" value={buyer.city} onChange={(e) => setBuyer({ ...buyer, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyer-country">{language === 'tr' ? 'Ülke' : 'Country'}</Label>
                <Input id="buyer-country" value={buyer.country} onChange={(e) => setBuyer({ ...buyer, country: e.target.value })} />
              </div>
            </div>

            <Button
              onClick={startCheckout}
              disabled={submitting}
              className="w-full rounded-full font-semibold"
              style={{ backgroundColor: '#0A2540', color: '#ffffff' }}
            >
              {submitting
                ? (language === 'tr' ? 'Ödeme Başlatılıyor…' : 'Starting Payment…')
                : (language === 'tr' ? 'Ödemeye Geç' : 'Proceed to Payment')}
            </Button>
          </CardContent>
        </Card>

        {checkoutHtml && (
          <Card className="border border-white/25 bg-white/95 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-[#0A2540]">{language === 'tr' ? '3) Ödeme' : '3) Payment'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-xl border border-slate-300 p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: checkoutHtml }}
              />
            </CardContent>
          </Card>
        )}

        <div className="text-xs text-white/70">
          {language === 'tr'
            ? 'Not: iyzico checkout formunun çalışması için sunucuda IYZICO_API_KEY / IYZICO_SECRET_KEY / IYZICO_BASE_URL değişkenleri tanımlı olmalıdır.'
            : 'Note: To render iyzico checkout form, server env vars IYZICO_API_KEY / IYZICO_SECRET_KEY / IYZICO_BASE_URL must be set.'}
        </div>
      </div>
    </main>
  )
}

