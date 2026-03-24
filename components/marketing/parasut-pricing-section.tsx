'use client'

import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/hooks/use-currency'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Package,
  ShoppingCart,
  FileCheck,
  Headphones,
  Zap,
  Settings2,
  Factory,
  TrendingUp,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import {
  getBaseModules,
  getAlaCarteModules,
  MODULE_CATEGORIES,
  MARKETPLACE_BUNDLE,
  type PricingModule,
  type ModuleCategory,
} from '@/lib/pricing-configurator-data'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  LayoutDashboard: Zap,
  Settings2,
  Factory,
  TrendingUp,
  Brain: Sparkles,
  ShoppingCart,
  FileCheck,
  Headphones,
}

const HIGHLIGHT_ADDONS: {
  id: string
  category: ModuleCategory
  labelTr: string
  labelEn: string
  priceTRY: number
  priceUSD: number
}[] = [
  { id: 'orders', category: 'operational', labelTr: 'Siparişler', labelEn: 'Orders', priceTRY: 149, priceUSD: 9 },
  { id: 'warehouse', category: 'operational', labelTr: 'Depo & Stok', labelEn: 'Warehouse', priceTRY: 199, priceUSD: 12 },
  { id: 'manufacturing', category: 'production', labelTr: 'Üretim', labelEn: 'Manufacturing', priceTRY: 299, priceUSD: 18 },
  { id: 'projects', category: 'sales_marketing', labelTr: 'Proje Yönetimi', labelEn: 'Projects', priceTRY: 149, priceUSD: 9 },
  { id: 'quotes', category: 'sales_marketing', labelTr: 'Teklifler', labelEn: 'Quotes', priceTRY: 99, priceUSD: 6 },
  { id: 'ai_global_chatbot', category: 'ai', labelTr: 'AI Chatbot', labelEn: 'AI Chatbot', priceTRY: 199, priceUSD: 12 },
]

export function ModulusPricingSection() {
  const { language } = useLanguage()
  const { currency, formatCurrency } = useCurrency()

  const baseModules = getBaseModules()
  const alaCarteCount = getAlaCarteModules().length

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-emerald-500 text-white px-4 py-1.5">
            {language === 'en' ? 'Modular Pricing' : 'Modüler Fiyatlandırma'}
          </Badge>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4" style={{ color: '#1a202c' }}>
            {language === 'en'
              ? 'Pay Only for What You Need'
              : 'Sadece İhtiyacınız Olana Ödeyin'}
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            {language === 'en'
              ? 'Start free with the essentials. Add powerful modules as your business grows.'
              : 'Temel özelliklerle ücretsiz başlayın. İşiniz büyüdükçe modül ekleyin.'}
          </p>
          <p className="mt-2 text-sm text-gray-500 max-w-3xl mx-auto">
            {language === 'en'
              ? '14-day free trial · No credit card required · Cancel anytime'
              : '14 gün ücretsiz deneme · Kredi kartı gerekmez · İstediğiniz zaman iptal'}
          </p>
        </div>

        {/* Base Package Card */}
        <div className="max-w-3xl mx-auto mb-12">
          <Card className="relative overflow-hidden border-2 border-emerald-500 shadow-2xl bg-gradient-to-br from-emerald-50 to-white">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">
                        {language === 'en' ? 'Base Package' : 'Temel Paket'}
                      </h3>
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs mt-0.5">
                        {language === 'en' ? 'Always included' : 'Her zaman dahil'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 max-w-md">
                    {language === 'en'
                      ? 'Everything you need to get started. Includes 1 user, email support, and essential business tools.'
                      : 'Başlamak için ihtiyacınız olan her şey. 1 kullanıcı, e-posta desteği ve temel iş araçları dahil.'}
                  </p>
                </div>
                <div className="text-center lg:text-right flex-shrink-0">
                  <div className="text-4xl font-extrabold text-emerald-600">
                    {language === 'en' ? 'Free' : 'Ücretsiz'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'en' ? 'to get started' : 'başlamak için'}
                  </p>
                </div>
              </div>

              {/* Base features grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {baseModules.map((mod) => (
                  <div key={mod.id} className="flex items-center gap-2.5 rounded-lg bg-white/80 border border-gray-100 px-3 py-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700">
                      {language === 'en' ? mod.labelEn : mod.labelTr}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2.5 rounded-lg bg-white/80 border border-gray-100 px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700">
                    {language === 'en' ? '1 User included' : '1 Kullanıcı dahil'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg bg-white/80 border border-gray-100 px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700">
                    {language === 'en' ? 'Email support' : 'E-posta desteği'}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link href="/login" className="flex-1">
                  <Button
                    size="lg"
                    className="w-full h-12 text-sm font-bold shadow-lg"
                    style={{ backgroundColor: '#0A2540', color: '#ffffff' }}
                  >
                    {language === 'en' ? 'Start Free — No Card Needed' : 'Ücretsiz Başla — Kart Gerekmez'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Add-on Modules Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2" style={{ color: '#1a202c' }}>
              {language === 'en'
                ? 'Grow with Add-on Modules'
                : 'Ek Modüllerle Büyüyün'}
            </h3>
            <p className="text-sm text-gray-500">
              {language === 'en'
                ? `${alaCarteCount}+ modules available. Here are the most popular ones.`
                : `${alaCarteCount}+ modül mevcut. İşte en popüler olanlar.`}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {HIGHLIGHT_ADDONS.map((addon) => {
              const p = currency === 'TRY' ? addon.priceTRY : addon.priceUSD
              return (
                <Card
                  key={addon.id}
                  className="p-5 border-2 border-gray-200 hover:border-emerald-300 bg-white hover:shadow-lg transition-all duration-200 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-sm">
                      {language === 'en' ? addon.labelEn : addon.labelTr}
                    </h4>
                    <Badge variant="outline" className="text-[10px] px-1.5 flex-shrink-0">
                      {language === 'en' ? 'Add-on' : 'Ek modül'}
                    </Badge>
                  </div>
                  <div className="mt-auto pt-3">
                    <span className="text-xl font-extrabold">
                      {formatCurrency(p)}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      /{language === 'en' ? 'mo' : 'ay'}
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* AI & Marketplace highlights */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto mt-4">
            {/* AI Bot Highlight */}
            <Card className="p-5 border-2 border-violet-200 bg-violet-50/50 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-violet-500 text-white flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">
                    {language === 'en' ? 'AI Bots for Every Module' : 'Her Modül İçin AI Bot'}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {language === 'en'
                      ? 'Add AI intelligence to any active module'
                      : 'Aktif her modüle AI zekası ekleyin'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-violet-700 font-medium">
                {language === 'en'
                  ? `from ${formatCurrency(currency === 'TRY' ? 49 : 3)}/module/mo`
                  : `${formatCurrency(currency === 'TRY' ? 49 : 3)}/modül/ay'dan başlayan`}
              </p>
            </Card>

            {/* Marketplace Highlight */}
            <Card className="p-5 border-2 border-orange-200 bg-orange-50/50 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">
                    {language === 'en' ? 'Marketplace Integrations' : 'Pazaryeri Entegrasyonları'}
                  </h4>
                  <p className="text-xs text-gray-500">
                    Amazon + Hepsiburada + Trendyol
                  </p>
                </div>
              </div>
              <p className="text-sm text-orange-700 font-medium">
                {formatCurrency(currency === 'TRY' ? MARKETPLACE_BUNDLE.monthlyPriceTRY : MARKETPLACE_BUNDLE.monthlyPriceUSD)}
                /{language === 'en' ? 'mo' : 'ay'}
              </p>
            </Card>
          </div>

          {/* E-Invoice badge */}
          <div className="max-w-4xl mx-auto mt-4">
            <Card className="p-4 border-2 border-green-200 bg-green-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCheck className="h-5 w-5 text-green-600" />
                <div>
                  <span className="font-bold text-sm">
                    {language === 'en' ? 'E-Invoice Integration' : 'E-Fatura Entegrasyonu'}
                  </span>
                  <Badge className="ml-2 bg-green-600 text-white text-[10px]">
                    {language === 'en' ? 'Free' : 'Ücretsiz'}
                  </Badge>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {language === 'en' ? 'Credit packs available' : 'Kredi paketleri mevcut'}
              </span>
            </Card>
          </div>
        </div>

        {/* CTA: Build Your Plan */}
        <div className="text-center">
          <Link href="/pricing">
            <Button
              size="lg"
              className="gap-2 shadow-2xl rounded-full font-semibold transition-all duration-300 hover:scale-105 h-14 px-10 text-base"
              style={{ backgroundColor: '#0A2540', color: '#00D4AA' }}
            >
              <Plus className="h-5 w-5" />
              {language === 'en' ? 'Build Your Custom Plan' : 'Özel Planınızı Oluşturun'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="mt-3 text-xs text-gray-400">
            {language === 'en'
              ? 'Use our configurator to select modules and see live pricing'
              : 'Modül seçip canlı fiyat görmek için yapılandırıcıyı kullanın'}
          </p>
        </div>
      </div>
    </section>
  )
}
