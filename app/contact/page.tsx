'use client'

import { useState } from 'react'
import { MarketingLayout } from '@/components/marketing/marketing-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Mail, Phone, Clock, MapPin, Send } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'

export default function ContactPage() {
  const { t, language } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const contactInfoData = {
    heading_en: 'Get in Touch',
    heading_tr: 'İletişime Geçin',
    description_en: 'Have questions? We would love to hear from you.',
    description_tr: 'Sorularınız mı var? Sizden haber almayı çok isteriz.',
    email: 'info@modulustech.com',
    phone: '+90 532 496 58 28',
    address_en: 'Istanbul, Turkey',
    address_tr: 'İstanbul, Türkiye',
    office_hours_en: 'Monday - Friday: 9:00 AM - 6:00 PM',
    office_hours_tr: 'Pazartesi - Cuma: 09:00 - 18:00',
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = t.marketing.contact.nameRequired
    }

    if (!formData.email.trim()) {
      newErrors.email = t.marketing.contact.emailRequired
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.marketing.contact.invalidEmail
    }

    if (!formData.company.trim()) {
      newErrors.company = t.marketing.contact.companyRequired
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error(
        language === 'tr'
          ? 'Lütfen tüm zorunlu alanları doldurun'
          : 'Please fill in all required fields'
      )
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-demo-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            company: formData.company,
            phone: formData.phone || null,
            message: formData.message || null,
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()

        if (errorData.code === 'duplicate_email') {
          toast.error(
            language === 'tr'
              ? 'Bu e-posta adresiyle zaten bir demo talebi mevcut'
              : 'A demo request with this email already exists'
          )
          return
        }

        throw new Error(errorData.error || 'Failed to submit demo request')
      }

      const emailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-demo-request-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            fullName: formData.name,
            email: formData.email,
            companyName: formData.company,
            phone: formData.phone,
            industry: null,
            message: formData.message,
          }),
        }
      )

      if (!emailResponse.ok) {
        toast.warning(
          language === 'tr'
            ? 'Demo talebiniz kaydedildi ancak bildirim emaili gönderilemedi. Ekibimiz yine de talebinizi görecek!'
            : 'Demo request saved but notification email failed. Our team will still review it!'
        )
      } else {
        toast.success(
          language === 'tr'
            ? 'Demo talebiniz başarıyla gönderildi! En kısa sürede size dönüş yapacağız.'
            : 'Demo request submitted successfully! We will get back to you soon.'
        )
      }

      setIsSuccess(true)
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        message: '',
      })

    } catch (error: any) {
      toast.error(
        language === 'tr'
          ? 'Bir hata oluştu. Lütfen tekrar deneyin.'
          : 'An error occurred. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const benefits = [
    t.marketing.contact.freeConsultation,
    t.marketing.contact.personalizedDemo,
    t.marketing.contact.customQuote,
    t.marketing.contact.noObligation,
  ]

  const contactInfo = [
    { icon: Mail, label: t.marketing.contact.email, value: contactInfoData.email },
    { icon: Phone, label: t.marketing.contact.phone, value: contactInfoData.phone },
    { icon: Clock, label: t.marketing.contact.hours, value: language === 'tr' ? contactInfoData.office_hours_tr : contactInfoData.office_hours_en },
    { icon: MapPin, label: t.marketing.contact.location, value: language === 'tr' ? contactInfoData.address_tr : contactInfoData.address_en },
  ]

  if (isSuccess) {
    return (
      <MarketingLayout>
        <section className="pt-32 pb-24 lg:pt-40 lg:pb-32 min-h-screen flex items-center">
          <div className="container-marketing">
            <Card className="max-w-2xl mx-auto p-12 text-center border-2 bg-gradient-to-br from-white to-blue-50" style={{ borderColor: '#00D4AA' }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#00D4AA' }}>
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4" style={{ color: '#0A2540' }}>{t.marketing.contact.thankYou}</h2>
              <p className="text-lg mb-8" style={{ color: '#425466' }}>
                {t.marketing.contact.thankYouMessage}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => {
                    console.log('🔄 Yeni form için sıfırlanıyor...')
                    setIsSuccess(false)
                  }}
                  variant="outline"
                  style={{ borderColor: '#0A2540', color: '#0A2540' }}
                >
                  {t.marketing.contact.sendAnother}
                </Button>
                <Button
                  onClick={() => {
                    console.log('🏠 Ana sayfaya yönlendiriliyor...')
                    window.location.href = '/landing'
                  }}
                  className="text-white"
                  style={{ background: 'linear-gradient(135deg, #0A2540 0%, #0D3158 100%)' }}
                >
                  {t.marketing.contact.returnHome}
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </MarketingLayout>
    )
  }

  return (
    <MarketingLayout>
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="container-marketing">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#00D4AA' }}>
                {t.marketing.contact.eyebrow}
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6" style={{ color: '#0A2540' }}>
              {t.marketing.contact.title}
            </h1>
            <p className="text-xl" style={{ color: '#425466' }}>
              {t.marketing.contact.subtitle}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="lg:col-span-2">
              <Card className="p-8 lg:p-12">
                <h2 className="text-2xl font-bold mb-6" style={{ color: '#0A2540' }}>{t.marketing.contact.requestDemo}</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        {t.marketing.contact.fullName} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={t.marketing.contact.fullName}
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        {t.marketing.contact.workEmail} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="ornek@sirket.com"
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="company">
                        {t.marketing.contact.companyName} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder={t.marketing.contact.companyName}
                        className={errors.company ? 'border-red-500' : ''}
                      />
                      {errors.company && (
                        <p className="text-sm text-red-500">{errors.company}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t.marketing.contact.phoneNumber}</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+90 5XX XXX XX XX"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t.marketing.contact.message}</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={t.marketing.contact.messagePlaceholder}
                      rows={5}
                    />
                    <p className="text-sm text-[#475569]">
                      {t.marketing.contact.messageHelper}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full text-white"
                    style={{ background: 'linear-gradient(135deg, #0A2540 0%, #0D3158 100%)' }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t.marketing.contact.sending}
                      </div>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {t.marketing.contact.bookDemoBtn}
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-center" style={{ color: '#425466' }}>
                    {t.marketing.contact.disclaimer}
                  </p>
                </form>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4" style={{ color: '#0A2540' }}>{t.marketing.contact.whatToExpect}</h3>
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#00D4AA' }} />
                      <span style={{ color: '#425466' }}>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4" style={{ color: '#0A2540' }}>
                  {language === 'tr' ? contactInfoData.heading_tr : contactInfoData.heading_en}
                </h3>
                <div className="space-y-4">
                  {contactInfo.map((info, index) => {
                    const Icon = info.icon
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#00D4AA' }} />
                        <div>
                          <div className="text-sm font-medium" style={{ color: '#0A2540' }}>{info.label}</div>
                          <div className="text-sm" style={{ color: '#425466' }}>{info.value}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card className="p-6" style={{ background: 'linear-gradient(135deg, #F6F9FC 0%, #E6EBF1 100%)', borderColor: '#00D4AA40' }}>
                <div className="space-y-2">
                  <div className="text-2xl font-bold" style={{ color: '#0A2540' }}>{t.marketing.contact.responseTime}</div>
                  <p className="text-sm" style={{ color: '#425466' }}>
                    {t.marketing.contact.responseTimeDesc}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
