'use client'

import { useLanguage } from '@/contexts/language-context'
import { useSiteConfig } from '@/contexts/site-config-context'
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
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import {
  getBaseModules,
  getAlaCarteModules,
  MARKETPLACE_BUNDLE,
  EINVOICE_CREDIT_PACKS,
} from '@/lib/pricing-configurator-data'

const HIGHLIGHT_ADDONS = [
  { id: 'orders', labelTr: 'Siparişler', labelEn: 'Orders', priceTRY: 149, priceUSD: 9 },
  { id: 'warehouse', labelTr: 'Depo & Stok', labelEn: 'Warehouse', priceTRY: 199, priceUSD: 12 },
  { id: 'manufacturing', labelTr: 'Üretim', labelEn: 'Manufacturing', priceTRY: 299, priceUSD: 18 },
  { id: 'projects', labelTr: 'Proje Yönetimi', labelEn: 'Projects', priceTRY: 149, priceUSD: 9 },
  { id: 'quotes', labelTr: 'Teklifler', labelEn: 'Quotes', priceTRY: 99, priceUSD: 6 },
  { id: 'ai_global_chatbot', labelTr: 'AI Chatbot', labelEn: 'AI Chatbot', priceTRY: 199, priceUSD: 12 },
]

export function PricingSection() {
  const { t, language } = useLanguage()
  const { config } = useSiteConfig()
  const { currency, formatCurrency } = useCurrency()

  const baseModules = getBaseModules()
  const alaCarteCount = getAlaCarteModules().length

  return (
    <section id="pricing" className="section-spacing">
      <div className="container-marketing">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              {language === 'en' ? 'Modular Pricing' : 'Modüler Fiyatlandırma'}
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            {language === 'en'
              ? 'Pay Only for What You Need'
              : 'Sadece İhtiyacınız Olana Ödeyin'}
          </h2>
          <p className="text-lg text-auto-contrast-muted-light max-w-2xl mx-auto">
            {language === 'en'
              ? 'Start free with essentials. Add modules as your business grows.'
              : 'Temel özelliklerle ücretsiz başlayın. İşiniz büyüdükçe modül ekleyin.'}
          </p>
        </div>

        {/* Base Package */}
        <div className="max-w-3xl mx-auto mb-12">
          <Card className="relative overflow-hidden border-2 border-emerald-500 shadow-xl bg-gradient-to-br from-emerald-50 to-white">
            <div className="p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {language === 'en' ? 'Base Package' : 'Temel Paket'}
                    </h3>
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                      {language === 'en' ? 'Always included' : 'Her zaman dahil'}
                    </Badge>
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-emerald-600">
                  {language === 'en' ? 'Free' : 'Ücretsiz'}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5 mb-6">
                {baseModules.map((mod) => (
                  <div key={mod.id} className="flex items-center gap-2 rounded-lg bg-white/70 border border-gray-100 px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-auto-contrast-muted-light">
                      {language === 'en' ? mod.labelEn : mod.labelTr}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2 rounded-lg bg-white/70 border border-gray-100 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-auto-contrast-muted-light">
                    {language === 'en' ? '1 User + Email Support' : '1 Kullanıcı + E-posta Destek'}
                  </span>
                </div>
              </div>

              <Link href="/login" className="block">
                <Button className="w-full sm:w-auto h-11 px-8 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg">
                  {language === 'en' ? 'Start Free' : 'Ücretsiz Başla'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Add-on Grid */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold mb-1">
              {language === 'en' ? 'Popular Add-on Modules' : 'Popüler Ek Modüller'}
            </h3>
            <p className="text-xs text-auto-contrast-muted-light">
              {language === 'en'
                ? `${alaCarteCount}+ modules available`
                : `${alaCarteCount}+ modül mevcut`}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {HIGHLIGHT_ADDONS.map((addon) => {
              const p = currency === 'TRY' ? addon.priceTRY : addon.priceUSD
              return (
                <Card key={addon.id} className="p-4 border hover:border-gray-300 bg-white transition-all flex items-center justify-between">
                  <span className="font-semibold text-sm">
                    {language === 'en' ? addon.labelEn : addon.labelTr}
                  </span>
                  <span className="text-sm font-bold">
                    {formatCurrency(p)}
                    <span className="text-xs font-normal text-auto-contrast-muted-light">/{language === 'en' ? 'mo' : 'ay'}</span>
                  </span>
                </Card>
              )
            })}
          </div>

          {/* AI + Marketplace + E-Invoice row */}
          <div className="grid sm:grid-cols-3 gap-3 max-w-4xl mx-auto mt-3">
            <Card className="p-3 border-2 border-violet-200 bg-violet-50/50 text-center">
              <Sparkles className="h-4 w-4 text-violet-500 mx-auto mb-1" />
              <p className="text-xs font-bold">{language === 'en' ? 'AI Bots' : 'AI Botlar'}</p>
              <p className="text-[10px] text-gray-500">
                {formatCurrency(currency === 'TRY' ? 49 : 3)}/{language === 'en' ? 'module' : 'modül'}
              </p>
            </Card>
            <Card className="p-3 border-2 border-orange-200 bg-orange-50/50 text-center">
              <ShoppingCart className="h-4 w-4 text-orange-500 mx-auto mb-1" />
              <p className="text-xs font-bold">{language === 'en' ? 'Marketplace' : 'Pazaryeri'}</p>
              <p className="text-[10px] text-gray-500">
                {formatCurrency(currency === 'TRY' ? MARKETPLACE_BUNDLE.monthlyPriceTRY : MARKETPLACE_BUNDLE.monthlyPriceUSD)}/{language === 'en' ? 'mo' : 'ay'}
              </p>
            </Card>
            <Card className="p-3 border-2 border-green-200 bg-green-50/50 text-center">
              <FileCheck className="h-4 w-4 text-green-600 mx-auto mb-1" />
              <p className="text-xs font-bold">{language === 'en' ? 'E-Invoice' : 'E-Fatura'}</p>
              <Badge className="bg-green-600 text-white text-[9px] mt-0.5">-%15</Badge>
            </Card>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto mt-3">
            {EINVOICE_CREDIT_PACKS.map((pack) => (
              <Link key={pack.id} href={`/pricing?creditPack=${pack.id}`} className="block">
                <Card className="p-3 border hover:border-green-300 bg-white transition-all">
                  <p className="text-xs font-semibold">{pack.qty.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')} e‑Kontör</p>
                  <p className="text-[10px] text-gray-400 line-through">{formatCurrency(pack.listPriceTRY ?? pack.priceTRY)}</p>
                  <p className="text-sm font-bold text-green-700">{formatCurrency(pack.priceTRY)} + KDV</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/pricing">
            <Button
              size="lg"
              className="gap-2 shadow-2xl rounded-full font-semibold transition-all duration-300 hover:scale-105 h-12 px-8"
              style={{ backgroundColor: '#0A2540', color: '#00D4AA' }}
            >
              <Plus className="h-4 w-4" />
              {language === 'en' ? 'Build Your Custom Plan' : 'Özel Planınızı Oluşturun'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
