'use client'

import Link from 'next/link'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { getCorporateCopy } from '@/lib/corporate-marketing-copy'
import { MarketingLayout } from './marketing-layout'
import { Button } from '@/components/ui/button'

const ISENDAI_URL = process.env.NEXT_PUBLIC_ISENDAI_URL ?? 'https://isendai.com'

export function IsendaiProductContent() {
  const { language } = useLanguage()
  const c = getCorporateCopy(language)
  const p = c.isendaiPage

  return (
    <MarketingLayout>
      <div className="pt-[80px]">
        <section
          className="relative overflow-hidden py-20 lg:py-28"
          style={{
            background:
              'linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 45%, #F6F9FC 100%)',
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[420px] w-[720px] rounded-full opacity-40 blur-3xl"
            style={{
              background: 'radial-gradient(circle, #A78BFA 0%, transparent 65%)',
            }}
          />
          <div className="relative mx-auto px-6 sm:px-8 max-w-[1280px] text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-violet-600 mb-4">
              {p.eyebrow}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-violet-800 text-sm font-semibold mb-6">
              <Sparkles className="h-4 w-4" />
              Songurtech · MODULUS
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0A2540] mb-6">
              {p.title}
            </h1>
            <p className="text-lg sm:text-xl text-[#425466] max-w-2xl mx-auto mb-10 leading-relaxed">
              {p.subtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href={ISENDAI_URL} target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="rounded-full px-8 font-semibold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                  }}
                >
                  {p.primaryCta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 font-semibold border-violet-300 text-[#0A2540] hover:bg-violet-50"
                >
                  {p.secondaryCta}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20 bg-white">
          <div className="mx-auto px-6 sm:px-8 max-w-[720px]">
            <ul className="space-y-5">
              {p.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-4 rounded-2xl border border-[#E6EBF1] bg-[#F6F9FC] px-6 py-5"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100">
                    <Check className="h-4 w-4 text-violet-700" />
                  </span>
                  <span className="text-lg text-[#0A2540] font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-12 text-center">
              <Link
                href="/"
                className="text-sm font-semibold text-[#425466] hover:text-[#0A2540]"
              >
                ← {language === 'tr' ? 'Tüm MODULUS ürünleri' : 'All MODULUS products'}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  )
}
