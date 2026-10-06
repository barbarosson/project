'use client'

import Link from 'next/link'
import { ArrowRight, Check, ExternalLink, Github } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { getCorporateCopy } from '@/lib/corporate-marketing-copy'
import { DIGITAL_LEGACY_LINKS } from '@/lib/digital-legacy-links'
import { MarketingLayout } from './marketing-layout'
import { ProductMenuIcon } from './product-menu-icons'
import { Button } from '@/components/ui/button'

const ACCENT = '#B45309'
const external = { target: '_blank' as const, rel: 'noopener noreferrer' }

export function DigitalLegacyProductContent() {
  const { language } = useLanguage()
  const p = getCorporateCopy(language).digitalLegacyPage
  const product = getCorporateCopy(language).products.digitalLegacy
  const details = getCorporateCopy(language).details.digitalLegacy

  return (
    <MarketingLayout>
      <section
        className="pt-32 pb-16 lg:pt-40 lg:pb-24 relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F6F9FC 55%, #FFFFFF 100%)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }}
        />
        <div className="container-marketing relative">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-[#425466] hover:text-[#0A2540] mb-8"
          >
            {p.backToModulus}
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-6">
            <ProductMenuIcon product="digitalLegacy" size={72} />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: ACCENT }}>
                {product.tagline}
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2540]">{product.name}</h1>
              <p className="mt-2 text-sm font-semibold text-[#425466]">
                {p.links.publisher}: {DIGITAL_LEGACY_LINKS.publisher}
              </p>
            </div>
          </div>

          <p className="text-sm font-semibold uppercase tracking-wide text-[#425466]">{p.hero.kicker}</p>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2540] max-w-4xl">
            {p.hero.title}
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-[#425466] leading-relaxed">{p.hero.subtitle}</p>

          <ul className="mt-8 max-w-2xl space-y-3">
            {p.hero.taglines.map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${ACCENT}20` }}
                >
                  <Check className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                </span>
                <span className="text-base font-semibold leading-snug text-[#0A2540] sm:text-lg">{line}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={DIGITAL_LEGACY_LINKS.microsoftStore}
              {...external}
              className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-base font-semibold text-white shadow-md hover:opacity-95"
              style={{ backgroundColor: '#0A2540' }}
            >
              {p.hero.cta}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={DIGITAL_LEGACY_LINKS.privacy}
              {...external}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E6EBF1] px-8 py-3 text-base font-semibold text-[#0A2540] hover:bg-[#F6F9FC]"
            >
              {p.links.privacy}
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href={DIGITAL_LEGACY_LINKS.github}
              {...external}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E6EBF1] px-8 py-3 text-base font-semibold text-[#0A2540] hover:bg-[#F6F9FC]"
            >
              <Github className="h-4 w-4" />
              {p.links.github}
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-white">
        <div className="container-marketing">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0A2540]">{p.features.title}</h2>
          <p className="mt-4 max-w-3xl text-lg text-[#425466]">{p.features.subtitle}</p>
          <p className="mt-6 max-w-3xl text-base sm:text-lg text-[#425466] leading-relaxed">{details.summary}</p>
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-[#FAFBFC] p-4 sm:p-6">
            {details.highlights.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${ACCENT}20` }}
                >
                  <Check className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                </span>
                <span className="text-[#425466] leading-relaxed text-sm sm:text-base">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-[#F6F9FC]">
        <div className="container-marketing">
          <div
            className="rounded-3xl px-6 py-12 sm:px-12 sm:py-14 text-center"
            style={{
              background: 'linear-gradient(135deg, #0A2540 0%, #1a4a6e 50%, #0A2540 100%)',
            }}
          >
            <div className="flex justify-center">
              <ProductMenuIcon product="digitalLegacy" size={56} />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mt-6 mb-4">{p.primaryCta}</h2>
            <p className="text-base sm:text-lg text-white/75 mb-10 max-w-xl mx-auto px-2">{product.description}</p>
            <a href={DIGITAL_LEGACY_LINKS.microsoftStore} {...external} className="inline-flex">
              <Button
                size="lg"
                className="rounded-full px-8 bg-white text-[#0A2540] hover:bg-[#F6F9FC] font-semibold shadow-md"
              >
                {p.hero.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <p className="mt-8 text-xs text-white/60 sm:text-sm">{p.trust}</p>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
