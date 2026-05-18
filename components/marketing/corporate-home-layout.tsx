'use client'

import Link from 'next/link'
import { ArrowRight, Building2, CalendarClock, Check, MessageSquareHeart, type LucideIcon } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { getCorporateCopy } from '@/lib/corporate-marketing-copy'
import {
  CORPORATE_PRODUCT_AVAILABLE,
  CORPORATE_PRODUCT_HREFS,
  CORPORATE_PRODUCT_ORDER,
  type CorporateProductKey,
} from '@/lib/corporate-products'
import { MarketingHeader } from './marketing-header'
import { ModulusFooter } from './parasut-footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const CONTAINER = 'mx-auto px-6 sm:px-8 max-w-[1280px]'

const PRODUCT_STYLES: Record<
  CorporateProductKey,
  { icon: LucideIcon; accent: string; bg: string }
> = {
  isendai: {
    icon: MessageSquareHeart,
    accent: '#8B5CF6',
    bg: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
  },
  erp: {
    icon: Building2,
    accent: '#00D4AA',
    bg: 'linear-gradient(135deg, #F6F9FC 0%, #E8F8F4 100%)',
  },
  appointflow: {
    icon: CalendarClock,
    accent: '#0A2540',
    bg: 'linear-gradient(135deg, #F6F9FC 0%, #E8EEF8 100%)',
  },
}

function ComingSoonBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#E6EBF1] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#425466]">
      {label}
    </span>
  )
}

export function CorporateHomeLayout() {
  const { language } = useLanguage()
  const c = getCorporateCopy(language)

  const productCards = CORPORATE_PRODUCT_ORDER.map((key) => {
    const styles = PRODUCT_STYLES[key]
    const available = CORPORATE_PRODUCT_AVAILABLE[key]
    return {
      key,
      href: CORPORATE_PRODUCT_HREFS[key],
      available,
      ...styles,
      ...c.products[key],
    }
  })

  const detailProducts = CORPORATE_PRODUCT_ORDER.map((key) => {
    const styles = PRODUCT_STYLES[key]
    const available = CORPORATE_PRODUCT_AVAILABLE[key]
    return {
      key,
      href: CORPORATE_PRODUCT_HREFS[key],
      available,
      ...styles,
      ...c.details[key],
      ...c.products[key],
    }
  })

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
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 max-w-4xl lg:max-w-5xl"
              style={{ color: '#0A2540' }}
            >
              <span className="block text-[#00D4AA] mb-2">{c.hero.brand}</span>
              {c.hero.title}
            </h1>
            <p
              className="text-lg sm:text-xl max-w-2xl lg:max-w-3xl mb-10 leading-relaxed"
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
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A2540] mb-4 max-w-3xl">
              {c.products.title}
            </h2>
            <p className="text-lg text-[#425466] mb-12 max-w-3xl">{c.products.subtitle}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {productCards.map((card) => {
                const Icon = card.icon
                const cardInner = (
                  <Card
                    className={`border-0 shadow-lg overflow-hidden h-full flex flex-col transition-shadow ${
                      card.available ? 'group-hover:shadow-xl' : 'opacity-[0.92]'
                    }`}
                    style={{ background: card.bg }}
                  >
                    <div className="p-6 sm:p-8 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-3 mb-0">
                        <div
                          className="inline-flex h-14 w-14 items-center justify-center rounded-2xl shrink-0"
                          style={{ backgroundColor: `${card.accent}18` }}
                        >
                          <Icon className="h-7 w-7" style={{ color: card.accent }} />
                        </div>
                        {!card.available && <ComingSoonBadge label={c.products.comingSoon} />}
                      </div>
                      <p
                        className="text-xs font-bold uppercase tracking-wider mt-6 mb-1"
                        style={{ color: card.accent }}
                      >
                        {card.tagline}
                      </p>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#0A2540] mb-3">{card.name}</h3>
                      <p className="text-[#425466] leading-relaxed flex-1 mb-8 text-sm sm:text-base">
                        {card.description}
                      </p>
                      {card.available ? (
                        <span className="inline-flex items-center font-semibold text-[#0A2540] group-hover:opacity-80">
                          {c.products.learnMore}
                          <ArrowRight className="ml-2 h-4 w-4" style={{ color: card.accent }} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center font-semibold text-[#8898AA]">
                          {c.products.comingSoon}
                        </span>
                      )}
                    </div>
                  </Card>
                )

                if (card.available) {
                  return (
                    <Link key={card.key} href={card.href} className="block h-full group">
                      {cardInner}
                    </Link>
                  )
                }

                return (
                  <div key={card.key} className="block h-full" aria-disabled>
                    {cardInner}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section id="solutions" className="py-20 lg:py-24" style={{ backgroundColor: '#F6F9FC' }}>
          <div className={CONTAINER}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-14">
              {c.details.intro.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="text-lg text-[#425466] leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="space-y-6 sm:space-y-8">
              {detailProducts.map((product) => {
                const Icon = product.icon
                return (
                  <article
                    key={product.key}
                    className={`rounded-2xl bg-white border border-[#E6EBF1] shadow-sm overflow-hidden ${
                      !product.available ? 'opacity-[0.94]' : ''
                    }`}
                  >
                    <div className="p-6 sm:p-8 lg:p-10">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4 min-w-0">
                          <div
                            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${product.accent}18` }}
                          >
                            <Icon className="h-6 w-6" style={{ color: product.accent }} />
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-xs font-bold uppercase tracking-wider mb-1"
                              style={{ color: product.accent }}
                            >
                              {product.tagline}
                            </p>
                            <h3 className="text-xl sm:text-2xl font-bold text-[#0A2540]">{product.name}</h3>
                          </div>
                        </div>
                        {!product.available && (
                          <ComingSoonBadge label={c.products.comingSoon} />
                        )}
                      </div>
                      <p className="text-[#425466] leading-relaxed text-base sm:text-lg mb-6 sm:mb-8">
                        {product.summary}
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 rounded-xl bg-[#FAFBFC] p-4 sm:p-6">
                        {product.highlights.map((item) => (
                          <li key={item} className="flex items-start gap-3">
                            <span
                              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                              style={{ backgroundColor: `${product.accent}20` }}
                            >
                              <Check className="h-3.5 w-3.5" style={{ color: product.accent }} />
                            </span>
                            <span className="text-[#425466] leading-relaxed text-sm sm:text-base">{item}</span>
                          </li>
                        ))}
                      </ul>
                      {product.available ? (
                        <Link
                          href={product.href}
                          className="inline-flex items-center font-semibold text-[#0A2540] hover:opacity-80"
                        >
                          {c.products.learnMore}
                          <ArrowRight className="ml-2 h-4 w-4" style={{ color: product.accent }} />
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold text-[#8898AA]">{c.products.comingSoon}</p>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-24">
          <div className={CONTAINER}>
            <div
              className="rounded-3xl px-6 py-12 sm:px-12 sm:py-14 text-center"
              style={{
                background: 'linear-gradient(135deg, #0A2540 0%, #1a4a6e 50%, #0A2540 100%)',
              }}
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">{c.cta.title}</h2>
              <p className="text-base sm:text-lg text-white/75 mb-10 max-w-xl mx-auto px-2">{c.cta.subtitle}</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/contact">
                  <Button
                    size="lg"
                    className="rounded-full px-8 bg-white text-[#0A2540] hover:bg-[#F6F9FC] font-semibold shadow-md"
                  >
                    {c.cta.contact}
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
