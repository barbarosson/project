'use client'

import { useLanguage } from '@/contexts/language-context'
import { MarketingLayout } from '@/components/marketing/marketing-layout'
import { PricingConfigurator } from '@/components/pricing/pricing-configurator'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'

export function PricingPageClient() {
  const { language } = useLanguage()

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="pt-20 pb-12 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-4xl mx-auto text-center px-6">
          <Badge className="mb-4 bg-emerald-500 text-white px-4 py-1.5">
            {language === 'en' ? 'Build Your Plan' : 'Planınızı Oluşturun'}
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: '#1a202c' }}>
            {language === 'en'
              ? 'Pay Only for What You Need'
              : 'Sadece İhtiyacınız Olana Ödeyin'}
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            {language === 'en'
              ? 'Start with the essentials and add modules as your business grows. No hidden fees.'
              : 'Temel özelliklerle başlayın, işiniz büyüdükçe modül ekleyin. Gizli ücret yok.'}
          </p>
          <div className="flex flex-wrap justify-center gap-5 text-sm text-gray-500">
            {[
              { tr: 'Kredi Kartı Gerekmez', en: 'No Credit Card Required' },
              { tr: '14 Gün Ücretsiz Deneme', en: '14-Day Free Trial' },
              { tr: 'İstediğiniz Zaman İptal', en: 'Cancel Anytime' },
              { tr: 'Para İade Garantisi', en: 'Money-Back Guarantee' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{language === 'en' ? item.en : item.tr}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Configurator */}
      <section className="py-12 bg-gray-50/50">
        <PricingConfigurator />
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-[#0A2540] to-[#1a3a5c] text-white">
        <div className="max-w-3xl mx-auto text-center px-6">
          <h2 className="text-3xl font-bold mb-3">
            {language === 'en'
              ? 'Ready to Transform Your Business?'
              : 'İşletmenizi Dönüştürmeye Hazır mısınız?'}
          </h2>
          <p className="text-white/70 mb-6">
            {language === 'en'
              ? 'Join growing businesses already using Modulus ERP.'
              : 'Modulus ERP kullanan büyüyen işletmelere katılın.'}
          </p>
          <p className="text-xs text-white/40">
            {language === 'en'
              ? 'No credit card required · Cancel anytime'
              : 'Kredi kartı gerekmez · İstediğiniz zaman iptal'}
          </p>
        </div>
      </section>
    </MarketingLayout>
  )
}
