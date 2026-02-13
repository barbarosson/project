'use client'

import { Card } from '@/components/ui/card'
import {
  Users,
  Package,
  FileText,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useSiteConfig } from '@/contexts/site-config-context'

export function FeaturesSection() {
  const { t, language } = useLanguage()
  const { config } = useSiteConfig()

  const features = [
    {
      icon: Users,
      title: t.marketing.features.customerManagement,
      description: t.marketing.features.customerManagementDesc,
      link: '#',
    },
    {
      icon: Package,
      title: t.marketing.features.inventoryControl,
      description: t.marketing.features.inventoryControlDesc,
      link: '#',
    },
    {
      icon: FileText,
      title: t.marketing.features.smartInvoicing,
      description: t.marketing.features.smartInvoicingDesc,
      link: '#',
    },
    {
      icon: TrendingUp,
      title: t.marketing.features.financialAnalytics,
      description: t.marketing.features.financialAnalyticsDesc,
      link: '#',
    },
    {
      icon: Shield,
      title: t.marketing.features.enterpriseSecurity,
      description: t.marketing.features.enterpriseSecurityDesc,
      link: '#',
    },
    {
      icon: Zap,
      title: t.marketing.features.lightningFast,
      description: t.marketing.features.lightningFastDesc,
      link: '#',
    },
  ]

  return (
    <section id="features" className="section-spacing">
      <div className="container-marketing">
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              {t.marketing.features.eyebrow}
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            {config ? (language === 'en' ? config.features_title_en : config.features_title_tr) : t.marketing.features.title}
          </h2>
          <p className="text-lg text-auto-contrast-muted-light max-w-2xl mx-auto">
            {config ? (language === 'en' ? config.features_subtitle_en : config.features_subtitle_tr) : t.marketing.features.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className="p-8 hover:shadow-lg transition-all hover:-translate-y-1 bg-white border-2 hover:border-primary/20"
              >
                <div className="mb-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>

                <p className="text-auto-contrast-muted-light leading-relaxed mb-4">
                  {feature.description}
                </p>

                <a
                  href={feature.link}
                  className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  {t.marketing.features.learnMore}
                  <span>→</span>
                </a>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
