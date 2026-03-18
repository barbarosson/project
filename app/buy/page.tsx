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

export default function BuyPage() {
  const { language } = useLanguage()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null)

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

  async function startCheckout() {
    setError(null)
    setCheckoutHtml(null)

    if (!selectedPlan) {
      setError(language === 'tr' ? 'Lütfen bir paket seçin.' : 'Please select a plan.')
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
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold" style={{ color: '#0A2540' }}>
            {language === 'tr' ? 'Paket Seç & Ödeme' : 'Choose Plan & Pay'}
          </h1>
          <p className="text-sm" style={{ color: '#425466' }}>
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

        <Card>
          <CardHeader>
            <CardTitle>{language === 'tr' ? 'Ödeme Sepeti' : 'Checkout Basket'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm" style={{ color: '#425466' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold" style={{ color: '#0A2540' }}>
                  {selectedPlan ? selectedPlan.name : (language === 'tr' ? 'Paket seçilmedi' : 'No plan selected')}
                </div>
                {selectedPlan?.description && (
                  <div className="mt-1">
                    {selectedPlan.description}
                  </div>
                )}
              </div>
              <div className="font-bold whitespace-nowrap" style={{ color: '#0A2540' }}>
                {amountTl > 0
                  ? `${amountTl} TL/ay`
                  : (language === 'tr' ? 'Ücretsiz' : 'Free')}
              </div>
            </div>
            <div className="text-xs" style={{ color: '#6B7280' }}>
              {language === 'tr'
                ? 'Fiyatlar seçili pakete göre otomatik doldurulur.'
                : 'Pricing is prefilled based on selected plan.'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{language === 'tr' ? '1) Paket Seçin' : '1) Select a Plan'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plans.map((p) => {
                const price = Number(p.monthly_price ?? p.price_tl ?? 0) || 0
                const active = p.id === selectedPlanId
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`text-left rounded-xl border p-4 transition-all ${active ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold" style={{ color: '#0A2540' }}>{p.name}</div>
                        {p.description && (
                          <div className="text-sm mt-1" style={{ color: '#425466' }}>{p.description}</div>
                        )}
                      </div>
                      <div className="font-bold whitespace-nowrap" style={{ color: '#0A2540' }}>
                        {price > 0 ? `${price} TL/ay` : (language === 'tr' ? 'Ücretsiz' : 'Free')}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{language === 'tr' ? '2) Alıcı Bilgileri' : '2) Buyer Information'}</CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle>{language === 'tr' ? '3) Ödeme' : '3) Payment'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-xl border border-gray-200 p-4"
                dangerouslySetInnerHTML={{ __html: checkoutHtml }}
              />
            </CardContent>
          </Card>
        )}

        <div className="text-xs" style={{ color: '#6B7280' }}>
          {language === 'tr'
            ? 'Not: iyzico checkout formunun çalışması için sunucuda IYZICO_API_KEY / IYZICO_SECRET_KEY / IYZICO_BASE_URL değişkenleri tanımlı olmalıdır.'
            : 'Note: To render iyzico checkout form, server env vars IYZICO_API_KEY / IYZICO_SECRET_KEY / IYZICO_BASE_URL must be set.'}
        </div>
      </div>
    </main>
  )
}

