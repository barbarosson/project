'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'
import { useSiteConfig } from '@/contexts/site-config-context'

export function FinalCTASection() {
  const { t, language } = useLanguage()
  const { config } = useSiteConfig()

  const benefits = [
    t.marketing.finalCta.freeTrial,
    t.marketing.finalCta.noCreditCard,
    t.marketing.finalCta.cancelAnytime,
    t.marketing.finalCta.setupMinutes,
  ]

  return (
    <section className="section-spacing">
      <div className="container-marketing">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-12 lg:p-16 text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-balance">
              {config ? (language === 'en' ? config.final_cta_title_en : config.final_cta_title_tr) : t.marketing.finalCta.title}
            </h2>

            <p className="text-xl text-white/90 mb-8 text-balance">
              {config ? (language === 'en' ? config.final_cta_subtitle_en : config.final_cta_subtitle_tr) : t.marketing.finalCta.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/contact">
                <Button size="lg" variant="secondary" className="gap-2 text-lg px-8">
                  {config ? (language === 'en' ? config.final_cta_button_text_en : config.final_cta_button_text_tr) : t.marketing.finalCta.bookDemo}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 text-lg px-8 bg-transparent text-white border-white hover:bg-white/10"
                >
                  {t.marketing.finalCta.startFreeTrial}
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 pt-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-sm text-white/90">
                  <CheckCircle2 className="h-4 w-4" />
                  {benefit}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/20">
              <p className="text-sm text-white/80">
                💬 {t.marketing.finalCta.responseTime}
                <Link href="/contact" className="ml-2 underline hover:text-white">
                  {t.marketing.finalCta.contactUs}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
