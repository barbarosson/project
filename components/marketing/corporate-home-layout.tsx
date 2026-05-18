'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  CalendarClock,
  MessageSquareHeart,
  Shield,
  Sparkles,
  Layers,
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { getCorporateCopy } from '@/lib/corporate-marketing-copy'
import { MarketingHeader } from './marketing-header'
import { ModulusFooter } from './parasut-footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const CONTAINER = 'mx-auto px-6 sm:px-8 max-w-[1280px]'

export function CorporateHomeLayout() {
  const { language } = useLanguage()
  const c = getCorporateCopy(language)

  const productCards = [
    {
      key: 'erp',
      href: '/products/modulus-erp',
      icon: Building2,
      accent: '#00D4AA',
      bg: 'linear-gradient(135deg, #F6F9FC 0%, #E8F8F4 100%)',
      ...c.products.erp,
    },
    {
      key: 'appointflow',
      href: '/products/appointflow',
      icon: CalendarClock,
      accent: '#0A2540',
      bg: 'linear-gradient(135deg, #F6F9FC 0%, #E8EEF8 100%)',
      ...c.products.appointflow,
    },
    {
      key: 'isendai',
      href: '/products/isendai',
      icon: MessageSquareHeart,
      accent: '#8B5CF6',
      bg: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
      ...c.products.isendai,
    },
  ] as const

  const whyItems = [
    { icon: Layers, ...c.why.items[0] },
    { icon: Sparkles, ...c.why.items[1] },
    { icon: Shield, ...c.why.items[2] },
  ]

  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />
      <main className="pt-[80px]">
        <section
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F6F9FC 55%, #FFFFFF 100%)',
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, #00D4AA 0%, transparent 70%)' }}
          />
          <div className={`${CONTAINER} py-20 lg:py-28`}>
            <p
              className="text-sm font-semibold uppercase tracking-[0.14em] mb-4"
              style={{ color: '#425466' }}
            >
              {c.hero.company}
            </p>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 max-w-4xl"
              style={{ color: '#0A2540' }}
            >
              <span className="block text-[#00D4AA] mb-2">{c.hero.brand}</span>
              {c.hero.title}
            </h1>
            <p
              className="text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed"
              style={{ color: '#425466' }}
            >
              {c.hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="#products">
                <Button
                  size="lg"
                  className="rounded-full px-8 text-base font-semibold"
                  style={{ backgroundColor: '#0A2540', color: '#fff' }}
                >
                  {c.hero.ctaProducts}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 text-base font-semibold border-[#00D4AA] text-[#0A2540] hover:bg-[#00D4AA]/10"
                >
                  {c.hero.ctaContact}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="products" className="py-20 lg:py-24 bg-white">
          <div className={CONTAINER}>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] mb-3 text-[#00D4AA]">
              {c.products.eyebrow}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A2540] mb-4 max-w-2xl">
              {c.products.title}
            </h2>
            <p className="text-lg text-[#425466] mb-12 max-w-2xl">{c.products.subtitle}</p>

            <div className="grid md:grid-cols-3 gap-8">
              {productCards.map((card) => {
                const Icon = card.icon
                return (
                  <Card
                    key={card.key}
                    className="border-0 shadow-lg overflow-hidden h-full flex flex-col"
                    style={{ background: card.bg }}
                  >
                    <div className="p-8 flex flex-col flex-1">
                      <div
                        className="inline-flex h-14 w-14 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${card.accent}18` }}
                      >
                        <Icon className="h-7 w-7" style={{ color: card.accent }} />
                      </div>
                      <p
                        className="text-xs font-bold uppercase tracking-wider mt-6 mb-1"
                        style={{ color: card.accent }}
                      >
                        {card.tagline}
                      </p>
                      <h3 className="text-2xl font-bold text-[#0A2540] mb-3">{card.name}</h3>
                      <p className="text-[#425466] leading-relaxed flex-1 mb-8">{card.description}</p>
                      <Link
                        href={card.href}
                        className="inline-flex items-center font-semibold text-[#0A2540] hover:opacity-80"
                      >
                        {c.products.learnMore}
                        <ArrowRight className="ml-2 h-4 w-4" style={{ color: card.accent }} />
                      </Link>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        <section id="solutions" className="py-20 lg:py-24" style={{ backgroundColor: '#F6F9FC' }}>
          <div className={CONTAINER}>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] mb-3 text-[#00D4AA]">
              {c.why.eyebrow}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A2540] mb-12 max-w-2xl">{c.why.title}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {whyItems.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl bg-white p-8 shadow-sm border border-[#E6EBF1]"
                  >
                    <Icon className="h-8 w-8 text-[#00D4AA] mb-5" />
                    <h3 className="text-xl font-bold text-[#0A2540] mb-3">{item.title}</h3>
                    <p className="text-[#425466] leading-relaxed">{item.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-24">
          <div className={CONTAINER}>
            <div
              className="rounded-3xl px-8 py-14 sm:px-12 text-center"
              style={{
                background: 'linear-gradient(135deg, #0A2540 0%, #1a4a6e 50%, #0A2540 100%)',
              }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{c.cta.title}</h2>
              <p className="text-lg text-white/75 mb-10 max-w-xl mx-auto">{c.cta.subtitle}</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/contact">
                  <Button
                    size="lg"
                    className="rounded-full px-8 bg-[#00D4AA] text-[#0A2540] hover:bg-[#00D4AA]/90 font-semibold"
                  >
                    {c.cta.contact}
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8 border-white/30 text-white hover:bg-white/10 font-semibold"
                  >
                    {c.cta.erpLogin}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <ModulusFooter />
    </div>
  )
}
