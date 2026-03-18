'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/language-context'
import { MarketingLayout } from '@/components/marketing/marketing-layout'
import { PricingPlans } from './pricing-plans'
import { ComparisonMatrix } from './comparison-matrix'
import { AddonShop } from './addon-shop'
import { TrustBadges } from './trust-badges'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function WorldClassPricing() {
  const { t, language } = useLanguage()
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="pt-20 pb-12 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="container-marketing">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4" variant="outline">
              {language === 'en' ? '🚀 World-Class Pricing' : '🚀 Dünya Standartlarında Fiyatlandırma'}
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              {language === 'en'
                ? 'Simple, Transparent Pricing That Grows With You'
                : 'Sizinle Büyüyen Basit, Şeffaf Fiyatlandırma'
              }
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {language === 'en'
                ? 'Start with a 14-day free trial. No credit card required. Cancel anytime.'
                : '14 günlük ücretsiz deneme ile başlayın. Kredi kartı gerekmez. İstediğiniz zaman iptal edin.'
              }
            </p>
            <p className="text-sm text-muted-foreground">
              {language === 'en'
                ? 'Prices shown are exclusive of VAT.'
                : 'Gösterilen fiyatlar KDV hariçtir.'}
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>{language === 'en' ? 'No Credit Card Required' : 'Kredi Kartı Gerekmez'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>{language === 'en' ? '14-Day Free Trial' : '14 Günlük Ücretsiz Deneme'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>{language === 'en' ? 'Cancel Anytime' : 'İstediğiniz Zaman İptal'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>{language === 'en' ? 'Money-Back Guarantee' : 'Para İade Garantisi'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16">
        <PricingPlans selectedAddons={selectedAddons} />
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-gray-50">
        <div className="container-marketing">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              {language === 'en'
                ? 'Built on Rock-Solid Technology'
                : 'Sağlam Teknoloji Üzerine İnşa Edildi'
              }
            </h2>
            <p className="text-muted-foreground">
              {language === 'en'
                ? 'Enterprise-grade infrastructure powering your business'
                : 'İşletmenizi güçlendiren kurumsal düzeyde altyapı'
              }
            </p>
          </div>
          <TrustBadges />
        </div>
      </section>

      {/* Add-on Shop */}
      <section className="py-16">
        <div className="container-marketing">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">
              {language === 'en' ? '🎯 Customize Your Plan' : '🎯 Planınızı Özelleştirin'}
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {language === 'en'
                ? 'Power Up With Premium Add-ons'
                : 'Premium Eklentilerle Güçlendirin'
              }
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {language === 'en'
                ? 'Select the add-ons you need and see your total price update instantly'
                : 'İhtiyacınız olan eklentileri seçin ve toplam fiyatınızın anında güncellenmesini görün'
              }
            </p>
          </div>
          <AddonShop
            selectedAddons={selectedAddons}
            onAddonsChange={setSelectedAddons}
          />
        </div>
      </section>

      {/* Comparison Matrix */}
      <section className="py-16 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="container-marketing">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline">
              {language === 'en' ? '⚡ Why Choose Modulus?' : '⚡ Neden Modulus?'}
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {language === 'en'
                ? 'How We Stack Up Against Competitors'
                : 'Rakiplere Karşı Nasıl Öne Çıkıyoruz'
              }
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {language === 'en'
                ? 'See why leading businesses choose Modulus over İşbaşı and BizimHesap'
                : 'Önde gelen işletmeler neden İşbaşı ve BizimHesap yerine Modulus\'u seçiyor'
              }
            </p>
          </div>
          <ComparisonMatrix />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container-marketing text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            {language === 'en'
              ? 'Ready to Transform Your Business?'
              : 'İşletmenizi Dönüştürmeye Hazır mısınız?'
            }
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {language === 'en'
              ? 'Join thousands of businesses already using Modulus ERP to streamline operations and drive growth.'
              : 'Operasyonlarını kolaylaştırmak ve büyümeyi artırmak için Modulus ERP kullanan binlerce işletmeye katılın.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6">
                {language === 'en' ? 'Start 14-Day Free Trial' : '14 Günlük Ücretsiz Deneme Başlat'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                {language === 'en' ? 'Talk to Sales' : 'Satış Ekibiyle Konuş'}
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-200">
            {language === 'en'
              ? 'No credit card required • Cancel anytime • 30-day money-back guarantee'
              : 'Kredi kartı gerekmez • İstediğiniz zaman iptal • 30 günlük para iade garantisi'
            }
          </p>
        </div>
      </section>
    </MarketingLayout>
  )
}
