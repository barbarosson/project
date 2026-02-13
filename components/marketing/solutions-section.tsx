'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Building2, ShoppingBag, Warehouse, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'

export function SolutionsSection() {
  const { t } = useLanguage()

  const solutions = [
    {
      icon: Building2,
      title: t.marketing.solutions.manufacturing,
      description: t.marketing.solutions.manufacturingDesc,
      benefits: ['Production planning', 'Supply chain management', 'Quality control'],
    },
    {
      icon: ShoppingBag,
      title: t.marketing.solutions.retail,
      description: t.marketing.solutions.retailDesc,
      benefits: ['Omnichannel sync', 'Order management', 'Customer insights'],
    },
    {
      icon: Warehouse,
      title: t.marketing.solutions.distribution,
      description: t.marketing.solutions.distributionDesc,
      benefits: ['Warehouse management', 'Route optimization', 'Fleet tracking'],
    },
    {
      icon: Briefcase,
      title: t.marketing.solutions.professional,
      description: t.marketing.solutions.professionalDesc,
      benefits: ['Project management', 'Time tracking', 'Client portal'],
    },
  ]

  return (
    <section id="solutions" className="section-spacing bg-gradient-to-br from-primary/5 to-transparent">
      <div className="container-marketing">
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              {t.marketing.solutions.eyebrow}
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            {t.marketing.solutions.title}
          </h2>
          <p className="text-lg text-auto-contrast-muted-light max-w-2xl mx-auto">
            {t.marketing.solutions.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {solutions.map((solution, index) => {
            const Icon = solution.icon
            return (
              <Card key={index} className="p-8 bg-white hover:shadow-xl transition-all">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-3">{solution.title}</h3>

                    <p className="text-auto-contrast-muted-light mb-4 leading-relaxed">
                      {solution.description}
                    </p>

                    <ul className="space-y-2 mb-6">
                      {solution.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-auto-contrast-muted-light">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          {benefit}
                        </li>
                      ))}
                    </ul>

                    <Link href={`#${solution.title.toLowerCase()}`}>
                      <Button variant="link" className="px-0 gap-1">
                        {t.marketing.solutions.exploreSolution}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
