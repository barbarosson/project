'use client'

import { Button } from '@/components/ui/button'
import { Search, Settings, LineChart, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'
import { useSiteConfig } from '@/contexts/site-config-context'

export function HowItWorksSection() {
  const { t, language } = useLanguage()
  const { config } = useSiteConfig()

  const steps = [
    {
      number: '01',
      icon: Search,
      title: t.marketing.howItWorks.discover,
      description: t.marketing.howItWorks.discoverDesc,
      details: ['Free consultation', 'Process audit', 'Custom recommendations'],
    },
    {
      number: '02',
      icon: Settings,
      title: t.marketing.howItWorks.implement,
      description: t.marketing.howItWorks.implementDesc,
      details: ['Guided setup', 'Data migration', 'Team training'],
    },
    {
      number: '03',
      icon: LineChart,
      title: t.marketing.howItWorks.measure,
      description: t.marketing.howItWorks.measureDesc,
      details: ['Performance metrics', 'Ongoing support', 'Continuous optimization'],
    },
  ]

  return (
    <section id="how-it-works" className="section-spacing">
      <div className="container-marketing">
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              {t.marketing.howItWorks.eyebrow}
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            {config ? (language === 'en' ? config.how_it_works_title_en : config.how_it_works_title_tr) : t.marketing.howItWorks.title}
          </h2>
          <p className="text-lg text-auto-contrast-muted-light max-w-2xl mx-auto">
            {config ? (language === 'en' ? config.how_it_works_subtitle_en : config.how_it_works_subtitle_tr) : t.marketing.howItWorks.subtitle}
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isLast = index === steps.length - 1

              return (
                <div key={index} className="relative">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                          <Icon className="h-10 w-10 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-sm font-bold text-primary">
                          {step.number}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 pt-2">
                      <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                      <p className="text-lg text-auto-contrast-muted-light mb-4 leading-relaxed">
                        {step.description}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {step.details.map((detail, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                          >
                            {detail}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {!isLast && (
                    <div className="hidden md:block absolute left-10 top-20 bottom-0 w-0.5 bg-gradient-to-b from-primary to-primary/20 -translate-y-8"></div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-16 text-center">
            <div className="inline-flex flex-col sm:flex-row gap-4 items-center">
              <Link href="/contact">
                <Button size="lg" className="gap-2">
                  {t.marketing.howItWorks.startJourney}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <p className="text-sm text-auto-contrast-muted-light">
                {t.marketing.howItWorks.averageSetup} <span className="font-semibold text-foreground">{t.marketing.howItWorks.days}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
