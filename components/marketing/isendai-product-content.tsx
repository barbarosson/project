'use client'

import Link from 'next/link'
import { ArrowRight, Check, MoveRight, Sparkles } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { getCorporateCopy } from '@/lib/corporate-marketing-copy'
import {
  ISENDAI_ACCENT,
  isendaiBody,
  isendaiCard,
  isendaiHeading,
  isendaiKicker,
  isendaiMutedSection,
  isendaiOutlineBtn,
  isendaiPageSection,
  isendaiPrimaryBtn,
  isendaiSectionCard,
} from '@/lib/isendai-product-styles'
import { cn } from '@/lib/utils'
import { MarketingLayout } from './marketing-layout'
import { ProductMenuIcon } from './product-menu-icons'
import { Button } from '@/components/ui/button'
import { getIsendaiAppUrl, isendaiAppLinkProps } from '@/lib/isendai-app-url'

export function IsendaiProductContent() {
  const { language } = useLanguage()
  const p = getCorporateCopy(language).isendaiPage
  const product = getCorporateCopy(language).products.isendai
  const isendaiAppUrl = getIsendaiAppUrl()
  const appLink = isendaiAppLinkProps(isendaiAppUrl)

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
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
        />
        <div className="container-marketing relative">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-[#425466] hover:text-[#0A2540] mb-8"
          >
            {p.backToModulus}
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-6">
            <ProductMenuIcon product="isendai" size={72} />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: ISENDAI_ACCENT }}>
                {product.tagline}
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A2540]">{product.name}</h1>
            </div>
          </div>

          <p className={isendaiKicker}>
            <Sparkles className="size-4 shrink-0" style={{ color: ISENDAI_ACCENT }} aria-hidden />
            {p.hero.kicker}
          </p>
          <h2 className={cn('mt-4 text-3xl sm:text-4xl lg:text-5xl max-w-4xl', isendaiHeading)}>
            {p.hero.title}
          </h2>
          <p className={cn('mt-4 max-w-3xl', isendaiBody)}>{p.hero.subtitle}</p>

          <ul className="mt-8 max-w-2xl space-y-3">
            {p.hero.taglines.map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${ISENDAI_ACCENT}20` }}
                >
                  <Check className="h-3.5 w-3.5" style={{ color: ISENDAI_ACCENT }} />
                </span>
                <span className="text-base font-semibold leading-snug text-[#0A2540] sm:text-lg">
                  {line}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={isendaiAppUrl}
              {...appLink}
              className={isendaiPrimaryBtn}
              style={{ backgroundColor: '#0A2540' }}
            >
              {p.hero.cta}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href={`${isendaiAppUrl}/pricing`} {...appLink} className={isendaiOutlineBtn}>
              {language === 'tr' ? 'Paketler & fiyat' : 'Plans & pricing'}
            </a>
          </div>
        </div>
      </section>

      <section className={cn(isendaiPageSection, 'bg-white')}>
        <div className="container-marketing">
          <div className={isendaiSectionCard}>
            <h2 className={cn('text-2xl sm:text-3xl lg:text-4xl', isendaiHeading)}>{p.aiStack.title}</h2>
            <p className={cn('mt-4 max-w-4xl', isendaiBody)}>{p.aiStack.body}</p>
          </div>
        </div>
      </section>

      <section className={cn(isendaiPageSection, isendaiMutedSection)}>
        <div className="container-marketing">
          <div className={isendaiSectionCard}>
            <p className={isendaiKicker}>
              <Sparkles className="size-3.5" style={{ color: ISENDAI_ACCENT }} aria-hidden />
              {p.demo.before} → {p.demo.after}
            </p>
            <h2 className={cn('mt-4 text-2xl sm:text-3xl lg:text-4xl', isendaiHeading)}>{p.demo.title}</h2>
            <p className={cn('mt-4', isendaiBody)}>{p.demo.subtitle}</p>

            <div className="mt-8 grid min-w-0 gap-5 lg:grid-cols-2">
              {p.demo.examples.map((ex) => (
                <div key={ex.title} className={cn('p-4 sm:p-5', isendaiCard)}>
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className="inline-flex size-10 items-center justify-center rounded-xl text-lg"
                      style={{ backgroundColor: `${ISENDAI_ACCENT}18` }}
                    >
                      {ex.emoji}
                    </span>
                    <span className="font-semibold text-[#0A2540]">{ex.title}</span>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-rose-600">{p.demo.before}</p>
                      <p className="mt-2 text-sm leading-relaxed text-[#425466] sm:text-base">{ex.before}</p>
                    </div>
                    <div className="flex items-center justify-center py-1 lg:py-0">
                      <span
                        className="inline-flex size-10 items-center justify-center rounded-full border text-white"
                        style={{ borderColor: `${ISENDAI_ACCENT}40`, backgroundColor: ISENDAI_ACCENT }}
                      >
                        <MoveRight className="size-4" aria-hidden />
                      </span>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{p.demo.after}</p>
                      <p className="mt-2 text-sm leading-relaxed text-[#425466] sm:text-base">{ex.after}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={cn(isendaiPageSection, 'bg-white')}>
        <div className="container-marketing">
          <div className={isendaiSectionCard}>
            <h2 className={cn('text-2xl sm:text-3xl lg:text-4xl', isendaiHeading)}>{p.how.title}</h2>
            <p className={cn('mt-4', isendaiBody)}>{p.how.subtitle}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {p.how.steps.map((step, i) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-[#E6EBF1] p-5"
                  style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FFFFFF 100%)' }}
                >
                  <span
                    className="inline-flex size-9 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ backgroundColor: ISENDAI_ACCENT }}
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-[#0A2540]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#425466]">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={cn(isendaiPageSection, isendaiMutedSection)}>
        <div className="container-marketing">
          <div className={isendaiSectionCard}>
            <h2 className={cn('text-2xl sm:text-3xl', isendaiHeading)}>{p.tools.title}</h2>
            <p className={cn('mt-3', isendaiBody)}>{p.tools.subtitle}</p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {p.tools.items.map((tool, index) => (
                <div
                  key={index}
                  className="rounded-2xl border p-6"
                  style={{
                    borderColor: `${ISENDAI_ACCENT}30`,
                    background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
                  }}
                >
                  <h3 className="font-semibold text-[#0A2540]">{tool.title}</h3>
                  <p className="mt-2 text-sm text-[#425466]">{tool.slogan}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-white">
        <div className="container-marketing">
          <div
            className="rounded-3xl px-6 py-12 sm:px-12 sm:py-14 text-center"
            style={{
              background: 'linear-gradient(135deg, #0A2540 0%, #1a4a6e 50%, #0A2540 100%)',
            }}
          >
            <div className="flex justify-center">
              <ProductMenuIcon product="isendai" size={56} />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mt-6 mb-4">
              {language === 'tr' ? 'Hazır mısınız?' : 'Ready to try?'}
            </h2>
            <p className="text-base sm:text-lg text-white/75 mb-10 max-w-xl mx-auto px-2">
              {language === 'tr'
                ? 'Tam uygulama isendai.com üzerinde — akıllı yönlendirme, tüm araçlar ve kredi paketleri.'
                : 'Full app at isendai.com — smart routing, every tool, and credit packs.'}
            </p>
            <a href={isendaiAppUrl} {...appLink} className="inline-flex">
              <Button
                size="lg"
                className="rounded-full px-8 bg-white text-[#0A2540] hover:bg-[#F6F9FC] font-semibold shadow-md"
              >
                {p.primaryCta}
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
