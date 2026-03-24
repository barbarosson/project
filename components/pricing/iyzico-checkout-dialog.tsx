'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2, CreditCard, ShieldCheck } from 'lucide-react'
import type { PricingBreakdown } from '@/hooks/use-pricing-engine'
import type { BillingCycle } from '@/hooks/use-pricing-engine'

interface IyzicoCheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  breakdown: PricingBreakdown
  billingCycle: BillingCycle
  language: string
  currency: string
  formatCurrency: (n: number) => string
}

interface BuyerForm {
  name: string
  surname: string
  email: string
  gsmNumber: string
  address: string
  city: string
}

export function IyzicoCheckoutDialog({
  open,
  onOpenChange,
  breakdown,
  billingCycle,
  language,
  currency,
  formatCurrency,
}: IyzicoCheckoutDialogProps) {
  const [form, setForm] = useState<BuyerForm>({
    name: '',
    surname: '',
    email: '',
    gsmNumber: '',
    address: '',
    city: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null)

  const isYearly = billingCycle === 'yearly'
  const totalMonthly = currency === 'TRY' ? breakdown.totalMonthlyTRY : breakdown.totalMonthlyUSD
  const totalYearly = currency === 'TRY' ? breakdown.totalYearlyTRY : breakdown.totalYearlyUSD
  const displayTotal = isYearly ? totalYearly : totalMonthly

  const validationErrors: string[] = []
  if (form.name.trim().length < 2) validationErrors.push(language === 'en' ? 'First name' : 'Ad')
  if (form.surname.trim().length < 2) validationErrors.push(language === 'en' ? 'Last name' : 'Soyad')
  if (!form.email.includes('@')) validationErrors.push(language === 'en' ? 'Email' : 'E-posta')
  if (form.gsmNumber.replace(/\D/g, '').length < 10) validationErrors.push(language === 'en' ? 'Phone' : 'Telefon')
  if (form.address.trim().length < 3) validationErrors.push(language === 'en' ? 'Address' : 'Adres')
  if (form.city.trim().length < 2) validationErrors.push(language === 'en' ? 'City' : 'Şehir')
  const isFormValid = validationErrors.length === 0

  function updateField(field: keyof BuyerForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  async function handleCheckout() {
    if (!isFormValid) return
    setLoading(true)
    setError(null)
    setPaymentUrl(null)
    setCheckoutHtml(null)

    try {
      const planName = breakdown.lineItems
        .filter((li) => li.type !== 'credit_pack')
        .map((li) => (language === 'en' ? li.labelEn : li.labelTr))
        .slice(0, 5)
        .join(' + ')

      const res = await fetch('/api/payments/iyzico/checkout-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: language === 'en' ? 'en' : 'tr',
          plan: {
            id: `custom_${Date.now()}`,
            name: (planName || 'Modulus Custom Plan').slice(0, 120),
            price: displayTotal,
          },
          buyer: {
            name: form.name.trim(),
            surname: form.surname.trim(),
            email: form.email.trim(),
            gsmNumber: form.gsmNumber.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
            country: 'Turkey',
          },
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        const detail = data.error || ''
        const hint = data.raw?.errorMessage || ''
        const code = data.errorCode || data.raw?.errorCode || ''
        let msg: string
        if (detail.includes('Missing env')) {
          msg = language === 'en'
            ? 'Payment service not configured. Please contact support.'
            : 'Ödeme servisi yapılandırılmamış. Lütfen destek ile iletişime geçin.'
        } else {
          msg = hint || detail || (language === 'en' ? 'Payment initialization failed' : 'Ödeme başlatılamadı')
          if (code) msg += ` (${code})`
        }
        setError(msg)
        return
      }

      if (data.paymentPageUrl) {
        setPaymentUrl(data.paymentPageUrl)
      } else if (data.checkoutFormContent) {
        setCheckoutHtml(data.checkoutFormContent)
      } else {
        setError(language === 'en' ? 'No payment URL received' : 'Ödeme bağlantısı alınamadı')
      }
    } catch (e: any) {
      setError(e?.message || (language === 'en' ? 'Network error' : 'Bağlantı hatası'))
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setPaymentUrl(null)
    setCheckoutHtml(null)
    setError(null)
    setLoading(false)
    onOpenChange(false)
  }

  const showPayment = paymentUrl || checkoutHtml

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto border-0 shadow-2xl"
        style={{ backgroundColor: '#ffffff', color: '#1a202c' }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: '#0A2540' }}>
            <CreditCard className="h-5 w-5" />
            {language === 'en' ? 'Secure Payment' : 'Güvenli Ödeme'}
          </DialogTitle>
          <DialogDescription style={{ color: '#64748b' }}>
            {language === 'en'
              ? 'Enter your billing details to proceed with iyzico secure payment.'
              : 'iyzico güvenli ödeme ile devam etmek için fatura bilgilerinizi girin.'}
          </DialogDescription>
        </DialogHeader>

        {showPayment ? (
          <div className="space-y-4">
            {paymentUrl ? (
              <iframe
                src={paymentUrl}
                className="w-full h-[500px] rounded-lg border border-gray-200"
                title="iyzico payment"
                style={{ backgroundColor: '#ffffff' }}
              />
            ) : checkoutHtml ? (
              <div
                className="w-full min-h-[400px] rounded-lg border border-gray-200 p-4"
                style={{ backgroundColor: '#ffffff' }}
                dangerouslySetInnerHTML={{ __html: checkoutHtml }}
              />
            ) : null}
            <Button
              variant="outline"
              className="w-full"
              style={{ color: '#1a202c', borderColor: '#e2e8f0' }}
              onClick={handleClose}
            >
              {language === 'en' ? 'Close' : 'Kapat'}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Order total */}
            <div
              className="rounded-lg p-4 flex items-center justify-between"
              style={{ backgroundColor: '#f8fafc' }}
            >
              <span className="text-sm font-medium" style={{ color: '#475569' }}>
                {language === 'en' ? 'Amount to pay' : 'Ödenecek tutar'}
              </span>
              <span className="text-xl font-extrabold" style={{ color: '#0A2540' }}>
                {formatCurrency(displayTotal)}
                <span className="text-xs font-normal ml-1" style={{ color: '#94a3b8' }}>
                  {isYearly ? (language === 'en' ? '/year' : '/yıl') : (language === 'en' ? '/month' : '/ay')}
                </span>
              </span>
            </div>

            <Separator style={{ backgroundColor: '#e2e8f0' }} />

            {/* Buyer form */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="buyer-name" className="text-xs" style={{ color: '#475569' }}>
                  {language === 'en' ? 'First Name' : 'Ad'}
                </Label>
                <Input
                  id="buyer-name"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder={language === 'en' ? 'John' : 'Ahmet'}
                  style={{ backgroundColor: '#ffffff', color: '#1a202c', borderColor: '#e2e8f0' }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="buyer-surname" className="text-xs" style={{ color: '#475569' }}>
                  {language === 'en' ? 'Last Name' : 'Soyad'}
                </Label>
                <Input
                  id="buyer-surname"
                  value={form.surname}
                  onChange={(e) => updateField('surname', e.target.value)}
                  placeholder={language === 'en' ? 'Doe' : 'Yılmaz'}
                  style={{ backgroundColor: '#ffffff', color: '#1a202c', borderColor: '#e2e8f0' }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="buyer-email" className="text-xs" style={{ color: '#475569' }}>
                {language === 'en' ? 'Email' : 'E-posta'}
              </Label>
              <Input
                id="buyer-email"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="ornek@firma.com"
                style={{ backgroundColor: '#ffffff', color: '#1a202c', borderColor: '#e2e8f0' }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="buyer-gsm" className="text-xs" style={{ color: '#475569' }}>
                {language === 'en' ? 'Phone Number' : 'Telefon'}
              </Label>
              <Input
                id="buyer-gsm"
                type="tel"
                value={form.gsmNumber}
                onChange={(e) => updateField('gsmNumber', e.target.value)}
                placeholder="+905321234567"
                style={{ backgroundColor: '#ffffff', color: '#1a202c', borderColor: '#e2e8f0' }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="buyer-address" className="text-xs" style={{ color: '#475569' }}>
                {language === 'en' ? 'Address' : 'Adres'}
              </Label>
              <Input
                id="buyer-address"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder={language === 'en' ? 'Street, Building, No' : 'Mahalle, Cadde, No'}
                style={{ backgroundColor: '#ffffff', color: '#1a202c', borderColor: '#e2e8f0' }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="buyer-city" className="text-xs" style={{ color: '#475569' }}>
                {language === 'en' ? 'City' : 'Şehir'}
              </Label>
              <Input
                id="buyer-city"
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder={language === 'en' ? 'Istanbul' : 'İstanbul'}
                style={{ backgroundColor: '#ffffff', color: '#1a202c', borderColor: '#e2e8f0' }}
              />
            </div>

            {error && (
              <div
                className="rounded-lg border p-3"
                style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}
              >
                <p className="text-sm font-medium" style={{ color: '#dc2626' }}>{error}</p>
              </div>
            )}

            {!isFormValid && !error && (
              <div
                className="rounded-lg border p-2.5"
                style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}
              >
                <p className="text-xs" style={{ color: '#92400e' }}>
                  {language === 'en'
                    ? `Missing or invalid: ${validationErrors.join(', ')}`
                    : `Eksik veya geçersiz: ${validationErrors.join(', ')}`}
                </p>
              </div>
            )}

            <Button
              className="w-full h-12 font-bold text-sm"
              style={{
                backgroundColor: isFormValid ? '#0A2540' : '#94a3b8',
                color: '#ffffff',
                cursor: isFormValid ? 'pointer' : 'not-allowed',
                opacity: 1,
              }}
              disabled={!isFormValid || loading}
              onClick={handleCheckout}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'en' ? 'Initializing...' : 'Başlatılıyor...'}
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {language === 'en'
                    ? `Pay ${formatCurrency(displayTotal)} with iyzico`
                    : `${formatCurrency(displayTotal)} Öde — iyzico`}
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[10px]" style={{ color: '#94a3b8' }}>
              <ShieldCheck className="h-3 w-3" />
              {language === 'en'
                ? 'Secured by iyzico · PCI DSS Level 1 · 3D Secure'
                : 'iyzico güvencesiyle · PCI DSS Level 1 · 3D Secure'}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
